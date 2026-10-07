import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { fmtTel, normNum } from "@/lib/redes";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function GET(req) {
  const u = await apiUser(); if (!u?.chip) return bad("Sin línea", 401);
  const con = new URL(req.url).searchParams.get("con") || "", me = u.chip.num, d = await db(), col = d.collection("wa_msgs");
  const msgs = await col.find({ $or: [{ de: me }, { para: me }] }).sort({ at: -1 }).limit(400).toArray(), conv = new Map(), otro = (m) => (m.de === me ? m.para : m.de);
  for (const m of msgs) { const o = otro(m); if (!conv.has(o)) conv.set(o, { num: o, ultimo: m.texto, at: m.at, sin: 0 }); if (m.para === me && !m.leido) conv.get(o).sin++; }
  const alias = Object.fromEntries((u.wa?.contactos || []).map((c) => [c.num, c.alias]));
  for (const n of Object.keys(alias)) if (!conv.has(n)) conv.set(n, { num: n, ultimo: "", at: null, sin: 0 });
  const nombres = Object.fromEntries((await d.collection("users").find({ "chip.num": { $in: [...conv.keys()] } }, { projection: { chip: 1 } }).toArray()).map((x) => [x.chip.num, x.chip.nombre]));
  const lista = [...conv.values()].map((x) => ({ ...x, alias: alias[x.num] || nombres[x.num] || fmtTel(x.num) })).sort((a, b) => (b.at ? +new Date(b.at) : 0) - (a.at ? +new Date(a.at) : 0));
  const chat = con ? msgs.filter((m) => otro(m) === con).reverse().map((m) => ({ id: String(m._id), mio: m.de === me, texto: m.texto, at: m.at })) : [];
  if (con) await col.updateMany({ de: con, para: me, leido: { $ne: true } }, { $set: { leido: true } });
  return NextResponse.json({ yo: { num: me, nombre: u.chip.nombre }, lista, chat, nombre: nombres[con] || "" });
}
export async function POST(req) {
  const u = await apiUser(); if (!u?.chip) return bad("Sin línea", 401);
  const b = await req.json(), me = u.chip.num, d = await db(), users = d.collection("users");
  if (b.accion === "perfil") {
    const n = String(b.nombre || "").trim().slice(0, 24); if (!n) return bad("Escribe un nombre");
    await users.updateOne({ id: u.id }, { $set: { "chip.nombre": n } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "contacto") {
    const n = normNum(b.num), alias = String(b.alias || "").trim().slice(0, 24);
    if (!n) return bad("Número inválido (ej: 0412 1234567)"); if (n === me) return bad("Ese es tu número");
    if (!(await users.findOne({ "chip.num": n }))) return bad("Ese número no existe");
    await users.updateOne({ id: u.id }, { $pull: { "wa.contactos": { num: n } } });
    await users.updateOne({ id: u.id }, { $push: { "wa.contactos": { num: n, alias } } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "enviar") {
    const texto = String(b.texto || "").trim().slice(0, 500), para = normNum(b.para);
    if (!texto || !para) return bad("Mensaje inválido");
    if (!(await users.findOne({ "chip.num": para }))) return bad("Ese número no existe");
    if ((await d.collection("wa_msgs").countDocuments({ de: me, at: { $gte: new Date(Date.now() - 60000) } })) >= 30) return bad("Vas muy rápido, espera un momento");
    await d.collection("wa_msgs").insertOne({ de: me, para, texto, at: new Date(), leido: false }); return NextResponse.json({ ok: true });
  }
  return bad("Acción inválida");
}
