import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { nombreDe } from "@/lib/rol";
import { agenteDe, aprobador, casaRef, esMinistro, SEMANA, RANGOS_POR_DEPTO, claveSueldo } from "@/lib/mdt";
import { BANCOS } from "@/lib/bancos";
import { NEGOCIOS } from "@/lib/negocios";
import { saldoTesoreria, egresarTesoreria, tasaITBMS, setTasa } from "@/lib/tesoreria";
import { normPlaca } from "@/lib/placa";
import { licTipo } from "@/lib/licencia";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), money = (n) => "$" + Number(n).toLocaleString("es"), txt = (s, n = 400) => String(s || "").trim().slice(0, n);
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
const COMISION = 0.05; // cada oficial presente en el arresto recibe el 5% de la multa cobrada
const fresca = (u) => !!(u.mdtSesion && Date.now() - +new Date(u.mdtSesion) < 8 * 36e5);
// Solo entra quien Administración asignó como agente (o el Developer) y ya ingresó su placa en las últimas 8 horas.
async function policia(libre = false) { const u = await apiUser(); const ag = u && agenteDe(u); if (!ag) return null; if (!libre && !fresca(u)) return null; return { ...u, ag }; }
const pub = (x) => ({ id: x.id, label: `${x.cedula.nombres} ${x.cedula.apellidos} · ${x.cedula.roblox}`, num: x.cedula.num });

export async function GET(req) {
  const p = new URL(req.url).searchParams, m = p.get("m");
  if (m === "estado") { const u = await policia(true); if (!u) return bad("Sin permiso", 403); return NextResponse.json({ ok: fresca(u), ag: u.ag, nombre: nombreDe(u), discord: u.name, yo: u.id, aprueba: aprobador(u.ag), ministro: esMinistro(u.ag) }); }
  const u = await policia(); if (!u) return bad("Sin sesión de la MDT", 401);
  const d = await db(), us = d.collection("users");
  if (m === "buscar") {
    const q = txt(p.get("q"), 40); if (q.length < 2) return NextResponse.json({ users: [] });
    const rx = new RegExp(esc(q), "i"), dg = q.replace(/\D/g, "").replace(/^0+/, "");
    return NextResponse.json({ users: (await us.find({ cedula: { $exists: true }, $or: [{ "cedula.roblox": rx }, { "cedula.nombres": rx }, { "cedula.apellidos": rx }, ...(dg ? [{ "cedula.num": dg }] : [])] }).limit(10).toArray()).map(pub) });
  }
  if (m === "ficha") {
    const x = await us.findOne({ id: txt(p.get("id"), 30), cedula: { $exists: true } }); if (!x) return bad("No existe", 404);
    const ar = await d.collection("arrestos").find({ sujeto: x.id }).sort({ at: -1 }).limit(30).toArray(), ex = await d.collection("expedientes").find({ sujetos: x.id }).sort({ at: -1 }).limit(20).toArray();
    return NextResponse.json({ licencias: (x.inventory || []).filter((i) => licTipo(i)).map((i) => ({ tipo: licTipo(i), num: i.licNum || "—", at: i.at })), cedula: x.cedula, linea: x.chip?.num || null, autos: (x.inventory || []).filter((i) => i.category === "Concesionario").map((i) => ({ name: i.name, placa: i.placa || "", robado: !!i.robado, color: i.color || "", detalles: i.detalles || [], img: i.img || "" })),
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
    const a = await d.collection("reports").find().sort({ at: -1 }).limit(40).toArray(), b = await d.collection("reportes").find().sort({ at: -1 }).limit(40).toArray();
    const r = [...a.map((x) => ({ src: "e", id: String(x._id), titulo: `911 · ${x.tipo}`, det: `${x.zona}${x.calle ? " · " + x.calle : ""} — ${x.desc}`, por: x.nombre, zona: x.zona, x: x.x, y: x.y, atiende: x.atiende || null, resuelto: x.estado === "resuelto", seg: x.seg || [], at: x.at })),
      ...b.map((x) => ({ src: "v", id: String(x._id), titulo: `${x.tipo}: ${x.modelo}`, det: `Color ${x.color || "—"} · Placa ${x.placa || "—"}${x.specs ? " · " + x.specs : ""}`, por: x.denuncia || "", atiende: x.atiende || null, resuelto: x.estado === "resuelto", seg: x.seg || [], at: x.at }))].sort((x, y) => +new Date(y.at) - +new Date(x.at));
    return NextResponse.json({ reps: r });
  }
  if (m === "sueldo") { // sueldo semanal del agente y la cuenta donde lo recibe
    const cu = Object.keys(u.cuentas || {}).filter((k) => !BANCOS[k]?.comercial).map((k) => ({ k, label: BANCOS[k]?.nombre || k }));
    const sl = u.agente ? (await d.collection("config").findOne({ _id: "sueldos" }))?.[claveSueldo(u.agente.depto, u.agente.rango)] || 0 : 0;
    return NextResponse.json({ sueldo: sl, cuenta: u.agente?.cuenta || "efectivo", cuentas: [{ k: "efectivo", label: "Efectivo" }, ...cu], ultimoPago: u.agente?.ultimoPago || null, edita: !!u.agente });
  }
  if (m === "tesoreria") { // SOLO el Ministro del Interior
    if (!esMinistro(u.ag)) return bad("Solo el Ministro del Interior ve la Tesorería", 403);
    const sd = (await d.collection("config").findOne({ _id: "sueldos" })) || {}, mov = await d.collection("tesoreria").find().sort({ at: -1 }).limit(60).toArray(), ags = await us.find({ agente: { $exists: true } }).limit(300).toArray();
    const tot = await d.collection("tesoreria").aggregate([{ $group: { _id: "$tipo", t: { $sum: "$monto" } } }]).toArray(), suma = (k) => tot.find((x) => x._id === k)?.t || 0;
    const negs = await d.collection("negocios").find({ owner: { $ne: null }, _id: { $ne: "taller" } }).toArray(), dn = Object.fromEntries((await us.find({ id: { $in: negs.map((n) => n.owner) } }, { projection: { id: 1, name: 1, cedula: 1 } }).toArray()).map((x) => [x.id, x.cedula ? `${x.cedula.nombres.split(" ")[0]} ${x.cedula.apellidos.split(" ")[0]}` : x.name]));
    return NextResponse.json({ tasa: await tasaITBMS(d), sueldos: sd, saldo: await saldoTesoreria(d), ingresos: suma("ingreso"), egresos: suma("egreso"),
      mov: mov.map((x) => ({ tipo: x.tipo, monto: x.monto, concepto: x.concepto, at: x.at })),
      agentes: ags.map((x) => ({ id: x.id, nombre: x.cedula ? `${x.cedula.nombres.split(" ")[0]} ${x.cedula.apellidos.split(" ")[0]}` : x.name, rango: x.agente.rango, depto: x.agente.depto, sueldo: sd[claveSueldo(x.agente.depto, x.agente.rango)] || 0, cuenta: x.agente.cuenta || "efectivo", ultimoPago: x.agente.ultimoPago || null, toca: !x.agente.ultimoPago || Date.now() - +new Date(x.agente.ultimoPago) >= SEMANA })),
      negocios: negs.map((n) => ({ nombre: NEGOCIOS[n._id]?.nombre || n._id, dueno: dn[n.owner] || "—", paga: n.pagaImpuesto !== false, evadido: n.evadido || 0 })) });
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
  switch (b.accion) {
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
    case "tasaSet": { // SOLO el Ministro: cambia el impuesto (ITBMS) de los objetos del Mercado
      if (!esMinistro(u.ag)) return bad("Solo el Ministro del Interior cambia los impuestos", 403);
      const p = Number(b.tasa); if (!(p >= 0 && p <= 30)) return bad("El impuesto debe estar entre 0% y 30%");
      await setTasa(d, Math.round(p * 10) / 1000);
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
      return NextResponse.json({ ok: true, cobrado, comision: com, oficiales: ids.length });
    }
    case "allanSolicitar": { // cualquier agente solicita; desde Comisario se aprueba
      const dueno = await us.findOne({ id: txt(b.owner, 30), cedula: { $exists: true } }), casa = dueno?.inventory?.find((i) => i.category === "Propiedades" && i.name === b.casaName && +new Date(i.at) === +new Date(b.casaAt)), motivo = txt(b.motivo, 400);
      if (!dueno || !casa) return bad("Esa casa no existe"); if (motivo.length < 10) return bad("Explica el motivo del allanamiento (mínimo 10 letras)");
      const c = d.collection("allanamientos"); if (await c.findOne({ dueno: dueno.id, casaName: casa.name, casaAt: new Date(casa.at), por: u.id, estado: { $in: ["pendiente", "aprobada"] } })) return bad("Ya tienes una solicitud activa para esa casa");
      await c.insertOne({ dueno: dueno.id, duenoN: pub(dueno).label, casaName: casa.name, casaAt: new Date(casa.at), ubicacion: casa.ubicacion || "", motivo, por: u.id, porName: `${u.ag.rango} ${yo}`, estado: "pendiente", at }); return NextResponse.json({ ok: true });
    }
    case "allanResolver": { // Comisario o superior; no puedes aprobar tu propia solicitud
      if (!aprobador(u.ag)) return bad("Solo desde el rango de Comisario se aprueban allanamientos", 403); const id = oid(b.id); if (!id) return bad("Solicitud inválida");
      const r = await d.collection("allanamientos").findOneAndUpdate({ _id: id, estado: "pendiente", por: { $ne: u.id } }, { $set: { estado: b.ok ? "aprobada" : "rechazada", resolvio: `${u.ag.rango} ${yo}`, resueltoAt: at, vence: b.ok ? new Date(Date.now() + 36e5) : null } });
      if (!r) return bad("Ya fue resuelta o es tu propia solicitud", 409); return NextResponse.json({ ok: true });
    }
    case "allanEntrar": { // el agente que pidió el allanamiento entra a revisar (1 hora tras la aprobación)
      const id = oid(b.id), c = d.collection("allanamientos"), r = id && (await c.findOne({ _id: id, por: u.id, estado: { $in: ["aprobada", "ejecutada"] }, vence: { $gt: at } })); if (!r) return bad("El allanamiento no está aprobado o ya venció", 403);
      const o = await us.findOne({ id: r.dueno }), ref = casaRef(r.casaName, r.casaAt), items = (o?.inventory || []).filter((i) => i.loc === "casa" && i.casa === ref);
      if (r.estado === "aprobada") { await c.updateOne({ _id: id }, { $set: { estado: "ejecutada", entroAt: at } }); await d.collection("notifs").insertOne({ uid: r.dueno, title: "Allanaron tu casa", body: `La policía allanó "${r.casaName}" (${u.ag.depto}).`, at, read: false }); }
      return NextResponse.json({ casa: r.casaName, items: items.map((i) => ({ name: i.name, category: i.category, lugar: i.lugar || "Sin especificar", placa: i.placa || "", robado: !!i.robado, img: i.img || "" })) });
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
