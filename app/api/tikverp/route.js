import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { waListo, fmtTel } from "@/lib/redes";
import { canReview, RANK_LABEL } from "@/lib/roles";
import { auditar } from "@/lib/auditoria";
import { validarLink, etiquetas, HANDLE, insignia, esFund, parId, tickRacha, rachaVista } from "@/lib/tikverp";
import { ecoCfg } from "@/lib/reserva";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let listo = false;
async function cols() {
  const d = await db(), c = { d, per: d.collection("tv_perfiles"), po: d.collection("tv_posts"), li: d.collection("tv_likes"), co: d.collection("tv_com"), fo: d.collection("tv_follows"), so: d.collection("tv_sonidos"), ch: d.collection("tv_chats"), ms: d.collection("tv_msgs"), bl: d.collection("tv_blocks") };
  if (!listo) { listo = true; await Promise.all([c.per.createIndex({ handle: 1 }, { unique: true }), c.po.createIndex({ at: -1 }), c.po.createIndex({ uid: 1, at: -1 }), c.po.createIndex({ tags: 1 }), c.li.createIndex({ post: 1 }), c.co.createIndex({ post: 1, at: 1 }), c.fo.createIndex({ a: 1 }), c.fo.createIndex({ b: 1 }), c.so.createIndex({ usos: -1 }), c.ch.createIndex({ uids: 1, ult: -1 }), c.ms.createIndex({ chat: 1, at: 1 }), c.bl.createIndex({ a: 1 }), c.bl.createIndex({ b: 1 })]).catch(() => {}); }
  return c;
}
// Moderación (Fundación / Developer): queda en la auditoría de Administración y se manda al canal de Discord.
async function modLog(c, u, req, yo, act, objetivo, detalle, uidObjetivo, imagen = null) {
  try { const t = await c.d.collection("users").findOne({ id: uidObjetivo }, { projection: { cedula: 1 } }); await auditar(c.d, { by: u.id, byName: u.name, rank: u.rank, act, objetivo, razon: `Moderación de VE TikTok (@${yo?.handle || "?"})`, detalle }, { origen: new URL(req.url).origin, t, imagen }); } catch {}
}
const aviso = (d, uid, title, body) => d.collection("notifs").insertOne({ uid, title, body, at: new Date(), read: false });
// Agrega autor, insignia y si yo di like / sigo al autor.
async function armar(c, posts, me) {
  const uids = [...new Set(posts.map((p) => p.uid))], per = Object.fromEntries((await c.per.find({ _id: { $in: uids } }).toArray()).map((x) => [x._id, x]));
  const fl = Object.fromEntries((await c.d.collection("users").find({ id: { $in: uids } }, { projection: { id: 1, dev: 1, staff: 1 } }).toArray()).map((x) => [x.id, insignia(x, per[x.id]?.seguidores)]));
  const likes = new Set((await c.li.find({ _id: { $in: posts.map((p) => `${p._id}:${me}`) } }).toArray()).map((x) => x._id)), sig = new Set((await c.fo.find({ a: me, b: { $in: uids } }).toArray()).map((x) => x.b));
  return posts.map((p) => ({ id: String(p._id), uid: p.uid, handle: p.handle, nombre: per[p.uid]?.nombre || "Cuenta no encontrada", foto: per[p.uid]?.foto || null, badge: fl[p.uid] || null, tipo: p.tipo, url: p.url, desc: p.desc, tags: p.tags || [], sonido: p.sonido || null, likes: p.likes || 0, comentarios: p.comentarios || 0, compartidos: p.compartidos || 0, at: p.at, liked: likes.has(`${p._id}:${me}`), sigue: sig.has(p.uid), mio: p.uid === me }));
}
// Chat: beta (solo Developer y Fundación) hasta que Administración → Economía lo abra.
const chatOn = async (d, u) => esFund(u) || (await ecoCfg(d)).tiktokChat === "abierto";
// Bloqueos: yo = a quién bloqueé; ellos = quién me bloqueó.
async function ocultos(c, me) { const l = await c.bl.find({ $or: [{ a: me }, { b: me }] }).toArray(); const yo = new Set(l.filter((x) => x.a === me).map((x) => x.b)), ellos = new Set(l.filter((x) => x.b === me).map((x) => x.a)); return { yo, ellos, todos: [...yo, ...ellos] }; }
const yo_h = (x) => (x?.handleAt ? new Date(+new Date(x.handleAt) + 7 * 864e5).toISOString() : null);
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
  if (m === "me") { const x = await c.per.findOne({ _id: me }); return NextResponse.json({ perfil: x ? perfilPub(x) : null, avatar: u.cedula?.avatar || null, handleEn: yo_h(x), contactos: (u.wa?.contactos || []).map((k) => ({ num: k.num, alias: k.alias || fmtTel(k.num) })), puedeCompartir: waListo(u), staff: canReview(u.rank) || esFund(u), mod: esFund(u), chat: await chatOn(c.d, u) }); }
  if (!(await c.per.findOne({ _id: me }, { projection: { _id: 1 } }))) return bad("Crea tu cuenta de VE TikTok primero", 403);
  if (m === "feed") {
    const t = p.get("t") === "sig" ? "sig" : "para", antes = Number(p.get("antes")), q = {};
    if (antes) q.at = { $lt: new Date(antes) };
    const oc = await ocultos(c, me); if (t === "sig") q.uid = { $in: (await c.fo.find({ a: me }).toArray()).map((x) => x.b).filter((x) => !oc.todos.includes(x)) }; else if (oc.todos.length) q.uid = { $nin: oc.todos };
    const v = oid(p.get("v")), primero = v && !antes ? await c.po.findOne({ _id: v, uid: { $nin: oc.todos } }) : null;
    let l = await c.po.find(q).sort({ at: -1 }).limit(12).toArray(); if (primero) l = [primero, ...l.filter((x) => String(x._id) !== String(primero._id))];
    return NextResponse.json({ posts: await armar(c, l, me), fin: l.length < 12 });
  }
  if (m === "perfil") {
    const h = String(p.get("h") || "").toLowerCase(), x = await c.per.findOne({ handle: h }); if (!x) return bad("Cuenta no encontrada", 404);
    const oc = await ocultos(c, me); if (oc.ellos.has(x._id)) return bad("Cuenta no encontrada", 404); // si te bloqueó, para ti no existe
    if (oc.yo.has(x._id)) return NextResponse.json({ perfil: perfilPub(x, { yo: false, bloqueado: true, mod: esFund(u) }), posts: [] });
    const l = await c.po.find({ uid: x._id }).sort({ at: -1 }).limit(60).toArray(), fl = await c.d.collection("users").findOne({ id: x._id }, { projection: { dev: 1, staff: 1 } });
    return NextResponse.json({ perfil: perfilPub(x, { sigo: !!(await c.fo.findOne({ _id: `${me}:${x._id}` })), yo: x._id === me, badge: insignia(fl, x.seguidores), mod: esFund(u) }), posts: await armar(c, l, me) });
  }
  if (m === "com") {
    const id = oid(p.get("id")); if (!id) return bad("Publicación inválida");
    const l = await c.co.find({ post: String(id) }).sort({ at: 1 }).limit(150).toArray(), per = Object.fromEntries((await c.per.find({ _id: { $in: [...new Set(l.map((x) => x.uid))] } }).toArray()).map((x) => [x._id, x]));
    return NextResponse.json({ l: l.map((x) => ({ id: String(x._id), uid: x.uid, handle: per[x.uid] ? per[x.uid].handle : "Cuenta no encontrada", borrada: !per[x.uid], foto: per[x.uid]?.foto || null, txt: x.txt, at: x.at, mio: x.uid === me })) });
  }
  if (m === "sonidos") { const q = String(p.get("q") || "").trim().slice(0, 30), l = await c.so.find(q ? { titulo: new RegExp(esc(q), "i") } : {}).sort({ usos: -1, at: -1 }).limit(40).toArray(); return NextResponse.json({ l: l.map((x) => ({ id: String(x._id), titulo: x.titulo, artista: x.artista, url: x.url, por: x.handle, usos: x.usos || 0 })) }); }
  if (m === "buscar") {
    const q = String(p.get("q") || "").trim().slice(0, 40); if (q.length < 2) return NextResponse.json({ perfiles: [], posts: [] });
    const oc = await ocultos(c, me);
    if (q.startsWith("#")) return NextResponse.json({ perfiles: [], posts: await armar(c, await c.po.find({ tags: q.slice(1).toLowerCase(), uid: { $nin: oc.todos } }).sort({ at: -1 }).limit(30).toArray(), me) });
    const rx = new RegExp(esc(q.replace(/^@/, "")), "i");
    return NextResponse.json({ perfiles: (await c.per.find({ $or: [{ handle: rx }, { nombre: rx }], _id: { $nin: oc.todos } }).limit(10).toArray()).map((x) => perfilPub(x)), posts: await armar(c, await c.po.find({ desc: rx, uid: { $nin: oc.todos } }).sort({ at: -1 }).limit(20).toArray(), me) });
  }
  if (m === "chats" || m === "chat" || m === "bloqueados") {
    if (m === "bloqueados") { const l = await c.bl.find({ a: me }).toArray(), per = await c.per.find({ _id: { $in: l.map((x) => x.b) } }).toArray(); return NextResponse.json({ l: per.map((x) => ({ handle: x.handle, nombre: x.nombre, foto: x.foto || null })) }); }
    if (!(await chatOn(c.d, u))) return bad("El chat de VE TikTok está en beta", 403);
    if (m === "chats") {
      const l = await c.ch.find({ uids: me, estado: { $ne: "rechazado" } }).sort({ ult: -1 }).limit(60).toArray(), ot = l.map((x) => x.uids.find((y) => y !== me)), per = Object.fromEntries((await c.per.find({ _id: { $in: ot } }).toArray()).map((x) => [x._id, x]));
      return NextResponse.json({ l: l.filter((x) => per[x.uids.find((y) => y !== me)]).map((x) => { const o = per[x.uids.find((y) => y !== me)]; return { handle: o.handle, nombre: o.nombre, foto: o.foto || null, estado: x.estado, solicitud: x.estado === "pendiente" && x.from !== me, enviada: x.estado === "pendiente" && x.from === me, ultTxt: x.ultTxt, ult: x.ult, sinLeer: x.ultFrom !== me && +new Date(x.ult) > +new Date(x.visto?.[me] || 0), racha: x.estado === "aceptado" ? rachaVista(x, me) : null }; }) });
    }
    const o = await c.per.findOne({ handle: String(p.get("h") || "").toLowerCase() }); if (!o) return bad("Cuenta no encontrada", 404);
    const ch = await c.ch.findOne({ _id: parId(me, o._id) }); if (!ch) return NextResponse.json({ perfil: perfilPub(o), estado: null, msgs: [] });
    await c.ch.updateOne({ _id: ch._id }, { $set: { [`visto.${me}`]: new Date() } }); const ms = (await c.ms.find({ chat: ch._id }).sort({ at: -1 }).limit(120).toArray()).reverse();
    return NextResponse.json({ perfil: perfilPub(o), estado: ch.estado, solicitud: ch.estado === "pendiente" && ch.from !== me, enviada: ch.estado === "pendiente" && ch.from === me, racha: ch.estado === "aceptado" ? rachaVista(ch, me) : null, msgs: ms.map((x) => ({ id: String(x._id), mio: x.de === me, txt: x.txt, post: x.post || null, at: x.at })) });
  }
  return bad("Consulta inválida");
}

export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json(), c = await cols(), me = u.id, at = new Date(), yo = await c.per.findOne({ _id: me });
  if (b.accion === "crear" || b.accion === "editar") {
    const nombre = String(b.nombre || "").trim().slice(0, 30), bio = String(b.bio || "").trim().slice(0, 120); if (!nombre) return bad("Escribe tu nombre");
    let foto = yo?.foto || u.cedula?.avatar || null; if (b.accion === "editar" || String(b.foto || "").trim()) { const f = String(b.foto || "").trim(); if (f) { const r = validarLink(f, "foto"); if (r.error) return bad(r.error); foto = r.href; } else if (b.accion === "editar") foto = u.cedula?.avatar || null; }
    if (b.accion === "editar") {
      if (!yo) return bad("Crea tu cuenta primero"); const set = { nombre, bio, foto }, nh = String(b.handle || "").trim().toLowerCase().replace(/^@/, "");
      if (nh && nh !== yo.handle) { // el usuario solo se puede cambiar cada 7 días
        if (!HANDLE.test(nh)) return bad("El usuario debe tener 3 a 20 letras minúsculas, números, _ o .");
        const falta = yo.handleAt ? +new Date(yo.handleAt) + 7 * 864e5 - +at : 0; if (falta > 0) return bad(`Solo puedes cambiar tu usuario cada 7 días. Te faltan ${Math.ceil(falta / 864e5)} día(s)`);
        try { await c.per.updateOne({ _id: me }, { $set: { ...set, handle: nh, handleAt: at } }); } catch (e) { if (e.code === 11000) return bad("Ese usuario ya está en uso"); throw e; }
        await c.po.updateMany({ uid: me }, { $set: { handle: nh } }); await c.co.updateMany({ uid: me }, { $set: { handle: nh } }); return NextResponse.json({ ok: true, handle: nh });
      }
      await c.per.updateOne({ _id: me }, { $set: set }); return NextResponse.json({ ok: true });
    }
    if (yo) return bad("Ya tienes cuenta"); const handle = String(b.handle || "").trim().toLowerCase().replace(/^@/, ""); if (!HANDLE.test(handle)) return bad("El usuario debe tener 3 a 20 letras minúsculas, números, _ o .");
    try { await c.per.insertOne({ _id: me, handle, nombre, bio, foto, seguidores: 0, siguiendo: 0, likes: 0, at }); } catch (e) { if (e.code === 11000) return bad("Ese usuario ya está en uso"); throw e; }
    return NextResponse.json({ ok: true });
  }
  if (!yo) return bad("Crea tu cuenta de VE TikTok primero", 403);
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
  if (["msg", "aceptar", "rechazar", "bloquear", "desbloquear"].includes(b.accion)) {
    const h = String(b.handle || "").toLowerCase().replace(/^@/, ""), o = await c.per.findOne({ handle: h }); if (!o) return bad("Cuenta no encontrada", 404); if (o._id === me) return bad("No puedes hacer eso contigo mismo");
    const id = parId(me, o._id);
    if (b.accion === "bloquear") {
      try { await c.bl.insertOne({ _id: `${me}:${o._id}`, a: me, b: o._id, at }); } catch (e) { if (e.code !== 11000) throw e; }
      for (const f of await c.fo.find({ $or: [{ a: me, b: o._id }, { a: o._id, b: me }] }).toArray()) { await c.fo.deleteOne({ _id: f._id }); await c.per.updateOne({ _id: f.b }, { $inc: { seguidores: -1 } }); await c.per.updateOne({ _id: f.a }, { $inc: { siguiendo: -1 } }); }
      await c.ch.deleteOne({ _id: id }); await c.ms.deleteMany({ chat: id }); return NextResponse.json({ ok: true });
    }
    if (b.accion === "desbloquear") { await c.bl.deleteOne({ _id: `${me}:${o._id}` }); return NextResponse.json({ ok: true }); }
    if (!(await chatOn(c.d, u))) return bad("El chat de VE TikTok está en beta", 403);
    if (await c.bl.findOne({ _id: { $in: [`${me}:${o._id}`, `${o._id}:${me}`] } })) return bad("No puedes enviar mensajes a esta cuenta");
    const ch = await c.ch.findOne({ _id: id });
    if (b.accion === "aceptar" || b.accion === "rechazar") {
      if (!ch || ch.estado !== "pendiente" || ch.from === me) return bad("No hay solicitud pendiente de esa cuenta");
      await c.ch.updateOne({ _id: id }, { $set: { estado: b.accion === "aceptar" ? "aceptado" : "rechazado" } }); if (b.accion === "aceptar") await aviso(c.d, o._id, "Chat aceptado en VE TikTok", `@${yo.handle} aceptó tu solicitud de chat.`);
      return NextResponse.json({ ok: true });
    }
    // msg: texto o un video/foto compartido
    const ru = await c.d.collection("users").findOne({ id: o._id }, { projection: { dev: 1, staff: 1 } }); if (!(await chatOn(c.d, { ...ru, rank: ru?.dev ? "DEVELOPER" : ru?.staff }))) return bad("Esa persona todavía no tiene el chat (está en beta)");
    let pst = null; if (b.post) { const _id = oid(b.post), x = _id && (await c.po.findOne({ _id })); if (!x) return bad("Esa publicación ya no existe"); pst = { id: String(_id), handle: x.handle, tipo: x.tipo, desc: String(x.desc || "").slice(0, 60) }; }
    const txt = String(b.txt || "").trim().slice(0, 300); if (!txt && !pst) return bad("Escribe un mensaje");
    if ((await c.ms.countDocuments({ de: me, at: { $gt: new Date(+at - 6e4) } })) >= 30) return bad("Vas muy rápido, espera un momento");
    const resumen = pst ? `🎬 Video de @${pst.handle}` : txt.slice(0, 60);
    if (ch?.estado === "rechazado") return bad("No puedes enviar mensajes a esta cuenta");
    if (ch?.estado === "pendiente") return bad(ch.from === me ? "Espera a que acepten tu solicitud de chat" : "Primero acepta la solicitud de chat");
    if (!ch) { // primer mensaje = solicitud: la otra persona debe aceptarla antes de poder chatear
      await c.ch.insertOne({ _id: id, uids: [me, o._id], estado: "pendiente", from: me, at, ult: at, ultTxt: resumen, ultFrom: me, rd: tickRacha({ uids: [me, o._id] }, me).rd, hoy: { [me]: true }, visto: { [me]: at } });
      await c.ms.insertOne({ chat: id, de: me, txt, post: pst, at }); await aviso(c.d, o._id, "Solicitud de chat en VE TikTok", `@${yo.handle} quiere chatear contigo. Acéptala en Mensajes.`);
      return NextResponse.json({ ok: true, solicitud: true });
    }
    await c.ms.insertOne({ chat: id, de: me, txt, post: pst, at });
    await c.ch.updateOne({ _id: id }, { $set: { ult: at, ultTxt: resumen, ultFrom: me, [`visto.${me}`]: at, ...tickRacha(ch, me, +at) } });
    return NextResponse.json({ ok: true, racha: rachaVista({ ...ch, ...tickRacha(ch, me, +at) }, me) });
  }
  if (b.accion === "eliminarCuenta") { // el dueño borra su cuenta; Fundación/Developer pueden borrar la de otro (b.handle)
    let t = yo; if (b.handle && String(b.handle).toLowerCase().replace(/^@/, "") !== yo.handle) { if (!esFund(u)) return bad("No puedes eliminar la cuenta de otra persona", 403); t = await c.per.findOne({ handle: String(b.handle).toLowerCase().replace(/^@/, "") }); if (!t) return bad("Ese perfil no existe", 404); }
    const uid = t._id, posts = await c.po.find({ uid }, { projection: { _id: 1 } }).toArray(), ids = posts.map((x) => String(x._id));
    if (ids.length) { await c.li.deleteMany({ post: { $in: ids } }); await c.co.deleteMany({ post: { $in: ids } }); await c.po.deleteMany({ uid }); }
    for (const l of await c.li.find({ uid }).limit(5000).toArray()) { const _id = oid(l.post); if (_id) { const r = await c.po.findOneAndUpdate({ _id }, { $inc: { likes: -1 } }); if (r) await c.per.updateOne({ _id: r.uid }, { $inc: { likes: -1 } }); } }
    await c.li.deleteMany({ uid });
    for (const f of await c.fo.find({ $or: [{ a: uid }, { b: uid }] }).toArray()) { if (f.a === uid) await c.per.updateOne({ _id: f.b }, { $inc: { seguidores: -1 } }); else await c.per.updateOne({ _id: f.a }, { $inc: { siguiendo: -1 } }); }
    await c.fo.deleteMany({ $or: [{ a: uid }, { b: uid }] }); await c.per.deleteOne({ _id: uid });
    if (uid !== me) await modLog(c, u, req, yo, "tiktokEliminarCuenta", `Cuenta @${t.handle}`, { cuenta: "@" + t.handle, nombre: t.nombre, seguidores: t.seguidores || 0, publicaciones: ids.length }, uid, t.foto || null);
    if (uid !== me) await aviso(c.d, uid, "Cuenta de VE TikTok eliminada", "Un moderador (Fundación/Developer) eliminó tu cuenta de VE TikTok. Puedes crear otra.");
    return NextResponse.json({ ok: true, propia: uid === me });
  }
  const id = oid(b.id), post = id && (await c.po.findOne({ _id: id })); if (b.accion !== "seguir" && !post) return bad("Esa publicación ya no existe", 404);
  if (post && post.uid !== me && b.accion !== "borrar" && b.accion !== "borrarCom" && (await c.bl.findOne({ _id: { $in: [`${me}:${post.uid}`, `${post.uid}:${me}`] } }))) return bad("No disponible");
  if (b.accion === "like") {
    const k = `${id}:${me}`; let on;
    try { await c.li.insertOne({ _id: k, post: String(id), uid: me, at }); on = true; } catch (e) { if (e.code !== 11000) throw e; await c.li.deleteOne({ _id: k }); on = false; }
    await c.po.updateOne({ _id: id }, { $inc: { likes: on ? 1 : -1 } }); await c.per.updateOne({ _id: post.uid }, { $inc: { likes: on ? 1 : -1 } });
    if (on && post.uid !== me) await aviso(c.d, post.uid, "Nuevo me gusta en VE TikTok", `A @${yo.handle} le gustó tu publicación.`);
    return NextResponse.json({ ok: true, liked: on });
  }
  if (b.accion === "comentar") {
    const txt = String(b.txt || "").trim().slice(0, 150); if (!txt) return bad("Escribe un comentario");
    if ((await c.co.countDocuments({ uid: me, at: { $gt: new Date(+at - 6e4) } })) >= 15) return bad("Vas muy rápido, espera un momento");
    await c.co.insertOne({ post: String(id), uid: me, handle: yo.handle, txt, at }); await c.po.updateOne({ _id: id }, { $inc: { comentarios: 1 } });
    if (post.uid !== me) await aviso(c.d, post.uid, "Nuevo comentario en VE TikTok", `@${yo.handle}: ${txt.slice(0, 80)}`);
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "borrarCom") {
    const cid = oid(b.cid), x = cid && (await c.co.findOne({ _id: cid, post: String(id) })); if (!x) return bad("No existe", 404);
    if (x.uid !== me && post.uid !== me && !canReview(u.rank)) return bad("No puedes borrar este comentario", 403);
    await c.co.deleteOne({ _id: cid }); await c.po.updateOne({ _id: id }, { $inc: { comentarios: -1 } });
    if (x.uid !== me && post.uid !== me) await modLog(c, u, req, yo, "tiktokBorrarComentario", `Comentario de @${x.handle}`, { autor: "@" + x.handle, comentario: x.txt, "en el video de": "@" + post.handle }, x.uid);
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "borrar") {
    if (post.uid !== me && !esFund(u)) return bad("Solo el dueño del video puede borrarlo", 403);
    const nl = await c.li.countDocuments({ post: String(id) }); await c.po.deleteOne({ _id: id }); await c.li.deleteMany({ post: String(id) }); await c.co.deleteMany({ post: String(id) }); await c.per.updateOne({ _id: post.uid }, { $inc: { likes: -nl } });
    if (post.uid !== me) await modLog(c, u, req, yo, "tiktokBorrarVideo", `Video de @${post.handle}`, { autor: "@" + post.handle, descripcion: post.desc || "(sin descripción)", enlace: post.url, likes: post.likes || 0, comentarios: post.comentarios || 0 }, post.uid, post.tipo === "foto" ? post.url : null);
    if (post.uid !== me) await aviso(c.d, post.uid, "Publicación eliminada en VE TikTok", "Un moderador (Fundación/Developer) eliminó una de tus publicaciones.");
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "compartir") { // enviar la publicación a un contacto por VE WhatsApp, o solo contar el enlace copiado
    if (b.num) {
      if (!waListo(u)) return bad("Necesitas teléfono y chip para compartir por VE WhatsApp"); const para = String(b.num);
      if (!(u.wa?.contactos || []).some((k) => k.num === para)) return bad("Ese contacto no está en tu lista");
      if ((await c.d.collection("wa_msgs").countDocuments({ de: u.chip.num, at: { $gte: new Date(Date.now() - 60000) } })) >= 30) return bad("Vas muy rápido, espera un momento");
      await c.d.collection("wa_msgs").insertOne({ de: u.chip.num, para, texto: `VE TikTok · @${post.handle}: ${post.desc ? post.desc.slice(0, 80) + " " : ""}${new URL(req.url).origin}/tikverp?v=${id}`.slice(0, 500), at, leido: false });
    }
    await c.po.updateOne({ _id: id }, { $inc: { compartidos: 1 } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "seguir") {
    const h = String(b.handle || "").toLowerCase(), x = await c.per.findOne({ handle: h }); if (!x) return bad("Ese perfil no existe", 404); if (x._id === me) return bad("No puedes seguirte a ti mismo");
    if (await c.bl.findOne({ _id: { $in: [`${me}:${x._id}`, `${x._id}:${me}`] } })) return bad("No disponible");
    const k = `${me}:${x._id}`; let on; try { await c.fo.insertOne({ _id: k, a: me, b: x._id, at }); on = true; } catch (e) { if (e.code !== 11000) throw e; await c.fo.deleteOne({ _id: k }); on = false; }
    await c.per.updateOne({ _id: x._id }, { $inc: { seguidores: on ? 1 : -1 } }); await c.per.updateOne({ _id: me }, { $inc: { siguiendo: on ? 1 : -1 } });
    if (on) await aviso(c.d, x._id, "Nuevo seguidor en VE TikTok", `@${yo.handle} empezó a seguirte.`);
    return NextResponse.json({ ok: true, sigue: on });
  }
  return bad("Acción inválida");
}
