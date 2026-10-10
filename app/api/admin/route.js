import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { adminUser, reviewUser } from "@/lib/admin";
import { aplicarCK } from "@/lib/ck";
import { canAdmin, canStaff } from "@/lib/roles";
import { erlcComando } from "@/lib/erlc";
import { configAuto, REGLAS } from "@/lib/erlcauto";
import { enviarApertura, aperturaListo } from "@/lib/apertura";
import { descongelarCuerpo } from "@/lib/cuerpo";
import { RANGOS_POR_DEPTO, DEPTOS } from "@/lib/mdt";
import { LUGARES } from "@/lib/zonas";
import { BANCOS } from "@/lib/bancos";
import { nuevaCuenta } from "@/lib/tarjeta";
import { OPS, numeroDe } from "@/lib/redes";
import { nuevaPlaca, registrarPlaca } from "@/lib/placa";
import { nombreDe } from "@/lib/rol";
import { NEGOCIO_DE } from "@/lib/negocios";
import { licTipo, numeroLicencia } from "@/lib/licencia";
const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const CATS = ["Concesionario", "Propiedades", "Licencias", "Objetos", "Armas", "Herramientas", "Telefonía", "Tecnología"];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), str = (s, n = 80) => String(s || "").trim().slice(0, n), up = (s, n = 40) => str(s, n).replace(/\s+/g, " ").toUpperCase();
const money = (n) => "$" + Number(n).toLocaleString("es");
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
export async function GET(req) {
  const a = await adminUser(); if (!a) return err("Sin permiso", 403);
  const p = new URL(req.url).searchParams, d = await db(), users = d.collection("users"), uid = p.get("uid");
  if (uid) {
    const x = await users.findOne({ id: uid }); if (!x) return err("Usuario no existe", 404);
    return NextResponse.json({ user: { id: x.id, name: x.name, balance: x.balance || 0, cedula: x.cedula || null, chip: x.chip?.num || null, plan: x.plan ? { monto: x.plan.monto } : null, cuentas: Object.fromEntries(Object.entries(x.cuentas || {}).map(([k, c]) => [k, { saldo: c.saldo }])), inventory: (x.inventory || []).map((i) => ({ name: i.name, category: i.category, price: i.price, at: i.at })) } });
  }
  const q = str(p.get("q"), 40); if (!q) return NextResponse.json({ users: [] });
  const rx = new RegExp(esc(q), "i"), dg = q.replace(/\D/g, "").replace(/^0+/, "");
  const r = await users.find({ $or: [{ id: q }, { name: rx }, { "cedula.roblox": rx }, { "cedula.nombres": rx }, { "cedula.apellidos": rx }, ...(dg ? [{ "cedula.num": dg }] : [])] }).limit(10).toArray();
  return NextResponse.json({ users: r.map((x) => ({ id: x.id, name: x.name, cedula: x.cedula ? { num: x.cedula.num, nombres: x.cedula.nombres, apellidos: x.cedula.apellidos, roblox: x.cedula.roblox } : null })) });
}
export async function POST(req) {
  const a = await reviewUser(); if (!a) return err("Sin permiso", 403);
  const b = await req.json(), d = await db(), users = d.collection("users"), at = new Date();
  const razon = str(b.razon, 300);
  if (!canAdmin(a.rank) && !["roboOk", "roboNo", "apelOk", "apelNo", "trabajoOk", "trabajoNo"].includes(b.a)) return err("Tu rango solo puede revisar solicitudes", 403);
  // Toda acción administrativa (salvo marcar un reporte como resuelto) exige razón y queda en la colección "audit".
  if (!["done", "roboOk", "trabajoOk", "staffSet", "staffDel", "agenteSet", "agenteDel", "erlcTest", "erlcCmd", "erlcAuto", "apertura"].includes(b.a) && razon.length < 3) return err("La razón es obligatoria");
  const log = (act, objetivo, detalle) => d.collection("audit").insertOne({ by: a.id, byName: a.name, rank: a.rank, act, objetivo, razon, detalle, at });
  const t = b.uid ? await users.findOne({ id: str(b.uid, 30) }) : null, quien = t ? `${t.name} (${t.id})` : null;
  if (b.uid && !t) return err("Usuario no existe", 404);
  switch (b.a) {
    case "apertura": { // votación / abrir / cerrar el servidor: se envía por el webhook de Discord (solo Developer, Fundación, Junta Directiva y Asuntos Internos)
      if (!aperturaListo()) return err("Falta la variable DISCORD_WEBHOOK_APERTURA en Vercel (la URL del webhook del canal de aperturas)");
      const tipo = ["votacion", "abrir", "cerrar"].includes(b.tipo) ? b.tipo : null; if (!tipo) return err("Acción inválida");
      const prev = await d.collection("config").findOne({ _id: "apertura" }); if (prev && Date.now() - +new Date(prev.at) < 15000) return err("Espera unos segundos antes de enviar otro mensaje");
      const n = str(b.nota, 200), quien = nombreDe(a) || a.name, r = await enviarApertura(tipo, n);
      await log(`apertura:${tipo}`, r.ok ? "Enviado a Discord" : `Falló: ${r.error}`, { nota: n });
      if (!r.ok) return err(`No se pudo enviar: ${r.error}`);
      // Solo "abrir" y "cerrar" cambian el estado del servidor (la votación no): con el servidor cerrado el hambre y la sed no bajan
      const est = { tipo, por: quien, nota: n, at }, extra = {};
      if (tipo === "cerrar" && prev?.servidor !== "cerrado") { est.servidor = "cerrado"; est.cerradoDesde = at; }
      if (tipo === "abrir") { est.servidor = "abierto"; est.abiertoAt = at; if (prev?.servidor === "cerrado" && prev.cerradoDesde) await descongelarCuerpo(d, +at - +new Date(prev.cerradoDesde)); extra.$unset = { cerradoDesde: "" }; }
      await d.collection("config").updateOne({ _id: "apertura" }, { $set: est, ...extra }, { upsert: true }); return NextResponse.json({ ok: true });
    }
    case "erlcTest": { // prueba de la conexión con ER:LC: envía :h al servidor
      const texto = String(b.msg || "").replace(/[\r\n]+/g, " ").trim().slice(0, 100) || "Prueba de conexión del portal VE-RP, la API funciona.", r = await erlcComando(":h " + texto); await log("erlcTest", r.ok ? "Conexión OK" : `Falló: ${r.error}`, {});
      if (!r.ok) return err(`No se pudo enviar el comando: ${r.error}`); return NextResponse.json({ ok: true });
    }
    case "erlcCmd": { // ejecutar CUALQUIER comando de ER:LC desde Administración (ej: :h hola, :announce ..., :kick usuario)
      const cmd = String(b.cmd || "").replace(/[\r\n]+/g, " ").trim().slice(0, 300); if (!cmd) return err("Escribe el comando");
      const co = cmd.startsWith(":") ? cmd : ":" + cmd, r = await erlcComando(co); await log("erlcCmd", co.slice(0, 80), { ok: r.ok, error: r.error || null });
      if (!r.ok) return err(`No se pudo enviar el comando: ${r.error}`); return NextResponse.json({ ok: true });
    }
    case "erlcAuto": { // guardar los mensajes automáticos (bienvenida y reglas)
      const n = (v, mn, mx, df) => { const x = Math.floor(Number(v)); return Number.isFinite(x) ? Math.min(mx, Math.max(mn, x)) : df; }, lista = (Array.isArray(b.lista) ? b.lista : String(b.lista || "").split("\n")).map((x) => str(x, 200)).filter(Boolean).slice(0, 60);
      const set = { "bienv.on": !!b.bienvOn, "bienv.texto": str(b.bienvTexto, 200) || "🌴 ¡Bienvenido a VE:RP!", "bienv.cadaMin": n(b.bienvCada, 1, 60, 5), "bienv.durMin": n(b.bienvDur, 1, 180, 20), "reglas.on": !!b.reglasOn, "reglas.cadaMin": n(b.reglasCada, 1, 240, 10), "reglas.lista": lista.length ? lista : REGLAS };
      await d.collection("config").updateOne({ _id: "erlcAuto" }, { $set: set }, { upsert: true }); await log("erlcAuto", "Mensajes automáticos", { bienv: set["bienv.on"], reglas: set["reglas.on"] }); return NextResponse.json({ ok: true });
    }
    case "editCedula": {
      if (!t.cedula) return err("Ese usuario no tiene cédula");
      const c = b.cedula || {}, set = {}, antes = {};
      for (const k of ["nombres", "apellidos", "edoCivil", "roblox"]) if (c[k] !== undefined && str(c[k])) { set[`cedula.${k}`] = k === "roblox" ? str(c[k], 30) : up(c[k]); antes[k] = t.cedula[k]; }
      if (c.lugar) { if (!LUGARES[c.lugar]) return err("Lugar de nacimiento inválido"); set["cedula.lugar"] = c.lugar; antes.lugar = t.cedula.lugar; }
      if (c.nac) { const n = new Date(c.nac); if (isNaN(n)) return err("Fecha inválida"); set["cedula.nac"] = n; antes.nac = t.cedula.nac; }
      if (!Object.keys(set).length) return err("No hay cambios");
      await users.updateOne({ id: t.id }, { $set: set }); await log("editCedula", quien, { antes, despues: set }); break;
    }
    case "dinero": {
      const m = Math.floor(Number(b.monto)), sg = b.tipo === "quitar" ? -1 : 1, dest = b.destino || "efectivo"; if (!(m > 0) || m > 1e9) return err("Monto inválido");
      if (dest !== "efectivo" && !t.cuentas?.[dest]) return err("El usuario no tiene esa cuenta");
      const k = dest === "efectivo" ? "balance" : `cuentas.${dest}.saldo`, f = { id: t.id }; if (sg < 0) f[k] = { $gte: m };
      if (!(await users.updateOne(f, { $inc: { [k]: sg * m } })).modifiedCount) return err("Saldo insuficiente para quitar");
      await d.collection("tx").insertOne({ user: t.id, type: "admin", item: `Ajuste administrativo (${dest})`, amount: sg * m, at });
      await d.collection("notifs").insertOne({ uid: t.id, title: sg > 0 ? "Saldo añadido" : "Saldo descontado", body: `Un administrador ${sg > 0 ? "agregó" : "quitó"} $${m.toLocaleString("es")} (${dest}).`, at, read: false });
      await log(sg > 0 ? "darDinero" : "quitarDinero", quien, { monto: m, destino: dest }); break;
    }
    case "invAgregar": {
      const id = oid(b.itemId), it = id && (await d.collection("items").findOne({ _id: id })); if (!it) return err("Artículo no existe", 404);
      const pl = it.category === "Concesionario" ? await nuevaPlaca(d, { modelo: it.name, dueno: t.id, duenoN: nombreDe(t) }) : null;
      await users.updateOne({ id: t.id }, { $push: { inventory: { name: it.name, category: it.category, price: it.price, at, admin: true, sku: it.sku || null, tipo: it.tipo || null, ubicacion: it.ubicacion || null, img: it.img || null, placa: pl, vence: it.dias ? new Date(Date.now() + it.dias * 864e5) : null, licNum: licTipo(it) ? numeroLicencia(licTipo(it)) : null } } });
      await d.collection("notifs").insertOne({ uid: t.id, title: "Artículo recibido", body: `Un administrador agregó ${it.name} a tu inventario.`, at, read: false });
      await log("invAgregar", quien, { item: it.name }); break;
    }
    case "invQuitar": {
      const n = new Date(b.at); if (isNaN(n)) return err("Artículo inválido");
      const r = await users.updateOne({ id: t.id }, { $pull: { inventory: { name: str(b.name, 120), at: n } } }); if (!r.modifiedCount) return err("No se encontró ese artículo", 404);
      await log("invQuitar", quien, { item: str(b.name, 120) }); break;
    }
    case "ck": {
      if (b.confirm !== "CK") return err('Escribe "CK" para confirmar'); if (t.id === a.id) return err("No puedes aplicarte CK a ti mismo");
      const num = t.chip?.num, snap = { cedula: t.cedula ? { num: t.cedula.num, nombres: t.cedula.nombres, apellidos: t.cedula.apellidos, roblox: t.cedula.roblox } : null, efectivo: t.balance, cuentas: Object.fromEntries(Object.entries(t.cuentas || {}).map(([k, c]) => [k, c.saldo])), articulos: (t.inventory || []).length, chip: num || null };
      await aplicarCK(d, t);
      await log("CK", quien, snap); break;
    }
    case "addItem": {
      const price = Number(b.price), cat = str(b.category, 30), imp = Number(b.impuesto || 0);
      if (!str(b.name) || !Number.isFinite(price) || price < 0) return err("Nombre o precio inválido"); if (!CATS.includes(cat)) return err("Categoría inválida");
      if (cat === "Propiedades" && !str(b.ubicacion)) return err("Las propiedades necesitan ubicación (ej: Caracas 405)");
      const doc = { name: str(b.name), category: cat, negocio: NEGOCIO_DE[cat] || null, price, desc: str(b.desc, 400), brand: str(b.brand), year: str(b.year, 10), clase: str(b.clase, 30), ubicacion: str(b.ubicacion, 80), impuesto: Number.isFinite(imp) && imp > 0 ? imp : 0, img: str(b.img, 500), stock: b.stock ? Math.floor(Number(b.stock)) || -1 : -1 };
      await d.collection("items").insertOne(doc); await log("addItem", doc.name, { price, category: cat }); break;
    }
    case "cuentaQuitar": {
      const k = b.banco; if (!BANCOS[k] || !t.cuentas?.[k]) return err("No tiene esa tarjeta");
      await users.updateOne({ id: t.id }, { $unset: { [`cuentas.${k}`]: "" } }); await log("cuentaQuitar", quien, { banco: k, saldoPerdido: t.cuentas[k].saldo }); break;
    }
    case "cuentaDar": {
      const k = b.banco; if (!BANCOS[k]) return err("Banco inválido"); if (t.cuentas?.[k]) return err("Ya tiene esa tarjeta");
      const cu = await nuevaCuenta(k); if (BANCOS[k].semanal) cu.proximo = new Date(Date.now() + 7 * 864e5);
      await users.updateOne({ id: t.id, [`cuentas.${k}`]: { $exists: false } }, { $set: { [`cuentas.${k}`]: cu } });
      await d.collection("notifs").insertOne({ uid: t.id, title: "Tarjeta entregada", body: `Un administrador te entregó la tarjeta ${BANCOS[k].nombre}.`, at, read: false }); await log("cuentaDar", quien, { banco: k }); break;
    }
    case "chipQuitar": { if (!t.chip) return err("No tiene chip"); await users.updateOne({ id: t.id }, { $unset: { chip: "", plan: "" } }); await log("chipQuitar", quien, { numero: t.chip.num }); break; }
    case "chipDar": {
      if (t.chip) return err("Ya tiene chip"); if (!t.cedula) return err("No tiene cédula"); let num = null;
      for (const op of [...OPS].sort(() => Math.random() - 0.5)) { const n = numeroDe(t.cedula.num, op); if (!(await users.findOne({ "chip.num": n }))) { num = n; break; } }
      if (!num) return err("No hay número libre para esa cédula"); await users.updateOne({ id: t.id }, { $set: { chip: { num, nombre: "", at } } }); await log("chipDar", quien, { numero: num }); break;
    }
    case "planQuitar": { if (!t.plan) return err("No tiene plan"); await users.updateOne({ id: t.id }, { $unset: { plan: "" } }); await log("planQuitar", quien, { monto: t.plan.monto }); break; }
    case "addCasas": {
      const tipo = String(b.tipo); if (!["0", "1", "2", "3", "4"].includes(tipo)) return err("Tipo de casa inválido");
      let h; try { h = new URL(b.img); } catch { return err("Link de imagen inválido"); } if (h.protocol !== "https:") return err("La imagen debe ser un link https (Discord)");
      const region = str(b.region, 40), price = Number(b.price), imp = Number(b.impuesto || 0); if (!region || !Number.isFinite(price) || price < 0) return err("Región o precio inválido");
      const nums = []; for (const p of String(b.numeros || "").split(/[\s,;]+/).filter(Boolean)) { const m = /^(\d+)-(\d+)$/.exec(p); if (m) { for (let i = +m[1]; i <= +m[2] && nums.length <= 500; i++) nums.push(String(i)); } else if (/^\d+$/.test(p)) nums.push(p); else return err(`Número inválido: ${p}`); }
      if (!nums.length || nums.length > 500) return err("Escribe de 1 a 500 números de casa (puedes usar rangos: 401-420)");
      const col = d.collection("items"), ya = new Set((await col.find({ category: "Propiedades", tipo, region, numero: { $in: nums } }, { projection: { numero: 1 } }).toArray()).map((x) => x.numero)), nuevos = [...new Set(nums)].filter((n) => !ya.has(n));
      if (nuevos.length) await col.insertMany(nuevos.map((n) => ({ name: `Casa tipo ${tipo}`, category: "Propiedades", tipo, region, numero: n, ubicacion: `${region} ${n}`, price, impuesto: imp > 0 ? imp : 0, img: h.href, desc: `Casa tipo ${tipo} en ${region}`, brand: "", year: "", clase: "", stock: 1 })));
      await log("addCasas", `Tipo ${tipo} · ${region}`, { creadas: nuevos.length, repetidas: nums.length - nuevos.length, price }); break;
    }
    case "setPrice": {
      const id = oid(b.id); if (!id) return err("Datos inválidos"); const set = {};
      for (const k of ["price", "impuesto"]) if (b[k] !== "" && b[k] != null) { const n = Number(b[k]); if (!Number.isFinite(n) || n < 0) return err(`${k} inválido`); set[k] = n; }
      if (!Object.keys(set).length) return err("No hay cambios"); const it = await d.collection("items").findOneAndUpdate({ _id: id }, { $set: set }); if (!it) return err("Artículo no existe", 404);
      await log("setPrice", it.name, { antes: { price: it.price, impuesto: it.impuesto }, despues: set }); break;
    }
    case "delItem": {
      const id = oid(b.id), it = id && (await d.collection("items").findOneAndDelete({ _id: id })); if (!it) return err("Artículo no existe", 404);
      await log("delItem", it.name, { price: it.price }); break;
    }
    case "done": {
      const id = oid(b.id); if (!id) return err("ID inválido");
      await d.collection("reports").updateOne({ _id: id }, { $set: { estado: "resuelto" } });
      await d.collection("audit").insertOne({ by: a.id, byName: a.name, rank: a.rank, act: "reporte911", objetivo: String(id), razon: "Reporte resuelto", at }); break;
    }
    case "staffSet": case "staffDel": { // solo el Developer asigna el staff de Administración
      if (!canStaff(a.rank)) return err("Solo Developer, Fundación y Asuntos Internos asignan staff", 403);
      if (b.a === "staffDel") { if (!t) return err("Falta el usuario"); if (t.dev) return err("No se puede quitar al Developer", 403); await users.updateOne({ id: t.id }, { $unset: { staff: "", staffPlaca: "" } }); await log("staffDel", quien, {}); break; }
      const x = await users.findOne({ name: new RegExp("^" + esc(str(b.username, 40)) + "$", "i") }); if (!x) return err("Esa persona debe iniciar sesión en el portal una vez primero");
      const rk = ["JUNTA_DIRECTIVA", "FUNDACION", "ASUNTOS_INTERNOS", "MODERACION"].includes(b.rango) ? b.rango : null; if (!rk) return err("Rango inválido");
      if (x.dev) return err("Ese usuario es Developer", 403); const placa = up(b.placa, 20); if (!placa) return err("La placa es obligatoria: sin ella no podrá entrar a Administración");
      if (await users.findOne({ staffPlaca: placa, id: { $ne: x.id } })) return err("Esa placa ya la tiene otro integrante del staff");
      await users.updateOne({ id: x.id }, { $set: { staff: rk, staffPlaca: placa }, $unset: { adminSesion: "" } }); await d.collection("notifs").insertOne({ uid: x.id, title: "Ahora eres staff", body: "Te asignaron un rango en Administración. Entra por el menú y escribe tu placa.", at, read: false }); await log("staffSet", `${x.name} (${x.id})`, { rango: rk }); break;
    }
    case "agenteSet": case "agenteDel": { // asigna o quita agentes de la MDT
      if (b.a === "agenteDel") { if (!t) return err("Falta el usuario"); await users.updateOne({ id: t.id }, { $unset: { agente: "", mdtSesion: "" } }); await log("agenteDel", quien, {}); break; }
      const x = await users.findOne({ name: new RegExp("^" + esc(str(b.username, 40)) + "$", "i") }); if (!x) return err("Esa persona debe iniciar sesión en el portal una vez primero");
      const depto = str(b.depto, 40), rango = RANGOS_POR_DEPTO[depto]?.includes(b.rango) ? b.rango : null, placa = up(b.placa, 20); if (!rango || !placa || !depto) return err("Completa departamento, rango y placa");
      if (!DEPTOS.includes(depto)) return err("Departamento inválido");
      if (await users.findOne({ "agente.placa": placa, id: { $ne: x.id } })) return err("Esa placa ya la tiene otro agente");
      await users.updateOne({ id: x.id }, { $set: { "agente.rango": rango, "agente.placa": placa, "agente.depto": depto } }); await d.collection("notifs").insertOne({ uid: x.id, title: "Asignado a la MDT", body: `${rango} · ${depto} · Placa ${placa}. Entra por el menú MDT y elige en qué banco quieres recibir tu sueldo.`, at, read: false }); await log("agenteSet", `${x.name} (${x.id})`, { rango, placa, depto }); break;
    }
    case "trabajoOk": case "trabajoNo": { // solicitudes de trabajo secundario: las revisa cualquier rango con acceso a Solicitudes (Moderación hasta Junta Directiva)
      const id = oid(b.id), tc = d.collection("trabajos"), r = id && (await tc.findOne({ _id: id, estado: "pendiente" })); if (!r) return err("Solicitud no encontrada o ya revisada", 404);
      if (r.user === a.id && !a.dev) return err("No puedes revisar tu propia solicitud", 403);
      if (b.a === "trabajoNo") {
        if (!(await tc.updateOne({ _id: id, estado: "pendiente" }, { $set: { estado: "rechazado", por: a.name, motivo: razon, resuelto: at } })).modifiedCount) return err("Ya fue revisada");
        await d.collection("notifs").insertOne({ uid: r.user, title: "Trabajo rechazado", body: `Tu solicitud de ${r.trabajoN} (${r.horas} h) fue rechazada: ${razon}`, at, read: false }); await log("trabajoNo", r.userName, { trabajo: r.trabajoN, horas: r.horas }); break;
      }
      if (!(await tc.updateOne({ _id: id, estado: "pendiente" }, { $set: { estado: "aprobado", por: a.name, resuelto: at } })).modifiedCount) return err("Ya fue revisada"); // se reclama primero para no pagar dos veces
      const dest = await users.findOne({ id: r.user }), k = r.cuenta && r.cuenta !== "efectivo" && dest?.cuentas?.[r.cuenta] ? r.cuenta : "efectivo";
      await users.updateOne({ id: r.user }, { $inc: { [k === "efectivo" ? "balance" : `cuentas.${k}.saldo`]: r.total } });
      await d.collection("tx").insertOne({ user: r.user, type: "trabajo", item: `Trabajo secundario: ${r.trabajoN} (${r.horas} h)`, amount: r.total, at });
      await d.collection("notifs").insertOne({ uid: r.user, title: "Trabajo aprobado", body: `Te pagaron $${r.total.toLocaleString("es")} por ${r.horas} h de ${r.trabajoN}.`, at, read: false }); await log("trabajoOk", r.userName, { trabajo: r.trabajoN, horas: r.horas, total: r.total, cuenta: k }); break;
    }
    case "roboOk": case "roboNo": {
      const id = oid(b.id), r = id && (await d.collection("robos").findOne({ _id: id, estado: "pendiente" })); if (!r) return err("Solicitud no encontrada", 404);
      if (b.a === "roboNo") {
        await d.collection("robos").updateOne({ _id: id }, { $set: { estado: "rechazado", por: a.name, motivo: razon, resuelto: at } });
        await d.collection("notifs").insertOne({ uid: r.user, title: "Robo rechazado", body: `Tu solicitud de robo (${r.modelo}) fue rechazada: ${razon}`, at, read: false }); await log("roboNo", r.modelo, { user: r.userName }); break;
      }
      await users.updateOne({ id: r.user }, { $push: { inventory: { name: r.modelo, category: "Concesionario", price: 0, at, sku: null, tipo: "vehiculo", img: r.img, placa: r.placa, color: r.color, specs: r.specs, robado: true } } });
      await d.collection("reportes").insertOne({ tipo: "Vehículo robado", modelo: r.modelo, color: r.color, placa: r.placa, specs: r.specs, estado: "pendiente", seg: [], at });
      await registrarPlaca(d, r.placa, { modelo: r.modelo, color: r.color, robado: true, estado: "Robado (sin propietario registrado)" });
      await d.collection("robos").updateOne({ _id: id }, { $set: { estado: "aprobado", por: a.name, resuelto: at } });
      await d.collection("notifs").insertOne({ uid: r.user, title: "Robo aprobado", body: `${r.modelo} (${r.placa}) ya está en tu inventario como ROBADO. La policía recibió el reporte.`, at, read: false }); await log("roboOk", r.modelo, { user: r.userName, placa: r.placa }); break;
    }
    case "apelOk": case "apelNo": {
      const id = oid(b.id), r = id && (await d.collection("apelaciones").findOne({ _id: id, estado: "pendiente" })); if (!r) return err("Apelación no encontrada", 404); const ok = b.a === "apelOk";
      await d.collection("apelaciones").updateOne({ _id: id }, { $set: { estado: ok ? "aprobada" : "denegada", por: a.name, motivo: razon, resuelto: at } });
      if (ok) await users.updateOne({ id: r.uid }, { $unset: { muerte: "" }, $set: { cuerpo: { comida: { n: 100, t: at }, agua: { n: 100, t: at } } } });
      await d.collection("notifs").insertOne({ uid: r.uid, title: ok ? "Apelación aprobada" : "Apelación denegada", body: ok ? "El Staff aprobó tu apelación: tu personaje sigue vivo con comida y agua al 100%." : `El Staff denegó tu apelación: ${razon}`, at, read: false });
      await log(b.a, r.nombre, { causa: r.causa }); break;
    }
    default: return err("Acción desconocida");
  }
  return NextResponse.json({ ok: true });
}
