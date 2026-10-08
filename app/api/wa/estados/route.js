import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { waListo } from "@/lib/redes";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const HORAS = 24, HOSTS = ["cdn.discordapp.com", "media.discordapp.net", "i.imgur.com"], FOTO = /\.(jpe?g|png|gif|webp)$/i, VIDEO = /\.(mp4|webm|mov)$/i;
let idx = false;
// Los estados duran 24 h: el índice TTL de Mongo borra el documento entero (incluida la imagen) al llegar a "expira".
async function col() { const c = (await db()).collection("wa_estados"); if (!idx) { idx = true; await c.createIndex({ expira: 1 }, { expireAfterSeconds: 0 }).catch(() => {}); } return c; }
const contactos = (u) => (u.wa?.contactos || []).map((c) => c.num);
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
export async function GET(req) {
  const u = await apiUser(); if (!waListo(u)) return bad("Sin línea", 401);
  const c = await col(), me = u.chip.num, now = new Date(), img = new URL(req.url).searchParams.get("img");
  if (img) {
    const _id = oid(img), e = _id && (await c.findOne({ _id, expira: { $gt: now } }));
    if (!e || (e.num !== me && !contactos(u).includes(e.num))) return bad("No existe", 404);
    const m = /^data:image\/jpeg;base64,(.+)$/.exec(e.img || ""); if (!m) return bad("Sin imagen", 404);
    return new Response(Buffer.from(m[2], "base64"), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" } });
  }
  const nums = [me, ...contactos(u)], docs = await c.find({ num: { $in: nums }, expira: { $gt: now } }, { projection: { img: 0 } }).sort({ at: 1 }).toArray();
  const nom = Object.fromEntries((await (await db()).collection("users").find({ "chip.num": { $in: nums } }, { projection: { chip: 1, "cedula.avatar": 1 } }).toArray()).map((x) => [x.chip.num, x])), alias = Object.fromEntries((u.wa?.contactos || []).map((x) => [x.num, x.alias])), g = {};
  for (const e of docs) {
    const o = (g[e.num] ||= { num: e.num, mio: e.num === me, nombre: e.num === me ? "Mi estado" : alias[e.num] || nom[e.num]?.chip?.nombre || e.num, foto: nom[e.num]?.cedula?.avatar || (e.num === me ? u.cedula?.avatar : null) || null, items: [], visto: true });
    o.items.push({ id: String(e._id), at: e.at, desc: e.desc || "", url: e.tipo === "url" ? e.url : null, video: e.media === "video", vistas: e.num === me ? e.vistas || [] : undefined });
    if (e.num !== me && !(e.vistas || []).some((v) => v.num === me)) o.visto = false;
  }
  const lista = Object.values(g);
  return NextResponse.json({ mio: g[me] || { mio: true, nombre: "Mi estado", foto: u.cedula?.avatar || null, items: [] }, contactos: lista.filter((x) => !x.mio).sort((a, b) => +new Date(b.items.at(-1).at) - +new Date(a.items.at(-1).at)) });
}
export async function POST(req) {
  const u = await apiUser(); if (!waListo(u)) return bad("Sin línea", 401);
  const b = await req.json(), c = await col(), me = u.chip.num;
  if (b.accion === "subir") {
    const at = new Date(), doc = { num: me, desc: String(b.desc || "").trim().slice(0, 140), at, expira: new Date(+at + HORAS * 3600e3), vistas: [] };
    if ((await c.countDocuments({ num: me, expira: { $gt: at } })) >= 5) return bad("Máximo 5 estados activos a la vez");
    // Solo links: una foto (jpg, png, gif, webp) o un video (mp4, webm, mov) de Discord o Imgur. Ya no se sube desde la galería.
    let h; try { h = new URL(String(b.url || "").trim()); } catch { return bad("Pega el link de tu foto o video"); }
    if (h.protocol !== "https:" || !HOSTS.includes(h.hostname)) return bad("El link debe ser de Discord (cdn.discordapp.com) o Imgur (i.imgur.com)");
    const media = VIDEO.test(h.pathname) ? "video" : FOTO.test(h.pathname) ? "foto" : null; if (!media) return bad("El link debe terminar en una foto (jpg, png, gif, webp) o un video (mp4, webm, mov)");
    doc.tipo = "url"; doc.url = h.href; doc.media = media;
    await c.insertOne(doc); return NextResponse.json({ ok: true });
  }
  const _id = oid(b.id); if (!_id) return bad("No existe", 404);
  if (b.accion === "borrar") { await c.deleteOne({ _id, num: me }); return NextResponse.json({ ok: true }); }
  if (b.accion === "ver") {
    const e = await c.findOne({ _id, expira: { $gt: new Date() } }, { projection: { num: 1 } });
    if (!e || (e.num !== me && !contactos(u).includes(e.num))) return bad("No existe", 404);
    if (e.num !== me) await c.updateOne({ _id, "vistas.num": { $ne: me } }, { $push: { vistas: { num: me, nombre: u.chip.nombre || me, at: new Date() } } });
    return NextResponse.json({ ok: true });
  }
  return bad("Acción inválida");
}
