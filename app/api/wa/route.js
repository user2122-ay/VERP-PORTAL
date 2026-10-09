import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { waListo, fmtTel, normNum, esDesechable, anonActiva, anonNum, ANON_MIN, ANON_USOS } from "@/lib/redes";
import { enviarPush } from "@/lib/push";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// Cuenta con la que se está usando el chat: la real (chip) o la anónima del Celular Desechable (si la sesión sigue activa).
const cuentaDe = (u) => { const des = esDesechable(u), anonModo = des && (u.wa?.modo === "anon" || !u.chip), act = anonActiva(u); return { des, anonModo, me: anonModo ? (act ? u.wa.anon.num : null) : u.chip?.num || null, act }; };
const anonInfo = (u) => { const a = u.wa?.anon; return a ? { num: a.num, exp: a.exp, usos: a.usos || 0, max: a.max || ANON_USOS, activa: anonActiva(u) } : null; };
export async function GET(req) {
  const u = await apiUser(); if (!waListo(u)) return bad("Sin línea", 401);
  const { des, anonModo, me } = cuentaDe(u), yo = { num: me, nombre: anonModo ? "Anónimo" : u.chip?.nombre || "", foto: anonModo ? null : u.cedula?.avatar || null, modo: anonModo ? "anon" : "real", desechable: des, tieneChip: !!u.chip, anon: anonInfo(u) };
  if (!me) return NextResponse.json({ yo, lista: [], chat: [], nombre: "", foto: null });
  const con = new URL(req.url).searchParams.get("con") || "", d = await db(), col = d.collection("wa_msgs");
  const msgs = await col.find({ $or: [{ de: me }, { para: me }] }).sort({ at: -1 }).limit(400).toArray(), conv = new Map(), otro = (m) => (m.de === me ? m.para : m.de);
  for (const m of msgs) { const o = otro(m); if (!conv.has(o)) conv.set(o, { num: o, ultimo: m.texto, at: m.at, sin: 0 }); if (m.para === me && !m.leido) conv.get(o).sin++; }
  const alias = anonModo ? {} : Object.fromEntries((u.wa?.contactos || []).map((c) => [c.num, c.alias])), anonDe = new Set(msgs.filter((m) => m.anon && m.de !== me).map((m) => m.de));
  for (const n of Object.keys(alias)) if (!conv.has(n)) conv.set(n, { num: n, ultimo: "", at: null, sin: 0 });
  const rows = await d.collection("users").find({ "chip.num": { $in: [...conv.keys()] } }, { projection: { chip: 1, "cedula.avatar": 1 } }).toArray(), nombres = Object.fromEntries(rows.map((x) => [x.chip.num, x.chip.nombre])), fotos = Object.fromEntries(rows.map((x) => [x.chip.num, x.cedula?.avatar || null]));
  const lista = [...conv.values()].map((x) => ({ ...x, alias: alias[x.num] || (anonDe.has(x.num) ? "Número desconocido · " + fmtTel(x.num) : nombres[x.num]) || fmtTel(x.num), foto: fotos[x.num] || null })).sort((a, b) => (b.at ? +new Date(b.at) : 0) - (a.at ? +new Date(a.at) : 0));
  const chat = con ? msgs.filter((m) => otro(m) === con).reverse().map((m) => ({ id: String(m._id), mio: m.de === me, texto: m.texto, at: m.at })) : [];
  if (con) await col.updateMany({ de: con, para: me, leido: { $ne: true } }, { $set: { leido: true } });
  return NextResponse.json({ yo, lista, chat, nombre: anonDe.has(con) ? "Número desconocido" : nombres[con] || "", foto: fotos[con] || null });
}
export async function POST(req) {
  const u = await apiUser(); if (!waListo(u)) return bad("Sin línea", 401);
  const b = await req.json(), { des, anonModo, me } = cuentaDe(u), d = await db(), users = d.collection("users");
  if (b.accion === "modo") { // cambiar de cuenta (solo con Celular Desechable)
    if (!des) return bad("Necesitas un Celular Desechable para cambiar de cuenta");
    if (b.modo === "real" && !u.chip) return bad("No tienes chip: compra uno en el Mercado para usar tu cuenta real");
    if (b.modo !== "real" && b.modo !== "anon") return bad("Cuenta inválida");
    await users.updateOne({ id: u.id }, { $set: { "wa.modo": b.modo } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "anon_nueva") { // abre una sesión anónima: número falso, 15 minutos, 5 usos
    if (!des) return bad("Necesitas un Celular Desechable");
    if (anonActiva(u)) return bad("Ya tienes una cuenta anónima activa");
    let num = null; for (let i = 0; i < 20 && !num; i++) { const n = anonNum(); if (!(await users.findOne({ $or: [{ "chip.num": n }, { "wa.anon.num": n }] }))) num = n; }
    if (!num) return bad("No se pudo crear la cuenta, intenta otra vez");
    const at = new Date(); await users.updateOne({ id: u.id }, { $set: { "wa.anon": { num, at, exp: new Date(+at + ANON_MIN * 6e4), usos: 0, max: ANON_USOS }, "wa.modo": "anon" } }); return NextResponse.json({ ok: true });
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
    const rec = await users.findOne({ $or: [{ "chip.num": para }, { "wa.anon.num": para, "wa.anon.exp": { $gt: new Date() } }] }); if (!rec) return bad("Ese número no existe");
    if ((await d.collection("wa_msgs").countDocuments({ de: me, at: { $gte: new Date(Date.now() - 60000) } })) >= 30) return bad("Vas muy rápido, espera un momento");
    if (anonModo) { // cada mensaje anónimo gasta 1 de los 5 usos de la sesión
      const r = await users.updateOne({ id: u.id, "wa.anon.num": me, "wa.anon.exp": { $gt: new Date() }, "wa.anon.usos": { $lt: ANON_USOS } }, { $inc: { "wa.anon.usos": 1 } });
      if (!r.modifiedCount) return bad("Tu sesión anónima terminó (15 minutos o 5 usos). Abre una nueva cuenta anónima");
    }
    await d.collection("wa_msgs").insertOne({ de: me, para, texto, at: new Date(), leido: false, ...(anonModo ? { anon: true, uid: u.id } : {}) });
    await enviarPush(rec.id, { title: anonModo ? "Número desconocido" : rec.wa?.contactos?.find((c) => c.num === me)?.alias || u.chip?.nombre || fmtTel(me), body: texto.slice(0, 100), url: "/whatsapp", tag: "wa-" + me });
    return NextResponse.json({ ok: true });
  }
  return bad("Acción inválida");
}
