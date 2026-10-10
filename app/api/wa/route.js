import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { waListo, fmtTel, normNum, esDesechable, anonActiva, telDesechable, PAISES_ANON, ANON_NUM, ANON_SESIONES, ANON_MIN, ANON_USOS } from "@/lib/redes";
import { enviarPush } from "@/lib/push";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// Cuenta con la que se está usando el chat: la real (chip) o la anónima del Celular Desechable (si la sesión sigue activa).
const cuentaDe = (u) => { const des = esDesechable(u), anonModo = des && (u.wa?.modo === "anon" || !u.chip), act = anonActiva(u); return { des, anonModo, me: anonModo ? (act ? ANON_NUM : null) : u.chip?.num || null, act }; };
// Tras la 5.ª sesión anónima (cuando termina) el Celular Desechable se destruye: hay que comprar otro.
async function limpiarTel(d, u) {
  const t = telDesechable(u); if (!t || (t.anonSes || 0) < ANON_SESIONES || anonActiva(u)) return false;
  const r = await d.collection("users").updateOne({ id: u.id, inventory: { $elemMatch: { sku: "cel-desechable" } } }, { $pull: { inventory: { sku: "cel-desechable" } }, $unset: { "wa.anon": "" }, $set: { "wa.modo": "real" } });
  if (r.modifiedCount) await d.collection("notifs").insertOne({ uid: u.id, title: "Celular desechable destruido", body: `Usaste tus ${ANON_SESIONES} sesiones anónimas: el celular desechable se destruyó. Compra otro en el Mercado si lo necesitas.`, at: new Date(), read: false });
  return !!r.modifiedCount;
}
const anonInfo = (u) => { const a = u.wa?.anon; return a ? { pais: a.pais || null, exp: a.exp, usos: a.usos || 0, max: a.max || ANON_USOS, activa: anonActiva(u) } : null; };
export async function GET(req) {
  const u = await apiUser(); if (!waListo(u)) return bad("Sin línea", 401);
  const d0 = await db(); if (await limpiarTel(d0, u)) return NextResponse.json({ yo: { num: null, destruido: true, modo: "real", desechable: false, tieneChip: !!u.chip, anon: null }, lista: [], chat: [], nombre: "", foto: null });
  const { des, anonModo, me } = cuentaDe(u), yo = { num: me, nombre: anonModo ? "Anónimo" : u.chip?.nombre || "", foto: anonModo ? null : u.cedula?.avatar || null, modo: anonModo ? "anon" : "real", desechable: des, tieneChip: !!u.chip, anon: anonInfo(u), sesiones: telDesechable(u)?.anonSes || 0, maxSesiones: ANON_SESIONES };
  if (!me) return NextResponse.json({ yo, lista: [], chat: [], nombre: "", foto: null });
  const con = new URL(req.url).searchParams.get("con") || "", d = await db(), col = d.collection("wa_msgs");
  if (anonModo) { // la cuenta anónima solo ve lo que ella mandó en esta sesión
    const ms = await col.find({ anon: true, uid: u.id, sid: u.wa.anon.sid }).sort({ at: -1 }).limit(100).toArray(), cv = new Map();
    for (const m of ms) if (!cv.has(m.para)) cv.set(m.para, { num: m.para, ultimo: m.texto, at: m.at, sin: 0, alias: fmtTel(m.para), foto: null });
    return NextResponse.json({ yo, lista: [...cv.values()], chat: con ? ms.filter((m) => m.para === con).reverse().map((m) => ({ id: String(m._id), mio: true, texto: m.texto, at: m.at })) : [], nombre: "", foto: null });
  }
  const msgs = await col.find({ $or: [{ de: me }, { para: me }] }).sort({ at: -1 }).limit(400).toArray(), conv = new Map(), otro = (m) => (m.de === me ? m.para : m.de);
  for (const m of msgs) { const o = otro(m); if (!conv.has(o)) conv.set(o, { num: o, ultimo: m.texto, at: m.at, sin: 0 }); if (m.para === me && !m.leido) conv.get(o).sin++; }
  const alias = anonModo ? {} : Object.fromEntries((u.wa?.contactos || []).map((c) => [c.num, c.alias])), anonDe = new Set(msgs.filter((m) => m.anon && m.de !== me).map((m) => m.de)), anonLbl = {}; for (const m of msgs) if (m.anon && m.de !== me && !anonLbl[m.de]) anonLbl[m.de] = `Cuenta anónima${m.pc ? ` · ${m.pc} ${m.pn}` : ""}`;
  for (const n of Object.keys(alias)) if (!conv.has(n)) conv.set(n, { num: n, ultimo: "", at: null, sin: 0 });
  const rows = await d.collection("users").find({ "chip.num": { $in: [...conv.keys()] } }, { projection: { chip: 1, "cedula.avatar": 1 } }).toArray(), nombres = Object.fromEntries(rows.map((x) => [x.chip.num, x.chip.nombre])), fotos = Object.fromEntries(rows.map((x) => [x.chip.num, x.cedula?.avatar || null]));
  const lista = [...conv.values()].map((x) => ({ ...x, alias: alias[x.num] || (anonDe.has(x.num) ? anonLbl[x.num] || "Cuenta anónima" : nombres[x.num]) || fmtTel(x.num), foto: fotos[x.num] || null })).sort((a, b) => (b.at ? +new Date(b.at) : 0) - (a.at ? +new Date(a.at) : 0));
  const chat = con ? msgs.filter((m) => otro(m) === con).reverse().map((m) => ({ id: String(m._id), mio: m.de === me, texto: m.texto, at: m.at })) : [];
  if (con) await col.updateMany({ de: con, para: me, leido: { $ne: true } }, { $set: { leido: true } });
  return NextResponse.json({ yo, lista, chat, nombre: anonDe.has(con) ? "Cuenta anónima" : nombres[con] || "", foto: fotos[con] || null });
}
export async function POST(req) {
  const u = await apiUser(); if (!waListo(u)) return bad("Sin línea", 401);
  const d = await db(), users = d.collection("users"); await limpiarTel(d, u);
  const b = await req.json(), { des, anonModo, me } = cuentaDe(u);
  if (b.accion === "modo") { // cambiar de cuenta (solo con Celular Desechable)
    if (!des) return bad("Necesitas un Celular Desechable para cambiar de cuenta");
    if (b.modo === "real" && !u.chip) return bad("No tienes chip: compra uno en el Mercado para usar tu cuenta real");
    if (b.modo !== "real" && b.modo !== "anon") return bad("Cuenta inválida");
    await users.updateOne({ id: u.id }, { $set: { "wa.modo": b.modo } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "anon_nueva") { // abre una sesión anónima: sin número (solo "Cuenta anónima" y un código de país), 15 minutos, 5 usos
    const t = telDesechable(u); if (!des || !t) return bad("Necesitas un Celular Desechable");
    if (anonActiva(u)) return bad("Ya tienes una cuenta anónima activa");
    if ((t.anonSes || 0) >= ANON_SESIONES) return bad("Tu celular desechable ya usó sus 5 sesiones. Compra otro");
    const at = new Date(), sid = Math.random().toString(36).slice(2) + Date.now().toString(36), [pn, pc] = PAISES_ANON[Math.floor(Math.random() * PAISES_ANON.length)];
    const r = await users.updateOne({ id: u.id }, { $set: { "wa.anon": { num: ANON_NUM, sid, pais: { n: pn, c: pc }, at, exp: new Date(+at + ANON_MIN * 6e4), usos: 0, max: ANON_USOS }, "wa.modo": "anon" }, $inc: { "inventory.$[e].anonSes": 1 } }, { arrayFilters: [{ "e.sku": "cel-desechable" }] });
    return r.modifiedCount ? NextResponse.json({ ok: true }) : bad("No se pudo abrir la sesión");
  }
  if (!me) return bad(anonModo ? "Tu sesión anónima terminó. Abre una nueva cuenta anónima" : "Sin línea", 403);
  if (b.accion === "perfil") {
    if (anonModo) return bad("Una cuenta anónima no tiene perfil");
    const n = String(b.nombre || "").trim().slice(0, 24); if (!n) return bad("Escribe un nombre");
    await users.updateOne({ id: u.id }, { $set: { "chip.nombre": n } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "contacto") {
    if (anonModo) return bad("Una cuenta anónima no guarda contactos");
    const n = normNum(b.num), alias = String(b.alias || "").trim().slice(0, 24);
    if (!n) return bad("Número inválido (ej: 0412 1234567)"); if (n === me) return bad("Ese es tu número");
    if (!(await users.findOne({ "chip.num": n }))) return bad("Ese número no existe");
    await users.updateOne({ id: u.id }, { $pull: { "wa.contactos": { num: n } } });
    await users.updateOne({ id: u.id }, { $push: { "wa.contactos": { num: n, alias } } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "enviar") {
    const texto = String(b.texto || "").trim().slice(0, 500), para = normNum(b.para);
    if (!texto || !para) return bad("Mensaje inválido");
    if (para === me) return bad("Ese es tu número");
    if (para === ANON_NUM) return bad("A un número anónimo no se le puede responder");
    const rec = await users.findOne({ "chip.num": para }); if (!rec) return bad("Ese número no existe");
    if (!anonModo && (await d.collection("wa_msgs").countDocuments({ de: me, at: { $gte: new Date(Date.now() - 60000) } })) >= 30) return bad("Vas muy rápido, espera un momento");
    if (anonModo) { // cada mensaje anónimo gasta 1 de los 5 usos de la sesión
      const r = await users.updateOne({ id: u.id, "wa.anon.sid": u.wa.anon.sid, "wa.anon.exp": { $gt: new Date() }, "wa.anon.usos": { $lt: ANON_USOS } }, { $inc: { "wa.anon.usos": 1 } });
      if (!r.modifiedCount) return bad("Tu sesión anónima terminó (15 minutos o 5 usos). Abre una nueva cuenta anónima");
    }
    await d.collection("wa_msgs").insertOne({ de: me, para, texto, at: new Date(), leido: false, ...(anonModo ? { anon: true, uid: u.id, sid: u.wa.anon.sid, pn: u.wa.anon.pais?.n || "", pc: u.wa.anon.pais?.c || "" } : {}) });
    await enviarPush(rec.id, { title: anonModo ? "Cuenta anónima" : rec.wa?.contactos?.find((c) => c.num === me)?.alias || u.chip?.nombre || fmtTel(me), body: texto.slice(0, 100), url: "/whatsapp", tag: "wa-" + me });
    return NextResponse.json({ ok: true });
  }
  return bad("Acción inválida");
}
