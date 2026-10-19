import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUser } from "@/lib/admin";
import { auditar } from "@/lib/auditoria";
export const dynamic = "force-dynamic";
const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), str = (s, n = 80) => String(s || "").trim().slice(0, n);
// MODERACIÓN DE COMUNICACIONES: Developer, Fundación y Junta Directiva (con sesión de Administración vigente). Para moderar por reportes (política +18 del servidor).
// Cada revisión pide una razón y queda en Auditoría (sin el contenido de los mensajes). Solo lectura: no borra ni cambia nada.
export async function POST(req) {
  const a = await adminUser(); if (!a || !["DEVELOPER", "FUNDACION", "JUNTA_DIRECTIVA"].includes(a.rank)) return err("Sin permiso", 403);
  const b = await req.json().catch(() => ({})), d = await db(), us = d.collection("users");
  if (b.a === "buscar") {
    const q = str(b.q, 40); if (q.length < 2) return NextResponse.json({ users: [] });
    const rx = new RegExp(esc(q), "i"), dg = q.replace(/\D/g, ""), per = await d.collection("tv_perfiles").find({ handle: rx }).limit(10).toArray(), idsT = per.map((x) => x._id);
    const r = await us.find({ $or: [{ id: q }, { name: rx }, { "cedula.roblox": rx }, { "cedula.nombres": rx }, { "cedula.apellidos": rx }, ...(dg.length > 3 ? [{ "chip.num": dg }, { "chip.num": "+58" + dg }] : []), ...(idsT.length ? [{ id: { $in: idsT } }] : [])] }).limit(15).toArray(), h = Object.fromEntries((await d.collection("tv_perfiles").find({ _id: { $in: r.map((x) => x.id) } }).toArray()).map((x) => [x._id, x.handle]));
    return NextResponse.json({ users: r.map((x) => ({ id: x.id, name: x.name, nombre: x.cedula ? `${x.cedula.nombres} ${x.cedula.apellidos}` : "", roblox: x.cedula?.roblox || "", chip: x.chip?.num || "", tiktok: h[x.id] || "" })) });
  }
  if (b.a === "ver") {
    const razon = str(b.razon, 300); if (razon.length < 10) return err("Escribe el motivo (reporte, sospecha, caso…), mínimo 10 caracteres");
    const t = await us.findOne({ id: String(b.uid || "") }); if (!t) return err("Usuario no existe", 404);
    const num = t.chip?.num || "", per = await d.collection("tv_perfiles").findOne({ _id: t.id });
    await auditar(d, { by: a.id, byName: a.name, rank: a.rank, act: "ojosVer", objetivo: t.name, razon, at: new Date() }, { origen: new URL(req.url).origin, t });
    // WhatsApp (incluye mensajes mandados desde cuentas anónimas por este usuario)
    const wm = await d.collection("wa_msgs").find({ $or: [...(num ? [{ de: num }, { para: num }] : []), { uid: t.id }] }).sort({ at: -1 }).limit(2000).toArray(), conv = new Map();
    const otro = (m) => (m.uid === t.id && m.anon ? m.para : m.de === num ? m.para : m.de);
    for (const m of wm.reverse()) { const o = otro(m), k = o || "?"; if (!conv.has(k)) conv.set(k, []); conv.get(k).push({ mio: m.de === num || (m.uid === t.id && !!m.anon), anon: !!m.anon, texto: m.texto, at: m.at }); }
    const dueños = await us.find({ "chip.num": { $in: [...conv.keys()] } }, { projection: { id: 1, name: 1, chip: 1, cedula: 1 } }).toArray(), nom = Object.fromEntries(dueños.map((x) => [x.chip.num, `${x.name}${x.cedula ? ` · ${x.cedula.nombres} ${x.cedula.apellidos}` : ""}`]));
    const wa = [...conv.entries()].map(([k, ms]) => ({ con: k, nombre: nom[k] || "", msgs: ms })).sort((x, y) => +new Date(y.msgs.at(-1).at) - +new Date(x.msgs.at(-1).at));
    // VE TikTok: chats privados
    const chats = await d.collection("tv_chats").find({ uids: t.id }).sort({ ult: -1 }).limit(60).toArray(), ot = chats.map((c) => c.uids.find((y) => y !== t.id)), pp = Object.fromEntries((await d.collection("tv_perfiles").find({ _id: { $in: ot } }).toArray()).map((x) => [x._id, x])), uu = Object.fromEntries((await us.find({ id: { $in: ot } }, { projection: { id: 1, name: 1 } }).toArray()).map((x) => [x.id, x.name]));
    const tk = []; for (const c of chats) { const o = c.uids.find((y) => y !== t.id), ms = (await d.collection("tv_msgs").find({ chat: c._id }).sort({ at: -1 }).limit(300).toArray()).reverse(); tk.push({ con: pp[o] ? "@" + pp[o].handle : "?", usuario: uu[o] || "", estado: c.estado, msgs: ms.map((m) => ({ mio: m.de === t.id, texto: m.txt || "", post: m.post ? String(m.post) : "", at: m.at })) }); }
    // VE TikTok: publicaciones y comentarios del usuario
    const posts = (await d.collection("tv_posts").find({ uid: t.id }).sort({ at: -1 }).limit(50).toArray()).map((p) => ({ id: String(p._id), tipo: p.tipo, url: p.url, desc: p.desc || "", at: p.at })), coms = (await d.collection("tv_com").find({ uid: t.id }).sort({ at: -1 }).limit(150).toArray()).map((c) => ({ txt: c.txt, post: c.post, at: c.at }));
    return NextResponse.json({ user: { id: t.id, name: t.name, nombre: t.cedula ? `${t.cedula.nombres} ${t.cedula.apellidos}` : "", roblox: t.cedula?.roblox || "", chip: num, tiktok: per?.handle || "", avatar: t.cedula?.avatar || null }, wa, tk, posts, coms });
  }
  return err("Acción desconocida");
}
