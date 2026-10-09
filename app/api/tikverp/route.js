import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { waListo, fmtTel } from "@/lib/redes";
import { canReview, RANK_LABEL } from "@/lib/roles";
import { validarLink, etiquetas, HANDLE } from "@/lib/tikverp";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let listo = false;
async function cols() {
  const d = await db(), c = { d, per: d.collection("tv_perfiles"), po: d.collection("tv_posts"), li: d.collection("tv_likes"), co: d.collection("tv_com"), fo: d.collection("tv_follows"), so: d.collection("tv_sonidos") };
  if (!listo) { listo = true; await Promise.all([c.per.createIndex({ handle: 1 }, { unique: true }), c.po.createIndex({ at: -1 }), c.po.createIndex({ uid: 1, at: -1 }), c.po.createIndex({ tags: 1 }), c.li.createIndex({ post: 1 }), c.co.createIndex({ post: 1, at: 1 }), c.fo.createIndex({ a: 1 }), c.fo.createIndex({ b: 1 }), c.so.createIndex({ usos: -1 })]).catch(() => {}); }
  return c;
}
const aviso = (d, uid, title, body) => d.collection("notifs").insertOne({ uid, title, body, at: new Date(), read: false });
// Agrega autor, insignia y si yo di like / sigo al autor.
async function armar(c, posts, me) {
  const uids = [...new Set(posts.map((p) => p.uid))], per = Object.fromEntries((await c.per.find({ _id: { $in: uids } }).toArray()).map((x) => [x._id, x]));
  const fl = Object.fromEntries((await c.d.collection("users").find({ id: { $in: uids } }, { projection: { id: 1, dev: 1, staff: 1 } }).toArray()).map((x) => [x.id, x.dev ? "Developer" : RANK_LABEL[x.staff] || null]));
  const likes = new Set((await c.li.find({ _id: { $in: posts.map((p) => `${p._id}:${me}`) } }).toArray()).map((x) => x._id)), sig = new Set((await c.fo.find({ a: me, b: { $in: uids } }).toArray()).map((x) => x.b));
  return posts.map((p) => ({ id: String(p._id), uid: p.uid, handle: p.handle, nombre: per[p.uid]?.nombre || p.handle, foto: per[p.uid]?.foto || null, badge: fl[p.uid] || null, tipo: p.tipo, url: p.url, desc: p.desc, tags: p.tags || [], sonido: p.sonido || null, likes: p.likes || 0, comentarios: p.comentarios || 0, compartidos: p.compartidos || 0, at: p.at, liked: likes.has(`${p._id}:${me}`), sigue: sig.has(p.uid), mio: p.uid === me }));
}
const perfilPub = (x, extra = {}) => ({ uid: x._id, handle: x.handle, nombre: x.nombre, bio: x.bio || "", foto: x.foto || null, seguidores: x.seguidores || 0, siguiendo: x.siguiendo || 0, likes: x.likes || 0, ...extra });

export async function GET(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const c = await cols(), p = new URL(req.url).searchParams, m = p.get("m") || "feed", me = u.id;
  if (m === "audio") { // reproduce un audio subido desde el celular
    const _id = oid(p.get("id")), a = _id && (await c.d.collection("tv_audio").findOne({ _id })); if (!a) return bad("Ese audio ya no existe", 404);
    const buf = Buffer.from(a.data, "base64"), h = { "Content-Type": a.mime, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=86400" }, rg = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
    if (rg) { const ini = rg[1] ? +rg[1] : 0, fin = rg[2] ? Math.min(+rg[2], buf.length - 1) : buf.length - 1; return new Response(buf.subarray(ini, fin + 1), { status: 206, headers: { ...h, "Content-Range": `bytes ${ini}-${fin}/${buf.length}`, "Content-Length": String(fin - ini + 1) } }); }
    return new Response(buf, { headers: { ...h, "Content-Length": String(buf.length) } });
  }
  if (m === "me") { const x = await c.per.findOne({ _id: me }); return NextResponse.json({ perfil: x ? perfilPub(x) : null, avatar: u.cedula?.avatar || null, contactos: (u.wa?.contactos || []).map((k) => ({ num: k.num, alias: k.alias || fmtTel(k.num) })), puedeCompartir: waListo(u), staff: canReview(u.rank) }); }
  if (!(await c.per.findOne({ _id: me }, { projection: { _id: 1 } }))) return bad("Crea tu cuenta de TikVerp primero", 403);
  if (m === "feed") {
    const t = p.get("t") === "sig" ? "sig" : "para", antes = Number(p.get("antes")), q = {};
    if (antes) q.at = { $lt: new Date(antes) };
    if (t === "sig") q.uid = { $in: (await c.fo.find({ a: me }).toArray()).map((x) => x.b) };
    const v = oid(p.get("v")), primero = v && !antes ? await c.po.findOne({ _id: v }) : null;
    let l = await c.po.find(q).sort({ at: -1 }).limit(12).toArray(); if (primero) l = [primero, ...l.filter((x) => String(x._id) !== String(primero._id))];
    return NextResponse.json({ posts: await armar(c, l, me), fin: l.length < 12 });
  }
  if (m === "perfil") {
    const h = String(p.get("h") || "").toLowerCase(), x = await c.per.findOne({ handle: h }); if (!x) return bad("Ese perfil no existe", 404);
    const l = await c.po.find({ uid: x._id }).sort({ at: -1 }).limit(60).toArray(), fl = await c.d.collection("users").findOne({ id: x._id }, { projection: { dev: 1, staff: 1 } });
    return NextResponse.json({ perfil: perfilPub(x, { sigo: !!(await c.fo.findOne({ _id: `${me}:${x._id}` })), yo: x._id === me, badge: fl?.dev ? "Developer" : RANK_LABEL[fl?.staff] || null }), posts: await armar(c, l, me) });
  }
  if (m === "com") {
    const id = oid(p.get("id")); if (!id) return bad("Publicación inválida");
    const l = await c.co.find({ post: String(id) }).sort({ at: 1 }).limit(150).toArray(), per = Object.fromEntries((await c.per.find({ _id: { $in: [...new Set(l.map((x) => x.uid))] } }).toArray()).map((x) => [x._id, x]));
    return NextResponse.json({ l: l.map((x) => ({ id: String(x._id), uid: x.uid, handle: x.handle, foto: per[x.uid]?.foto || null, txt: x.txt, at: x.at, mio: x.uid === me })) });
  }
  if (m === "sonidos") { const q = String(p.get("q") || "").trim().slice(0, 30), l = await c.so.find(q ? { titulo: new RegExp(esc(q), "i") } : {}).sort({ usos: -1, at: -1 }).limit(40).toArray(); return NextResponse.json({ l: l.map((x) => ({ id: String(x._id), titulo: x.titulo, artista: x.artista, url: x.url, por: x.handle, usos: x.usos || 0 })) }); }
  if (m === "buscar") {
    const q = String(p.get("q") || "").trim().slice(0, 40); if (q.length < 2) return NextResponse.json({ perfiles: [], posts: [] });
    if (q.startsWith("#")) return NextResponse.json({ perfiles: [], posts: await armar(c, await c.po.find({ tags: q.slice(1).toLowerCase() }).sort({ at: -1 }).limit(30).toArray(), me) });
    const rx = new RegExp(esc(q.replace(/^@/, "")), "i");
    return NextResponse.json({ perfiles: (await c.per.find({ $or: [{ handle: rx }, { nombre: rx }] }).limit(10).toArray()).map((x) => perfilPub(x)), posts: await armar(c, await c.po.find({ desc: rx }).sort({ at: -1 }).limit(20).toArray(), me) });
  }
  return bad("Consulta inválida");
}

export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json(), c = await cols(), me = u.id, at = new Date(), yo = await c.per.findOne({ _id: me });
  if (b.accion === "crear" || b.accion === "editar") {
    const nombre = String(b.nombre || "").trim().slice(0, 30), bio = String(b.bio || "").trim().slice(0, 120); if (!nombre) return bad("Escribe tu nombre");
    let foto = yo?.foto || u.cedula?.avatar || null; if (b.accion === "editar" || String(b.foto || "").trim()) { const f = String(b.foto || "").trim(); if (f) { const r = validarLink(f, "foto"); if (r.error) return bad(r.error); foto = r.href; } else if (b.accion === "editar") foto = u.cedula?.avatar || null; }
    if (b.accion === "editar") { if (!yo) return bad("Crea tu cuenta primero"); await c.per.updateOne({ _id: me }, { $set: { nombre, bio, foto } }); return NextResponse.json({ ok: true }); }
    if (yo) return bad("Ya tienes cuenta"); const handle = String(b.handle || "").trim().toLowerCase().replace(/^@/, ""); if (!HANDLE.test(handle)) return bad("El usuario debe tener 3 a 20 letras minúsculas, números, _ o .");
    try { await c.per.insertOne({ _id: me, handle, nombre, bio, foto, seguidores: 0, siguiendo: 0, likes: 0, at }); } catch (e) { if (e.code === 11000) return bad("Ese usuario ya está en uso"); throw e; }
    return NextResponse.json({ ok: true });
  }
  if (!yo) return bad("Crea tu cuenta de TikVerp primero", 403);
  const nuevoSonido = async (s) => {
    const titulo = String(s?.titulo || "").trim().slice(0, 50), artista = String(s?.artista || "").trim().slice(0, 40) || yo.nombre; if (!titulo) return { error: "Ponle un título a tu música" };
    if (!s?.dataUrl && !s?.url) return { error: "Elige un audio de tu celular o pega un link de Discord" };
    let href, arch = null;
    if (s?.dataUrl) { // audio subido desde el celular (se guarda en la base de datos, máx. 2.5 MB)
      const du = String(s.dataUrl), i = du.indexOf(";base64,"), mime = du.slice(5, i), data = du.slice(i + 8);
      if (i < 0 || !/^(audio\/[\w.+-]+|video\/(mp4|webm))$/.test(mime)) return { error: "Ese archivo no es un audio válido" }; if (data.length > 3.4e6) return { error: "El audio pesa más de 2.5 MB: usa uno más corto" }; if (!/^[A-Za-z0-9+/=]+$/.test(data)) return { error: "Audio dañado, intenta de nuevo" };
      if ((await c.d.collection("tv_audio").countDocuments({ uid: me })) >= 20) return { error: "Ya subiste 20 audios. Usa los del catálogo" }; arch = { mime, data };
    } else { const r = validarLink(s.url, "audio"); if (r.error) return r; href = r.href; }
    if ((await c.so.countDocuments({ uid: me, at: { $gt: new Date(+at - 36e5) } })) >= 5) return { error: "Máximo 5 sonidos por hora" };
    if (arch) { const a = await c.d.collection("tv_audio").insertOne({ uid: me, mime: arch.mime, data: arch.data, at }); href = `/api/tikverp?m=audio&id=${a.insertedId}`; }
    const x = await c.so.insertOne({ titulo, artista, url: href, uid: me, handle: yo.handle, usos: 0, at }); return { id: x.insertedId, titulo, artista, url: href };
  };
  if (b.accion === "sonido") { const s = await nuevoSonido(b); return s.error ? bad(s.error) : NextResponse.json({ ok: true }); }
  if (b.accion === "publicar") {
    const r = validarLink(b.url, "media"); if (r.error) return bad(r.error); const desc = String(b.desc || "").trim().slice(0, 200);
    if ((await c.po.countDocuments({ uid: me, at: { $gt: new Date(+at - 36e5) } })) >= 10) return bad("Máximo 10 publicaciones por hora");
    let sonido = null;
    if (b.sonidoId) { const _id = oid(b.sonidoId), s = _id && (await c.so.findOneAndUpdate({ _id }, { $inc: { usos: 1 } })); if (!s) return bad("Ese sonido ya no existe"); sonido = { id: String(s._id), titulo: s.titulo, artista: s.artista, url: s.url }; }
    else if (b.sonidoNuevo) { const s = await nuevoSonido(b.sonidoNuevo); if (s.error) return bad(s.error); await c.so.updateOne({ _id: s.id }, { $inc: { usos: 1 } }); sonido = { id: String(s.id), titulo: s.titulo, artista: s.artista, url: s.url }; }
    await c.po.insertOne({ uid: me, handle: yo.handle, tipo: r.media, url: r.href, desc, tags: etiquetas(desc), sonido, likes: 0, comentarios: 0, compartidos: 0, at }); return NextResponse.json({ ok: true });
  }
  const id = oid(b.id), post = id && (await c.po.findOne({ _id: id })); if (b.accion !== "seguir" && !post) return bad("Esa publicación ya no existe", 404);
  if (b.accion === "like") {
    const k = `${id}:${me}`; let on;
    try { await c.li.insertOne({ _id: k, post: String(id), uid: me, at }); on = true; } catch (e) { if (e.code !== 11000) throw e; await c.li.deleteOne({ _id: k }); on = false; }
    await c.po.updateOne({ _id: id }, { $inc: { likes: on ? 1 : -1 } }); await c.per.updateOne({ _id: post.uid }, { $inc: { likes: on ? 1 : -1 } });
    if (on && post.uid !== me) await aviso(c.d, post.uid, "Nuevo me gusta en TikVerp", `A @${yo.handle} le gustó tu publicación.`);
    return NextResponse.json({ ok: true, liked: on });
  }
  if (b.accion === "comentar") {
    const txt = String(b.txt || "").trim().slice(0, 150); if (!txt) return bad("Escribe un comentario");
    if ((await c.co.countDocuments({ uid: me, at: { $gt: new Date(+at - 6e4) } })) >= 15) return bad("Vas muy rápido, espera un momento");
    await c.co.insertOne({ post: String(id), uid: me, handle: yo.handle, txt, at }); await c.po.updateOne({ _id: id }, { $inc: { comentarios: 1 } });
    if (post.uid !== me) await aviso(c.d, post.uid, "Nuevo comentario en TikVerp", `@${yo.handle}: ${txt.slice(0, 80)}`);
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "borrarCom") {
    const cid = oid(b.cid), x = cid && (await c.co.findOne({ _id: cid, post: String(id) })); if (!x) return bad("No existe", 404);
    if (x.uid !== me && post.uid !== me && !canReview(u.rank)) return bad("No puedes borrar este comentario", 403);
    await c.co.deleteOne({ _id: cid }); await c.po.updateOne({ _id: id }, { $inc: { comentarios: -1 } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "borrar") {
    if (post.uid !== me) return bad("Solo el dueño del video puede borrarlo", 403);
    const nl = await c.li.countDocuments({ post: String(id) }); await c.po.deleteOne({ _id: id }); await c.li.deleteMany({ post: String(id) }); await c.co.deleteMany({ post: String(id) }); await c.per.updateOne({ _id: post.uid }, { $inc: { likes: -nl } });
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "compartir") { // enviar la publicación a un contacto por VE WhatsApp, o solo contar el enlace copiado
    if (b.num) {
      if (!waListo(u)) return bad("Necesitas teléfono y chip para compartir por VE WhatsApp"); const para = String(b.num);
      if (!(u.wa?.contactos || []).some((k) => k.num === para)) return bad("Ese contacto no está en tu lista");
      if ((await c.d.collection("wa_msgs").countDocuments({ de: u.chip.num, at: { $gte: new Date(Date.now() - 60000) } })) >= 30) return bad("Vas muy rápido, espera un momento");
      await c.d.collection("wa_msgs").insertOne({ de: u.chip.num, para, texto: `TikVerp · @${post.handle}: ${post.desc ? post.desc.slice(0, 80) + " " : ""}${new URL(req.url).origin}/tikverp?v=${id}`.slice(0, 500), at, leido: false });
    }
    await c.po.updateOne({ _id: id }, { $inc: { compartidos: 1 } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "seguir") {
    const h = String(b.handle || "").toLowerCase(), x = await c.per.findOne({ handle: h }); if (!x) return bad("Ese perfil no existe", 404); if (x._id === me) return bad("No puedes seguirte a ti mismo");
    const k = `${me}:${x._id}`; let on; try { await c.fo.insertOne({ _id: k, a: me, b: x._id, at }); on = true; } catch (e) { if (e.code !== 11000) throw e; await c.fo.deleteOne({ _id: k }); on = false; }
    await c.per.updateOne({ _id: x._id }, { $inc: { seguidores: on ? 1 : -1 } }); await c.per.updateOne({ _id: me }, { $inc: { siguiendo: on ? 1 : -1 } });
    if (on) await aviso(c.d, x._id, "Nuevo seguidor en TikVerp", `@${yo.handle} empezó a seguirte.`);
    return NextResponse.json({ ok: true, sigue: on });
  }
  return bad("Acción inválida");
}
