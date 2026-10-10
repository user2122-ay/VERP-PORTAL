import { encarcelar, vigilarCondenas } from "@/lib/jail";
import { MEJORAS, DURACION, MAX_SEMANA, AVISO } from "@/lib/ministerio";
import { tickAutomatico } from "@/lib/erlcauto";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { nombreDe } from "@/lib/rol";
import { agenteDe, aprobador, casaRef, esMinistro, SEMANA, RANGOS_POR_DEPTO, claveSueldo, solo911 } from "@/lib/mdt";
import { BANCOS } from "@/lib/bancos";
import { NEGOCIOS } from "@/lib/negocios";
import { saldoTesoreria, egresarTesoreria, tasaITBMS, setTasa } from "@/lib/tesoreria";
import { normPlaca } from "@/lib/placa";
import { licTipo, tieneLic } from "@/lib/licencia";
import { estadoMulta, esPNB, PLAZO_MIN_DIAS, PLAZO_MAX_DIAS, MONTO_MAX } from "@/lib/multas";
import { estaRetenido, decomisable, MAX_DIAS_RETENCION } from "@/lib/decomiso";
import { enviarPush } from "@/lib/push";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), money = (n) => "$" + Number(n).toLocaleString("es"), txt = (s, n = 400) => String(s || "").trim().slice(0, n);
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
const COMISION = 0.05; // cada oficial presente en el arresto recibe el 5% de la multa cobrada
const fresca = (u) => !!(u.mdtSesion && Date.now() - +new Date(u.mdtSesion) < 35 * 6e4);
// Solo entra quien Administración asignó como agente (o el Developer) y ya ingresó su placa en las últimas 8 horas.
async function policia(libre = false) { const u = await apiUser(); const ag = u && agenteDe(u); if (!ag) return null; if (!libre && !fresca(u)) return null; return { ...u, ag }; }
const mu = (m) => ({ id: String(m._id), monto: m.monto, articulos: m.articulos || [], motivo: m.motivo || "", por: m.porName, sujetoN: m.sujetoN, at: m.at, vence: m.vence, estado: estadoMulta(m), pagadaAt: m.pagadaAt || null, desacato: m.desacato || null });
const pub = (x) => ({ id: x.id, label: `${x.cedula.nombres} ${x.cedula.apellidos} · ${x.cedula.roblox}`, num: x.cedula.num });

export async function GET(req) {
  try { await vigilarCondenas(await db()); } catch {}
  const p = new URL(req.url).searchParams, m = p.get("m");
  if (m === "estado") { const u = await policia(true); if (!u) return bad("Sin permiso", 403); return NextResponse.json({ ok: fresca(u), exp: fresca(u) ? +new Date(u.mdtSesion) + 35 * 6e4 : 0, ag: u.ag, nombre: nombreDe(u), discord: u.name, yo: u.id, aprueba: aprobador(u.ag), ministro: esMinistro(u.ag), pnb: esPNB(u.ag), emerg: solo911(u.ag) }); }
  const u = await policia(); if (!u) return bad("Sin sesión de la MDT", 401);
  const d = await db(), us = d.collection("users");
  if (solo911(u.ag) && !["rep", "sueldo"].includes(m)) return bad("Tu departamento solo ve los reportes 911 y tu sueldo", 403);
  if (m === "buscar") {
    const q = txt(p.get("q"), 40); if (q.length < 2) return NextResponse.json({ users: [] });
    const rx = new RegExp(esc(q), "i"), dg = q.replace(/\D/g, "").replace(/^0+/, "");
    return NextResponse.json({ users: (await us.find({ cedula: { $exists: true }, $or: [{ "cedula.roblox": rx }, { "cedula.nombres": rx }, { "cedula.apellidos": rx }, ...(dg ? [{ "cedula.num": dg }] : [])] }).limit(10).toArray()).map(pub) });
  }
  if (m === "ficha") {
    const x = await us.findOne({ id: txt(p.get("id"), 30), cedula: { $exists: true } }); if (!x) return bad("No existe", 404);
    const ar = await d.collection("arrestos").find({ sujeto: x.id }).sort({ at: -1 }).limit(30).toArray(), ex = await d.collection("expedientes").find({ sujetos: x.id }).sort({ at: -1 }).limit(20).toArray();
    // Lo que lleva ENCIMA (no guardado en casa): para ver si hay cosas ilegales. Las licencias, casas y autos se muestran aparte.
    const conArma = tieneLic(x, "armas"), encima = (x.inventory || []).filter((i) => i.loc !== "casa" && !i.plantada && !["Propiedades", "Licencias", "Concesionario"].includes(i.category))
      .map((i) => { const ilegal = i.robado ? "Robado" : i.category === "Sustancias" ? "Sustancia ilegal" : i.category === "Armas" && !conArma ? "Arma sin licencia" : ""; return { name: i.name, category: i.category || "", cant: Number(i.cant) > 0 ? Number(i.cant) : 1, ilegal, ret: estaRetenido(i) ? i.retenido.hasta : null }; })
      .sort((p, q) => (q.ilegal ? 1 : 0) - (p.ilegal ? 1 : 0) || p.name.localeCompare(q.name));
    return NextResponse.json({ encima, licencias: (x.inventory || []).filter((i) => licTipo(i)).map((i) => ({ tipo: licTipo(i), num: i.licNum || "—", at: i.at, ret: estaRetenido(i) ? i.retenido.hasta : null })), cedula: x.cedula, linea: x.chip?.num || null, autos: (x.inventory || []).filter((i) => i.category === "Concesionario").map((i) => ({ name: i.name, placa: i.placa || "", robado: !!i.robado, color: i.color || "", detalles: i.detalles || [], img: i.img || "", ret: estaRetenido(i) ? i.retenido.hasta : null })), retenidos: (x.inventory || []).filter(estaRetenido).map((i) => ({ name: i.name, category: i.category, hasta: i.retenido.hasta, por: i.retenido.porName, motivo: i.retenido.motivo || "" })), multas: (await d.collection("multas").find({ sujeto: x.id }).sort({ at: -1 }).limit(30).toArray()).map(mu),
      arrestos: ar.map((a) => ({ id: String(a._id), cargos: a.cargos, multa: a.multa, cobrado: a.cobrado, minutos: a.minutos, por: a.porName, at: a.at })), expedientes: ex.map((e) => ({ id: String(e._id), titulo: e.titulo, estado: e.estado })) });
  }
  if (m === "casas") { // ciudadanos con sus casas (para solicitar allanamiento)
    const q = txt(p.get("q"), 40); if (q.length < 2) return NextResponse.json({ users: [] });
    const rx = new RegExp(esc(q), "i"), dg = q.replace(/\D/g, "").replace(/^0+/, "");
    const r = await us.find({ cedula: { $exists: true }, "inventory.category": "Propiedades", $or: [{ "cedula.roblox": rx }, { "cedula.nombres": rx }, { "cedula.apellidos": rx }, ...(dg ? [{ "cedula.num": dg }] : [])] }).limit(8).toArray();
    return NextResponse.json({ users: r.map((x) => ({ ...pub(x), casas: (x.inventory || []).filter((i) => i.category === "Propiedades").map((i) => ({ name: i.name, at: new Date(i.at).toISOString(), ubicacion: i.ubicacion || "", color: i.color || "" })) })) });
  }
  if (m === "allan") {
    const l = await d.collection("allanamientos").find().sort({ at: -1 }).limit(40).toArray();
    return NextResponse.json({ aprueba: aprobador(u.ag), yo: u.id, l: l.map((x) => ({ id: String(x._id), duenoN: x.duenoN, casa: x.casaName, ubicacion: x.ubicacion, motivo: x.motivo, estado: x.estado, por: x.porName, porId: x.por, resolvio: x.resolvio || null, at: x.at, vence: x.vence || null })) });
  }
  if (m === "placa") { // buscar un auto por matrícula o por modelo: foto del concesionario, especificaciones y dueño oficial (si el auto se vendió en la Dark Web, ya no figura)
    const raw = txt(p.get("q"), 40), key = normPlaca(raw); if (key.length < 3) return NextResponse.json({ p: null });
    const armar = async (r0) => {
      let r = r0, dueno = null, it = null;
      if (!r.modelo || !r.img) { it = await d.collection("items").findOne({ name: r.modelo, category: "Concesionario" }); }
      if (r.dueno) { const o = await us.findOne({ id: r.dueno, cedula: { $exists: true } }); if (o) { dueno = pub(o); const inv = (o.inventory || []).find((i) => normPlaca(i.placa) === normPlaca(r.placa)); if (inv) r = { ...r, color: r.color || inv.color || "", detalles: r.detalles || inv.detalles || [] }; } }
      return { placa: r.placa, modelo: r.modelo, color: r.color || "", detalles: r.detalles || [], robado: !!r.robado, estado: r.estado, dueno,
        img: r.img || it?.img || "", marca: r.brand || it?.brand || "", anio: r.year || it?.year || "", clase: r.clase || it?.clase || "", desc: r.desc || it?.desc || "" };
    };
    let r = await d.collection("placas").findOne({ _id: key });
    if (!r) { const h = await us.findOne({ inventory: { $elemMatch: { placa: key } } }); const it = h?.inventory.find((i) => i.placa === key); if (it) r = { placa: key, modelo: it.name, color: it.color || "", detalles: it.detalles || [], robado: !!it.robado, estado: "Registro antiguo", dueno: it.robado ? null : h.id }; }
    if (r) return NextResponse.json({ p: await armar(r) });
    const otros = raw.length >= 3 ? await d.collection("placas").find({ modelo: new RegExp(esc(raw), "i") }).sort({ at: -1 }).limit(6).toArray() : [];
    return NextResponse.json({ p: null, varios: await Promise.all(otros.map(armar)) });
  }
  if (m === "exp") {
    const l = await d.collection("expedientes").find().sort({ at: -1 }).limit(40).toArray();
    return NextResponse.json({ exps: l.map((e) => ({ id: String(e._id), titulo: e.titulo, desc: e.desc, estado: e.estado, creador: e.creadorName, at: e.at, sujetos: e.sujetosN || [], notas: e.notas || [] })) });
  }
  if (m === "rep") {
    const a = await d.collection("reports").find().sort({ at: -1 }).limit(40).toArray(), b = solo911(u.ag) ? [] : await d.collection("reportes").find().sort({ at: -1 }).limit(40).toArray();
    const r = [...a.map((x) => ({ src: "e", id: String(x._id), titulo: `911 · ${x.tipo}`, det: `${x.zona}${x.calle ? " · " + x.calle : ""} — ${x.desc}`, por: x.nombre, zona: x.zona, x: x.x, y: x.y, atiende: x.atiende || null, resuelto: x.estado === "resuelto", seg: x.seg || [], at: x.at })),
      ...b.map((x) => ({ src: "v", id: String(x._id), titulo: `${x.tipo}: ${x.modelo}`, det: `Color ${x.color || "—"} · Placa ${x.placa || "—"}${x.specs ? " · " + x.specs : ""}`, por: x.denuncia || "", atiende: x.atiende || null, resuelto: x.estado === "resuelto", seg: x.seg || [], at: x.at }))].sort((x, y) => +new Date(y.at) - +new Date(x.at));
    return NextResponse.json({ reps: r });
  }
  if (m === "sueldo") { // sueldo semanal del agente y la cuenta donde lo recibe
    const cu = Object.keys(u.cuentas || {}).filter((k) => !BANCOS[k]?.comercial).map((k) => ({ k, label: BANCOS[k]?.nombre || k }));
    const sl = u.agente ? (await d.collection("config").findOne({ _id: "sueldos" }))?.[claveSueldo(u.agente.depto, u.agente.rango)] || 0 : 0;
    const pagos = (await d.collection("tx").find({ user: u.id, type: "sueldo" }).sort({ at: -1 }).limit(40).toArray()).map((x) => ({ monto: x.amount, at: x.at, det: x.item }));
    return NextResponse.json({ pagos, ultimo: pagos[0] || null, sueldo: sl, cuenta: u.agente?.cuenta || "efectivo", cuentas: [{ k: "efectivo", label: "Efectivo" }, ...cu], ultimoPago: u.agente?.ultimoPago || null, edita: !!u.agente });
  }
  if (m === "tiendaMin") { // SOLO el Ministro del Interior
    if (!esMinistro(u.ag)) return bad("Solo el Ministro del Interior ve la Tienda Ministerio", 403);
    const ahora = new Date(), desde = new Date(+ahora - DURACION), l = await d.collection("ministerio_mejoras").find({ $or: [{ at: { $gt: desde } }, { vence: { $gt: ahora } }] }).toArray();
    return NextResponse.json({ saldo: await saldoTesoreria(d), max: MAX_SEMANA, aviso: AVISO, items: MEJORAS.map((x) => { const mine = l.filter((k) => k.key === x.key), vence = mine.map((k) => +new Date(k.vence)).filter((v) => v > +ahora).sort((a, b) => b - a)[0] || null; return { ...x, activa: !!vence, vence, compras: mine.filter((k) => new Date(k.at) > desde).length }; }) });
  }
  if (m === "tesoreria") { // SOLO el Ministro del Interior
    if (!esMinistro(u.ag)) return bad("Solo el Ministro del Interior ve la Tesorería", 403);
    const sd = (await d.collection("config").findOne({ _id: "sueldos" })) || {}, mov = await d.collection("tesoreria").find().sort({ at: -1 }).limit(60).toArray(), ags = await us.find({ agente: { $exists: true } }).limit(300).toArray();
    const tot = await d.collection("tesoreria").aggregate([{ $group: { _id: "$tipo", t: { $sum: "$monto" } } }]).toArray(), suma = (k) => tot.find((x) => x._id === k)?.t || 0;
    const negs = await d.collection("negocios").find({ owner: { $ne: null }, _id: { $ne: "taller" } }).toArray(), dn = Object.fromEntries((await us.find({ id: { $in: negs.map((n) => n.owner) } }, { projection: { id: 1, name: 1, cedula: 1 } }).toArray()).map((x) => [x.id, x.cedula ? `${x.cedula.nombres.split(" ")[0]} ${x.cedula.apellidos.split(" ")[0]}` : x.name]));
    return NextResponse.json({ tasa: await tasaITBMS(d), sueldos: sd, saldo: await saldoTesoreria(d), ingresos: suma("ingreso"), egresos: suma("egreso"),
      mov: mov.map((x) => ({ tipo: x.tipo, monto: x.monto, concepto: x.concepto, at: x.at })),
      agentes: ags.map((x) => ({ id: x.id, nombre: x.cedula ? `${x.cedula.nombres.split(" ")[0]} ${x.cedula.apellidos.split(" ")[0]}` : x.name, rango: x.agente.rango, depto: x.agente.depto, sueldo: sd[claveSueldo(x.agente.depto, x.agente.rango)] || 0, cuenta: x.agente.cuenta || "efectivo", ultimoPago: x.agente.ultimoPago || null, toca: !x.agente.ultimoPago || Date.now() - +new Date(x.agente.ultimoPago) >= SEMANA })),
      negocios: negs.map((n) => ({ key: n._id, nombre: NEGOCIOS[n._id]?.nombre || n._id, dueno: dn[n.owner] || "—", paga: n.pagaImpuesto !== false, evadido: n.evadido || 0, comida: !!NEGOCIOS[n._id]?.comida, estado: n.estado || "normal", clausuradoAt: n.clausuradoAt || null, clausuraRazon: n.clausuraRazon || "", clausuraMulta: n.clausuraMulta || 0, multaPagada: !!n.multaPagadaAt, morosoDesde: n.morosoDesde || null })) });
  }
  if (m === "negociosDe") { // negocios de un ciudadano (para multas relacionadas con impuestos)
    const sid = String(p.get("id") || ""), l = await d.collection("negocios").find({ owner: sid }).toArray();
    return NextResponse.json({ negocios: l.filter((n) => NEGOCIOS[n._id] && n._id !== "taller").map((n) => ({ key: n._id, nombre: NEGOCIOS[n._id].nombre, estado: n.estado || "normal" })) });
  }
  if (m === "multas") { // listado de multas
    const f = p.get("f"), l = (await d.collection("multas").find({}).sort({ at: -1 }).limit(120).toArray()).map(mu).filter((x) => !f || f === "todas" || x.estado === f);
    return NextResponse.json({ multas: l });
  }
  if (m === "inv") { // lo que un ciudadano lleva encima y se puede decomisar
    const x = await us.findOne({ id: txt(p.get("id"), 30), cedula: { $exists: true } }); if (!x) return bad("No existe", 404);
    if (!(await d.collection("revisiones").findOne({ sujeto: x.id, por: u.id, at: { $gte: new Date(Date.now() - 30 * 6e4) } }))) return bad("Primero haz tu /me lo revisa para desbloquear esta área", 403);
    return NextResponse.json({ items: (x.inventory || []).filter((i) => i.loc !== "casa" && decomisable(i, licTipo(i))).map((i) => ({ name: i.name, at: new Date(i.at).toISOString(), category: i.category, placa: i.placa || "", img: i.img || "", cant: i.cant || 0, ret: estaRetenido(i) ? { hasta: i.retenido.hasta, por: i.retenido.porName } : null })) });
  }
  if (m === "decomisos") { // retenciones activas
    const l = await us.find({ "inventory.retenido.hasta": { $gt: new Date() } }).limit(60).toArray();
    return NextResponse.json({ l: l.flatMap((x) => (x.inventory || []).filter(estaRetenido).map((i) => ({ sujeto: x.id, sujetoN: pub(x).label, name: i.name, at: new Date(i.at).toISOString(), category: i.category, hasta: i.retenido.hasta, por: i.retenido.porName, motivo: i.retenido.motivo || "" }))) });
  }
  return bad("Consulta inválida");
}

export async function POST(req) {
  const b = await req.json().catch(() => ({})), u = await policia(b.accion === "entrar"); if (!u) return bad("Sin permiso", 403);
  const d = await db(), us = d.collection("users"), at = new Date(), yo = nombreDe(u);
  if (b.accion === "entrar") { // pide la placa del agente; 5 fallos bloquean 5 minutos
    const f = u.mdtFail; if (f?.n >= 5 && Date.now() - +new Date(f.at) < 3e5) return bad("Demasiados intentos. Espera 5 minutos", 429);
    if (String(b.placa || "").trim().toUpperCase() !== String(u.ag.placa).toUpperCase()) { await us.updateOne({ id: u.id }, { $set: { mdtFail: { n: f && Date.now() - +new Date(f.at) < 3e5 ? f.n + 1 : 1, at } } }); return bad("Placa incorrecta", 401); }
    await us.updateOne({ id: u.id }, { $set: { mdtSesion: at }, $unset: { mdtFail: "" } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "salir") { await us.updateOne({ id: u.id }, { $unset: { mdtSesion: "" } }); return NextResponse.json({ ok: true }); }
  if (solo911(u.ag) && (!["repAtender", "repNota", "repEstado"].includes(b.accion) || b.src === "v")) return bad("Tu departamento solo atiende reportes 911", 403);
  switch (b.accion) {
    case "multar": { // SOLO la PNB: la multa llega al Inventario del ciudadano; no se cobra sola
      if (!esPNB(u.ag)) return bad("Solo la Policía Nacional Bolivariana puede poner multas", 403);
      const s = await us.findOne({ id: txt(b.sujeto, 30), cedula: { $exists: true } }); if (!s) return bad("Elige al ciudadano");
      const monto = Math.floor(Number(b.monto)), dias = Math.floor(Number(b.dias) || PLAZO_MIN_DIAS), articulos = (Array.isArray(b.articulos) ? b.articulos : String(b.articulos || "").split(/\n|;/)).map((x) => txt(x, 120)).filter(Boolean).slice(0, 10);
      if (!(monto >= 1 && monto <= MONTO_MAX)) return bad(`El monto debe estar entre $1 y ${money(MONTO_MAX)}`); if (!articulos.length) return bad("Escribe al menos un artículo infringido");
      if (dias < PLAZO_MIN_DIAS) return bad(`El plazo mínimo para pagar es de ${PLAZO_MIN_DIAS} días`); if (dias > PLAZO_MAX_DIAS) return bad(`El plazo máximo es de ${PLAZO_MAX_DIAS} días`);
      if (s.id === u.id) return bad("No puedes multarte a ti mismo");
      const vence = new Date(+at + dias * 864e5), negK = b.negocio ? String(b.negocio) : null;
      if (negK && !(await d.collection("negocios").findOne({ _id: negK, owner: s.id }))) return bad("Ese negocio no es del ciudadano");
      await d.collection("multas").insertOne({ negocio: negK, sujeto: s.id, sujetoN: pub(s).label, monto, articulos, motivo: txt(b.motivo, 300), por: u.id, porName: `${u.ag.rango} ${yo}`, depto: u.ag.depto, estado: "pendiente", dias, at, vence });
      const body = `${u.ag.rango} ${yo} te multó con ${money(monto)}. Artículos: ${articulos.join("; ")}. Tienes hasta el ${vence.toLocaleDateString("es")} (${dias} días) para pagarla en Inventario → Multas; si no, será desacato.`;
      await d.collection("notifs").insertOne({ uid: s.id, title: "Recibiste una multa", body, at, read: false }); await enviarPush(s.id, { title: "Recibiste una multa", body: body.slice(0, 120), url: "/inventario?v=multas" });
      return NextResponse.json({ ok: true });
    }
    case "desacato": { // multa vencida: el oficial decide entre detener o retirar la licencia
      if (!esPNB(u.ag)) return bad("Solo la Policía Nacional Bolivariana", 403); const id = oid(b.id), c = d.collection("multas"), m = id && (await c.findOne({ _id: id }));
      if (!m || estadoMulta(m) !== "vencida") return bad("Esa multa no está vencida", 409); if (m.desacato) return bad("Ya se aplicó una medida por esta multa", 409);
      const s = await us.findOne({ id: m.sujeto }); if (!s) return bad("El ciudadano ya no existe", 404);
      if (b.tipo === "detencion") {
        const minutos = Math.floor(Number(b.minutos)); if (!(minutos >= 1 && minutos <= 600)) return bad("Escribe cuántos minutos queda detenido (1 a 600)");
        await d.collection("arrestos").insertOne({ sujeto: s.id, sujetoN: pub(s).label, cargos: `Desacato: no pagó la multa de ${money(m.monto)} (${(m.articulos || []).join("; ")})`, multa: 0, cobrado: 0, minutos, oficiales: [u.id], comision: 0, por: u.id, porName: yo, at });
        await encarcelar(d, s, minutos, "Desacato por multa impaga");
        await c.updateOne({ _id: id }, { $set: { desacato: { tipo: "Detenido", por: yo, detalle: `${minutos} min`, at } } });
        await d.collection("notifs").insertOne({ uid: s.id, title: "Detenido por desacato", body: `No pagaste a tiempo la multa de ${money(m.monto)}. Quedas detenido ${minutos} minutos.`, at, read: false }); return NextResponse.json({ ok: true });
      }
      if (b.tipo === "licencia") {
        const dias = Math.floor(Number(b.dias)); if (!(dias >= 1 && dias <= MAX_DIAS_RETENCION)) return bad("Elige entre 1 y 365 días"); const tipo = b.licencia === "armas" ? "armas" : "conducir";
        const li = (s.inventory || []).find((i) => licTipo(i) === tipo); if (!li) return bad(`El ciudadano no tiene Licencia de ${tipo === "armas" ? "Armas" : "Conducir"}`);
        const ret = { hasta: new Date(+at + dias * 864e5), por: u.id, porName: `${u.ag.rango} ${yo}`, motivo: `Desacato: multa de ${money(m.monto)} sin pagar`, depto: u.ag.depto, at };
        await us.updateOne({ id: s.id, inventory: { $elemMatch: { name: li.name, at: li.at } } }, { $set: { "inventory.$.retenido": ret } });
        await d.collection("decomisos").insertOne({ sujeto: s.id, sujetoN: pub(s).label, objeto: li.name, ...ret });
        await c.updateOne({ _id: id }, { $set: { desacato: { tipo: "Licencia retenida", por: yo, detalle: `${li.name} · ${dias} días`, at } } });
        await d.collection("notifs").insertOne({ uid: s.id, title: "Licencia retenida", body: `Por no pagar la multa de ${money(m.monto)}, te retuvieron la ${li.name} por ${dias} días.`, at, read: false }); return NextResponse.json({ ok: true });
      }
      return bad("Elige una medida");
    }
    case "revisar": { // el agente hace su "/me lo revisa" en el juego y desbloquea lo que el ciudadano lleva en los bolsillos (no lo guardado en casa)
      const s = await us.findOne({ id: txt(b.sujeto, 30), cedula: { $exists: true } }); if (!s) return bad("Elige al ciudadano"); if (s.id === u.id) return bad("No puedes revisarte a ti mismo");
      await d.collection("revisiones").insertOne({ sujeto: s.id, por: u.id, porName: `${u.ag.rango} ${yo}`, at });
      await d.collection("notifs").insertOne({ uid: s.id, title: "Te revisaron", body: `${u.ag.rango} ${yo} te revisó lo que llevas encima.`, at, read: false });
      return NextResponse.json({ items: (s.inventory || []).filter((i) => i.loc !== "casa" && !["Propiedades", "Comida y bebida"].includes(i.category) && i.tipo !== "nevera").map((i) => ({ name: i.name, at: new Date(i.at).toISOString(), category: i.category, placa: i.placa || "", img: i.img || "", cant: i.cant || 0, dec: decomisable(i, licTipo(i)), ret: estaRetenido(i) ? { hasta: i.retenido.hasta, por: i.retenido.porName } : null })) });
    }
    case "decomisar": { // cualquier agente: arma, licencia de armas, licencia de conducir o auto; el oficial elige los días
      const s = await us.findOne({ id: txt(b.sujeto, 30), cedula: { $exists: true } }); if (!s) return bad("Elige al ciudadano"); if (s.id === u.id) return bad("No puedes decomisarte a ti mismo");
      if (!(await d.collection("revisiones").findOne({ sujeto: s.id, por: u.id, at: { $gte: new Date(+at - 30 * 6e4) } }))) return bad("Primero haz tu /me lo revisa y desbloquea la revisión de ese ciudadano");
      const sus = (s.inventory || []).find((i) => i.name === b.name && +new Date(i.at) === +new Date(b.at) && i.loc !== "casa")?.category === "Sustancias"; // las sustancias se incautan del todo (sin días)
      const dias = sus ? 0 : Math.floor(Number(b.dias)); if (!sus && !(dias >= 1 && dias <= MAX_DIAS_RETENCION)) return bad(`Elige entre 1 y ${MAX_DIAS_RETENCION} días`);
      const motivo = txt(b.motivo, 300); if (motivo.length < 5) return bad("Escribe el motivo del decomiso");
      const it = (s.inventory || []).find((i) => i.name === b.name && +new Date(i.at) === +new Date(b.at) && i.loc !== "casa"); if (!it || !decomisable(it, licTipo(it))) return bad("Ese objeto no se puede decomisar (solo armas, licencias de armas y conducir, y autos que lleve encima)");
      if (estaRetenido(it)) return bad("Ese objeto ya está retenido", 409);
      if (it.category === "Sustancias") { // incautación definitiva
        if (!(await us.updateOne({ id: s.id }, { $pull: { inventory: { name: it.name, at: it.at, loc: { $ne: "casa" } } } })).modifiedCount) return bad("No se pudo incautar", 409);
        await d.collection("decomisos").insertOne({ sujeto: s.id, sujetoN: pub(s).label, objeto: `${it.name}${it.cant ? ` (${it.cant} bolsitas)` : ""}`, placa: "", incautado: true, por: u.id, porName: `${u.ag.rango} ${yo}`, motivo, depto: u.ag.depto, at });
        const bd = `${u.ag.rango} ${yo} te incautó "${it.name}"${it.cant ? ` (${it.cant} bolsitas)` : ""}. Motivo: ${motivo}.`;
        await d.collection("notifs").insertOne({ uid: s.id, title: "Sustancias incautadas", body: bd, at, read: false }); await enviarPush(s.id, { title: "Sustancias incautadas", body: bd.slice(0, 120), url: "/inventario" });
        return NextResponse.json({ ok: true });
      }
      const ret = { hasta: new Date(+at + dias * 864e5), por: u.id, porName: `${u.ag.rango} ${yo}`, motivo, depto: u.ag.depto, at };
      if (!(await us.updateOne({ id: s.id, inventory: { $elemMatch: { name: it.name, at: it.at, loc: { $ne: "casa" } } } }, { $set: { "inventory.$.retenido": ret } })).modifiedCount) return bad("No se pudo decomisar", 409);
      await d.collection("decomisos").insertOne({ sujeto: s.id, sujetoN: pub(s).label, objeto: it.name, placa: it.placa || "", ...ret });
      const body = `${ret.porName} te retuvo "${it.name}" por ${dias} días. Motivo: ${motivo}. Aparece en tu inventario como retenido y se te devuelve al terminar el plazo.`;
      await d.collection("notifs").insertOne({ uid: s.id, title: "Objeto decomisado", body, at, read: false }); await enviarPush(s.id, { title: "Objeto decomisado", body: body.slice(0, 120), url: "/inventario" });
      return NextResponse.json({ ok: true });
    }
    case "liberar": { // devolver antes de tiempo
      const s = await us.findOne({ id: txt(b.sujeto, 30) }), it = s?.inventory?.find((i) => i.name === b.name && +new Date(i.at) === +new Date(b.at) && estaRetenido(i)); if (!it) return bad("Ese objeto ya no está retenido", 404);
      await us.updateOne({ id: s.id, inventory: { $elemMatch: { name: it.name, at: it.at } } }, { $unset: { "inventory.$.retenido": "" } });
      await d.collection("notifs").insertOne({ uid: s.id, title: "Objeto devuelto", body: `${u.ag.rango} ${yo} te devolvió "${it.name}".`, at, read: false }); return NextResponse.json({ ok: true });
    }
    case "sueldoCuenta": { // el agente elige en qué banco recibe su sueldo
      if (!u.agente) return bad("Tu cargo no tiene sueldo asignado"); const k = String(b.cuenta || "");
      if (k !== "efectivo" && (!u.cuentas?.[k] || BANCOS[k]?.comercial)) return bad("No tienes esa cuenta bancaria");
      await us.updateOne({ id: u.id }, { $set: { "agente.cuenta": k } }); return NextResponse.json({ ok: true });
    }
    case "liberarRango": { // SOLO el Ministro: elige departamento y rango, pone el sueldo y lo libera a todos los miembros con ese rango
      if (!esMinistro(u.ag)) return bad("Solo el Ministro del Interior libera los sueldos", 403);
      const depto = String(b.depto || ""), rango = String(b.rango || ""), s = Math.floor(Number(b.sueldo));
      if (!RANGOS_POR_DEPTO[depto]?.includes(rango)) return bad("Departamento o rango inválido");
      if (!Number.isFinite(s) || s < 1 || s > 10000000) return bad("Escribe un sueldo entre $1 y $10.000.000");
      await d.collection("config").updateOne({ _id: "sueldos" }, { $set: { [claveSueldo(depto, rango)]: s } }, { upsert: true });
      const ags = await us.find({ "agente.depto": depto, "agente.rango": rango }).limit(300).toArray(), pagados = [], sinFondos = []; let total = 0;
      for (const x of ags) {
        const antes = x.agente.ultimoPago || null, hace = new Date(Date.now() - SEMANA);
        // reclama el pago de esta semana (evita pagar dos veces si se pulsa dos veces seguidas)
        const c = await us.updateOne({ id: x.id, $or: [{ "agente.ultimoPago": { $exists: false } }, { "agente.ultimoPago": null }, { "agente.ultimoPago": { $lte: hace } }] }, { $set: { "agente.ultimoPago": at } }); if (!c.modifiedCount) continue;
        const nom = x.cedula ? `${x.cedula.nombres.split(" ")[0]} ${x.cedula.apellidos.split(" ")[0]}` : x.name;
        if (!(await egresarTesoreria(d, s, `Sueldo: ${rango} ${nom}`, x.id))) { await us.updateOne({ id: x.id }, antes ? { $set: { "agente.ultimoPago": antes } } : { $unset: { "agente.ultimoPago": "" } }); sinFondos.push(nom); continue; }
        const k = x.agente.cuenta && x.cuentas?.[x.agente.cuenta] && !BANCOS[x.agente.cuenta]?.comercial ? x.agente.cuenta : "efectivo", campo = k === "efectivo" ? "balance" : `cuentas.${k}.saldo`;
        await us.updateOne({ id: x.id }, { $inc: { [campo]: s } });
        await d.collection("tx").insertOne({ user: x.id, type: "sueldo", item: `Sueldo semanal (${depto} · ${rango})`, amount: s, at });
        await d.collection("notifs").insertOne({ uid: x.id, title: "Sueldo recibido", body: `El Ministerio del Interior te pagó ${money(s)} en ${k === "efectivo" ? "efectivo" : BANCOS[k].nombre}.`, at, read: false });
        pagados.push(nom); total += s;
      }
      await d.collection("audit").insertOne({ by: u.id, byName: u.name, rank: u.ag.rango, act: "liberarSueldos", objetivo: `${depto} · ${rango}: ${pagados.length} de ${ags.length}`, razon: "Nómina semanal", detalle: { sueldo: s, total, sinFondos }, at });
      return NextResponse.json({ ok: true, pagados: pagados.length, miembros: ags.length, total, sinFondos });
    }
    case "negocioEstado": { // SOLO el Ministro: deja el negocio limpio (pago normal) o lo clausura
      if (!esMinistro(u.ag)) return bad("Solo el Ministro del Interior decide sobre los negocios", 403);
      const k = String(b.key || ""), nc = d.collection("negocios"), n = NEGOCIOS[k] && (await nc.findOne({ _id: k, owner: { $ne: null } })); if (!n) return bad("Negocio inválido", 404);
      const razon = txt(b.razon, 300), multa = Math.floor(Number(b.multa));
      if (b.estado === "limpio") {
        if (n.estado !== "moroso") return bad("Ese negocio no está moroso", 409);
        await nc.updateOne({ _id: k }, { $set: { estado: "normal", pagaImpuesto: true, limpioAt: at }, $unset: { morosoDesde: "" } });
        await d.collection("notifs").insertOne({ uid: n.owner, title: "Negocio al día", body: `El Ministro del Interior dejó ${n.nombre || NEGOCIOS[k].nombre} limpio: vuelve al pago normal de impuestos.`, at, read: false });
      } else if (b.estado === "clausurar") {
        if (n.estado === "clausurado") return bad("Ya está clausurado", 409); if (razon.length < 3) return bad("Escribe la razón de la clausura");
        if (!(multa >= 1 && multa <= 10000000)) return bad("Escribe el monto de la multa de reapertura ($1 a $10.000.000)");
        await nc.updateOne({ _id: k }, { $set: { estado: "clausurado", clausuradoAt: at, clausuraRazon: razon, clausuraMulta: multa }, $unset: { multaPagadaAt: "" } });
        await d.collection("notifs").insertOne({ uid: n.owner, title: "Negocio CLAUSURADO", body: `El Ministro del Interior clausuró ${NEGOCIOS[k].nombre}. Razón: ${razon}. Multa de reapertura: $${multa.toLocaleString("es")}. Págala desde Inventario → Negocios para reabrir, o deja el negocio.`, at, read: false });
        await enviarPush(n.owner, { title: "Negocio clausurado", body: NEGOCIOS[k].nombre, url: "/inventario?v=negocios" });
      } else return bad("Acción inválida");
      await d.collection("audit").insertOne({ by: u.id, byName: u.name, rank: u.ag.rango, act: "negocio_" + b.estado, objetivo: NEGOCIOS[k].nombre, razon: razon || "Decisión del Ministro", detalle: b.estado === "clausurar" ? { multa } : undefined, at });
      return NextResponse.json({ ok: true });
    }
    case "mejoraComprar": { // SOLO el Ministro: compra mejoras con el dinero de la Tesorería (máx. 3 por semana de cada una; duran 7 días)
      if (!esMinistro(u.ag)) return bad("Solo el Ministro del Interior puede comprar mejoras", 403);
      const mj = MEJORAS.find((x) => x.key === b.key); if (!mj) return bad("Mejora inválida");
      const col = d.collection("ministerio_mejoras"), desde = new Date(Date.now() - DURACION);
      if ((await col.countDocuments({ key: mj.key, at: { $gt: desde } })) >= MAX_SEMANA) return bad(`Máximo ${MAX_SEMANA} compras por semana de esta mejora`);
      const act = await col.find({ key: mj.key, vence: { $gt: at } }).sort({ vence: -1 }).limit(1).toArray(), base = act[0] ? +new Date(act[0].vence) : +at;
      if (!(await egresarTesoreria(d, mj.precio, `Tienda Ministerio: ${mj.nombre}`, u.id))) return bad("La Tesorería no tiene fondos suficientes");
      await col.insertOne({ key: mj.key, nombre: mj.nombre, precio: mj.precio, por: u.id, porName: yo, at, vence: new Date(base + DURACION) });
      await d.collection("audit").insertOne({ by: u.id, byName: u.name, rank: u.ag.rango, act: "mejoraMinisterio", objetivo: mj.nombre, razon: "Tienda Ministerio", detalle: { precio: mj.precio }, at });
      return NextResponse.json({ ok: true });
    }
    case "tasaSet": { // SOLO el Ministro: cambia el impuesto (ITBMS) de los objetos del Mercado
      if (!esMinistro(u.ag)) return bad("Solo el Ministro del Interior cambia los impuestos", 403);
      const p = Number(b.tasa); if (!(p >= 0 && p <= 30)) return bad("El impuesto debe estar entre 0% y 30%");
      const antes = await tasaITBMS(d), nueva = Math.round(p * 10) / 1000; await setTasa(d, nueva);
      if (nueva !== antes) { // aviso a los dueños de negocios: se ve debajo de su local en Inventario → Negocios
        await d.collection("config").updateOne({ _id: "tesoreria" }, { $set: { itbmsPrev: antes, itbmsCambio: at } });
        const dueños = (await d.collection("negocios").find({ owner: { $ne: null } }).toArray()).map((n) => n.owner), t = nueva > antes ? "subió" : "bajó";
        if (dueños.length) await d.collection("notifs").insertMany([...new Set(dueños)].map((uid) => ({ uid, title: "Cambió el ITBMS", body: `El Ministro del Interior ${t} el ITBMS de ${Math.round(antes * 1000) / 10}% a ${p}% (${at.toLocaleDateString("es")}).`, at, read: false })));
      }
      await d.collection("audit").insertOne({ by: u.id, byName: u.name, rank: u.ag.rango, act: "tasaITBMS", objetivo: `ITBMS ${p}%`, razon: "Decisión del Ministro", at });
      return NextResponse.json({ ok: true });
    }
    case "expNuevo": {
      const titulo = txt(b.titulo, 100); if (titulo.length < 3) return bad("Escribe un título");
      const s = b.sujeto ? await us.findOne({ id: txt(b.sujeto, 30), cedula: { $exists: true } }) : null;
      await d.collection("expedientes").insertOne({ titulo, desc: txt(b.desc, 1000), estado: "abierto", creador: u.id, creadorName: yo, sujetos: s ? [s.id] : [], sujetosN: s ? [pub(s).label] : [], notas: [], at }); return NextResponse.json({ ok: true });
    }
    case "expNota": case "expEstado": case "expSujeto": {
      const id = oid(b.id); if (!id) return bad("Expediente inválido"); const c = d.collection("expedientes");
      if (b.accion === "expNota") { const t = txt(b.txt); if (!t) return bad("Nota vacía"); await c.updateOne({ _id: id }, { $push: { notas: { by: yo, txt: t, at } } }); }
      else if (b.accion === "expEstado") await c.updateOne({ _id: id }, { $set: { estado: b.estado === "cerrado" ? "cerrado" : "abierto" } });
      else { const s = await us.findOne({ id: txt(b.sujeto, 30), cedula: { $exists: true } }); if (!s) return bad("Ciudadano no existe"); await c.updateOne({ _id: id }, { $addToSet: { sujetos: s.id, sujetosN: pub(s).label } }); }
      return NextResponse.json({ ok: true });
    }
    case "arresto": {
      const s = await us.findOne({ id: txt(b.sujeto, 30), cedula: { $exists: true } }); if (!s) return bad("Elige al sujeto arrestado");
      const cargos = txt(b.cargos, 400), multa = Math.floor(Number(b.multa) || 0), minutos = Math.max(0, Math.floor(Number(b.minutos) || 0));
      if (cargos.length < 3) return bad("Escribe los cargos"); if (multa < 0 || multa > 1000000) return bad("Multa inválida (máximo $1.000.000)");
      const nombres = [...new Set(txt(b.oficiales, 300).split(/[\s,;]+/).filter(Boolean))].slice(0, 9);
      const ofs = nombres.length ? await us.find({ $or: nombres.map((n) => ({ "cedula.roblox": new RegExp("^" + esc(n) + "$", "i") })) }).toArray() : [];
      const faltan = nombres.filter((n) => !ofs.some((o) => o.cedula.roblox.toLowerCase() === n.toLowerCase())); if (faltan.length) return bad(`No encuentro a: ${faltan.join(", ")} (usuario de Roblox)`);
      const ids = [...new Set([u.id, ...ofs.map((o) => o.id)])].filter((i) => i !== s.id);
      let rest = multa; const fuentes = [["balance", s.balance || 0], ...Object.keys(s.cuentas || {}).filter((k) => k !== "com").map((k) => [`cuentas.${k}.saldo`, s.cuentas[k].saldo || 0])];
      for (const [f, av] of fuentes) { const t = Math.min(rest, av); if (t > 0 && (await us.updateOne({ id: s.id, [f]: { $gte: t } }, { $inc: { [f]: -t } })).modifiedCount) rest -= t; }
      const cobrado = multa - rest, com = Math.floor(cobrado * COMISION);
      if (com > 0) for (const o of ids) { await us.updateOne({ id: o }, { $inc: { balance: com } }); await d.collection("tx").insertOne({ user: o, type: "comision", item: `Comisión por arresto de ${pub(s).label}`, amount: com, at }); await d.collection("notifs").insertOne({ uid: o, title: "Comisión por arresto", body: `Recibiste ${money(com)} (5% de ${money(cobrado)}) en efectivo.`, at, read: false }); }
      await d.collection("arrestos").insertOne({ sujeto: s.id, sujetoN: pub(s).label, cargos, multa, cobrado, minutos, oficiales: ids, comision: com, por: u.id, porName: yo, at });
      await d.collection("notifs").insertOne({ uid: s.id, title: "Has sido arrestado", body: `Cargos: ${cargos}.${cobrado ? ` Se cobró una multa de ${money(cobrado)}.` : ""}${rest ? ` Quedó sin pagar ${money(rest)}.` : ""}`, at, read: false });
      const jail = minutos > 0 ? await encarcelar(d, s, minutos, cargos) : null;
      return NextResponse.json({ ok: true, cobrado, comision: com, oficiales: ids.length, jail: jail ? (jail.ok ? "ok" : jail.error) : null });
    }
    case "allanSolicitar": { // cualquier agente solicita; solo el Ministro del Interior aprueba
      const dueno = await us.findOne({ id: txt(b.owner, 30), cedula: { $exists: true } }), casa = dueno?.inventory?.find((i) => i.category === "Propiedades" && i.name === b.casaName && +new Date(i.at) === +new Date(b.casaAt)), motivo = txt(b.motivo, 400);
      if (!dueno || !casa) return bad("Esa casa no existe"); if (motivo.length < 10) return bad("Explica el motivo del allanamiento (mínimo 10 letras)");
      const c = d.collection("allanamientos"); if (await c.findOne({ dueno: dueno.id, casaName: casa.name, casaAt: new Date(casa.at), por: u.id, estado: { $in: ["pendiente", "aprobada"] } })) return bad("Ya tienes una solicitud activa para esa casa");
      await c.insertOne({ dueno: dueno.id, duenoN: pub(dueno).label, casaName: casa.name, casaAt: new Date(casa.at), ubicacion: casa.ubicacion || "", motivo, por: u.id, porName: `${u.ag.rango} ${yo}`, estado: "pendiente", at }); return NextResponse.json({ ok: true });
    }
    case "allanResolver": { // solo el Ministro del Interior; no puedes aprobar tu propia solicitud
      if (!aprobador(u.ag)) return bad("Solo el Ministro del Interior aprueba los allanamientos", 403); const id = oid(b.id); if (!id) return bad("Solicitud inválida");
      const r = await d.collection("allanamientos").findOneAndUpdate({ _id: id, estado: "pendiente", por: { $ne: u.id } }, { $set: { estado: b.ok ? "aprobada" : "rechazada", resolvio: `${u.ag.rango} ${yo}`, resueltoAt: at, vence: b.ok ? new Date(Date.now() + 36e5) : null } });
      if (!r) return bad("Ya fue resuelta o es tu propia solicitud", 409); return NextResponse.json({ ok: true });
    }
    case "allanEntrar": { // el agente que pidió el allanamiento entra a revisar (1 hora tras la aprobación)
      const id = oid(b.id), c = d.collection("allanamientos"), r = id && (await c.findOne({ _id: id, por: u.id, estado: { $in: ["aprobada", "ejecutada"] }, vence: { $gt: at } })); if (!r) return bad("El allanamiento no está aprobado o ya venció", 403);
      const o = await us.findOne({ id: r.dueno }), ref = casaRef(r.casaName, r.casaAt), items = (o?.inventory || []).filter((i) => i.loc === "casa" && i.casa === ref);
      if (r.estado === "aprobada") { await c.updateOne({ _id: id }, { $set: { estado: "ejecutada", entroAt: at } }); await d.collection("notifs").insertOne({ uid: r.dueno, title: "Allanaron tu casa", body: `La policía allanó "${r.casaName}" (${u.ag.depto}).`, at, read: false }); }
      return NextResponse.json({ casa: r.casaName, items: items.map((i) => ({ name: i.name, category: i.category, lugar: i.lugar || "Sin especificar", placa: i.placa || "", robado: !!i.robado, img: i.img || "", cant: i.cant || 0, plantada: !!i.plantada, listoAt: i.listoAt || null })) });
    }
    case "repAtender": { // un policía toma el llamado; el ciudadano recibe un aviso
      const id = oid(b.id); if (!id) return bad("Reporte inválido"); const c = d.collection(b.src === "v" ? "reportes" : "reports");
      const r = await c.findOneAndUpdate({ _id: id, estado: { $ne: "resuelto" }, atiende: { $in: [null, undefined] } }, { $set: { estado: "atendiendo", atiende: yo }, $push: { seg: { by: yo, txt: "Va a atender el llamado", at } } });
      if (!r) return bad("Ese llamado ya lo atiende otra unidad o ya está resuelto", 409);
      if (b.src !== "v" && r.user) await d.collection("notifs").insertOne({ uid: r.user, title: "Una unidad va en camino", body: `${yo} atenderá tu reporte de ${r.tipo}.`, at, read: false });
      return NextResponse.json({ ok: true });
    }
    case "repNota": case "repEstado": {
      const id = oid(b.id); if (!id) return bad("Reporte inválido"); const c = d.collection(b.src === "v" ? "reportes" : "reports");
      if (b.accion === "repNota") { const t = txt(b.txt); if (!t) return bad("Nota vacía"); await c.updateOne({ _id: id }, { $push: { seg: { by: yo, txt: t, at } } }); }
      else await c.updateOne({ _id: id }, { $set: { estado: b.resuelto ? "resuelto" : "pendiente" }, ...(b.resuelto ? {} : { $unset: { atiende: "" } }), $push: { seg: { by: yo, txt: b.resuelto ? "Marcó el problema como RESUELTO" : "Reabrió el reporte", at } } });
      return NextResponse.json({ ok: true });
    }
  }
  return bad("Acción inválida");
}
