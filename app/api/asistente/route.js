import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { ecoCfg } from "@/lib/reserva";
import { nivelDe, HORAS } from "@/lib/cuerpo";
import { casaRef } from "@/lib/mdt";
import { nombreDe } from "@/lib/rol";
import { respEquipo, comando, semilla, fila } from "@/lib/equipo";
import { responder, charla, SALUDO, temasStaff, resumenRango } from "@/lib/asistente";
import { canReview, canAdmin, RANK_LABEL } from "@/lib/roles";
import { buscar as buscarNorma, resumen as resumenNorma } from "@/lib/normativa";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s }), MAX_MSGS = 40, MAX_NOTAS = 20;
// Beta: solo el Developer (y todos cuando Administración → Economía lo abre). Sin sesión solo ayuda con registro e inicio de sesión cuando está abierto.
async function acceso() { const u = await apiUser().catch(() => null), d = await db(), abierto = (await ecoCfg(d)).asistente === "abierto"; return { u: u?.cedula || u?.dev ? u : u, d, visible: abierto || !!u?.dev, anon: !u }; }
// Lo que el asistente "sabe" de ti ahora mismo: se calcula en cada consulta, así nunca se desactualiza.
async function avisos(d, u) {
  const out = [], ahora = Date.now(), pct = (e, h) => Math.round(nivelDe(e, h)), c = pct(u.cuerpo?.comida, HORAS.comida), a = pct(u.cuerpo?.agua, HORAS.agua);
  if (u.cuerpo && !u.muerte) { if (a <= 30) out.push({ k: "sed", t: `Tienes sed: tu agua está en ${a}%.`, link: "/inventario?v=comida" }); if (c <= 30) out.push({ k: "hambre", t: `Tienes hambre: tu comida está en ${c}%.`, link: "/inventario?v=comida" }); }
  const n = await d.collection("notifs").find({ uid: u.id, read: false }).sort({ at: -1 }).limit(5).toArray();
  if (n.length) out.push({ k: "avisos", id: String(n[0]._id), t: `Tienes ${n.length >= 5 ? "varios" : n.length} aviso(s) sin leer. Último: ${n[0].title}.`, link: "/notificaciones" });
  const mu = await d.collection("multas").countDocuments({ sujeto: u.id, estado: { $ne: "pagada" } }).catch(() => 0); if (mu) out.push({ k: "multas", t: `Tienes ${mu} multa(s) pendiente(s) por pagar.`, link: "/inventario?v=multas" });
  const inv = await d.collection("hogares").countDocuments({ "inv.id": u.id }).catch(() => 0); if (inv) out.push({ k: "hogar", t: "Te invitaron a vivir en una casa compartida.", link: "/hogar" });
  for (const x of (u.inventory || []).filter((i) => i.category === "Propiedades" && i.impProx)) { const f = +new Date(x.impProx) - ahora; if (f > 0 && f < 864e5) out.push({ k: "impuesto" + casaRef(x.name, x.at), t: `El impuesto de ${x.ubicacion || x.name} se cobra en menos de 24 horas.`, link: "/inventario?v=casa" }); }
  if (canReview(u.rank)) { const q = async (c, f) => d.collection(c).countDocuments(f).catch(() => 0), tr = await q("trabajos", { estado: "pendiente" }), ap = await q("apelaciones", { estado: "pendiente" }), ro = await q("robos", { estado: "pendiente" }), re = canAdmin(u.rank) ? await q("reports", { estado: { $ne: "resuelto" } }) : 0;
    if (tr) out.push({ k: "s-tr", staff: 1, t: `Staff: ${tr} solicitud(es) de trabajo por revisar.`, link: "/admin" }); if (ap) out.push({ k: "s-ap", staff: 1, t: `Staff: ${ap} apelación(es) de CK pendiente(s).`, link: "/admin" }); if (ro) out.push({ k: "s-ro", staff: 1, t: `Staff: ${ro} solicitud(es) de robo de auto por revisar.`, link: "/admin" }); if (re) out.push({ k: "s-re", staff: 1, t: `Staff: ${re} reporte(s) 911 sin resolver.`, link: "/admin" }); }
  return out;
}
// Preguntas sobre la normativa: dice en qué artículo está y resume. Li'l Monkey no inventa: solo cita lo que está en lib/normativaData.js.
const NORMA = /(art[ií]culo|normativa|\bnormas?\b|\breglas?\b|sanci[oó]n|sanciones|prohib|permitid|falta (leve|media|grave)|qu[eé] dice|est[aá] permitido|se puede)/i;
function respNorma(msg) {
  const r = buscarNorma(msg, 3).filter((x, i, a) => x.score >= a[0].score * 0.55); if (!r.length) return null; const p = r[0];
  let t = `Eso está en la ${p.ref}: «${p.a.titulo}»${p.sub ? ` (apartado ${p.sub})` : ""}.`; const rs = resumenNorma(p.a, 240); if (rs) t += `\n${rs}`;
  if (r[1]) t += `\n\nTambién se toca en: ${r.slice(1).map((x) => `${x.ref} (${x.a.titulo})`).join("; ")}.`;
  return { r: t, link: "/normativa?a=" + p.a.id };
}
export async function GET() {
  const { u, d, visible, anon } = await acceso(); if (!visible) return NextResponse.json({ visible: false });
  if (anon) return NextResponse.json({ visible: true, anon: true, nombre: "", avisos: [], notas: [], historial: [] });
  const doc = (await d.collection("asistente").findOne({ _id: u.id })) || {};
  return NextResponse.json({ visible: true, anon: false, nombre: nombreDe(u), rango: u.rank ? RANK_LABEL[u.rank] || u.rank : "", avisos: await avisos(d, u), notas: (doc.notas || []).map((n) => n.t), historial: (doc.msgs || []).slice(-20).map((m) => ({ r: m.r, t: m.t })) });
}
export async function POST(req) {
  const { u, d, visible, anon } = await acceso(); if (!visible) return bad("El asistente todavía está en beta", 403);
  const b = await req.json().catch(() => ({})), msg = String(b.msg || "").trim().slice(0, String(b.msg || "").trim().startsWith("/") ? 500 : 300), ruta = String(b.ruta || "").slice(0, 60); if (!msg) return bad("Escribe algo");
  const col = d.collection("asistente"); let doc = anon ? {} : (await col.findOne({ _id: u.id })) || {}; const nuevos = [], notas = doc.notas || [];
  if (!anon && doc.ult && Date.now() - doc.ult < 1200) return bad("Un momento, voy leyendo", 429);
  let r = null, link = "";
  const eq = d.collection("equipo"); let lista = []; if (!anon) { lista = await eq.find({}).toArray(); if (!lista.length) { lista = semilla(); try { await eq.insertMany(lista, { ordered: false }); } catch {} } } // se siembra una sola vez con el equipo inicial
  const cmd = !anon && comando(msg), puedeEq = !!u && (u.dev || ["DEVELOPER", "FUNDACION"].includes(u.rank));
  const rec = !anon && /^(recuerda|recuérdame|recuerdame|anota|apunta|guarda)\b( que)?\s+(.{3,})/i.exec(msg);
  if (anon) { const x = responder(msg); r = x?.r; link = x?.link || ""; if (!r) r = charla(msg) || SALUDO.test(msg) ? "Hola. Te puedo ayudar a registrarte o a iniciar sesión en el portal de VE:RP. Pregúntame lo que necesites." : "Por ahora aquí solo te ayudo con el registro y el inicio de sesión. Cuéntame qué te pasa."; }
  else if (cmd) {
    if (cmd.error) r = cmd.error; else if (cmd.acc === "lista") r = "Equipo de VE:RP:\n" + lista.map((p) => "- " + fila(p)).join("\n");
    else if (!puedeEq) r = "Solo el Developer y la Fundación pueden cambiar el equipo.";
    else if (cmd.acc === "quitar") { const x = await eq.deleteOne({ _id: cmd.id }); r = x.deletedCount ? `Listo, quité a ${cmd.id} del equipo.` : "No encontré a esa persona. Usa su usuario de Roblox."; }
    else { const { _id, ...resto } = cmd.p, ya = lista.some((p) => p._id === _id); await eq.updateOne({ _id }, { $set: resto }, { upsert: true }); r = `${ya ? "Actualicé" : "Añadí"} a ${cmd.p.nombre}: ${cmd.p.cargos.join(", ")}.`; }
  }
  else if (rec) { if (notas.length >= MAX_NOTAS) r = `Ya tengo ${MAX_NOTAS} cosas anotadas. Dime “olvida todo” o “olvida 1” para hacer espacio.`; else { notas.push({ t: rec[3].trim().slice(0, 200), at: new Date() }); r = `Listo, lo recuerdo: “${rec[3].trim().slice(0, 200)}”.`; } }
  else if (/(qu[eé] recuerdas|mis notas|mis recuerdos|qu[eé] te dije)/i.test(msg)) r = notas.length ? "Esto es lo que recuerdo:\n" + notas.map((n, i) => `${i + 1}. ${n.t}`).join("\n") : "Todavía no me has pedido recordar nada. Dime “recuerda que…” y lo anoto.";
  else if (/^(olvida|borra)\s+(todo|mis notas|todas)/i.test(msg)) { notas.length = 0; r = "Listo, olvidé todo lo que tenía anotado."; }
  else if (/^(olvida|borra)\s+(\d+)/i.test(msg)) { const i = Number(/(\d+)/.exec(msg)[1]) - 1; if (notas[i]) { const x = notas.splice(i, 1)[0]; r = `Olvidé: “${x.t}”.`; } else r = "No tengo una nota con ese número."; }
  else if (u.rank && /(pendientes? del staff|cola del staff|qu[eé] hay por revisar|trabajo pendiente del staff)/i.test(msg)) { const a = (await avisos(d, u)).filter((x) => x.staff); r = a.length ? "Pendientes del staff:\n" + a.map((x) => "- " + x.t.replace("Staff: ", "")).join("\n") : "No hay nada pendiente por revisar."; link = "/admin"; }
  else if (u.rank && /(qu[eé] puedo hacer|mis permisos|mi rango)/i.test(msg)) { r = resumenRango(u.rank, !!u.auxApertura) || "Todavía no tienes un rango de staff."; link = "/admin"; }
  else if (/(qu[eé] me pasa|c[oó]mo voy|mi estado|resumen|qu[eé] tengo pendiente|pendiente)/i.test(msg)) { const a = await avisos(d, u); r = a.length ? "Esto es lo que veo ahora:\n" + a.map((x) => "- " + x.t).join("\n") : "Todo tranquilo: no tienes nada urgente."; link = a[0]?.link || ""; }
  else if (respEquipo(msg, lista)) r = respEquipo(msg, lista).r;
  else {
    const x = responder(msg, u.rank || u.auxApertura ? temasStaff(u.rank, !!u.auxApertura) : []), nm = NORMA.test(msg) || !x ? respNorma(msg) : null; r = nm ? nm.r : x?.r; link = nm ? nm.link : x?.link || "";
    if (!r) r = charla(msg) || (SALUDO.test(msg) ? `Hola, ${nombreDe(u).split(" ")[0] || "bienvenido"}. Pregúntame cómo funciona algo del portal o dime “recuerda que…” y lo anoto.` : "No estoy seguro de eso. Prueba con otras palabras (por ejemplo: comida, casa, casino, trading, TikTok, banco, multas) o pregúntale al staff en el Discord.");
  }
  if (!anon) { const msgs = [...(doc.msgs || []), { r: "u", t: msg, at: new Date() }, { r: "a", t: r, at: new Date() }].slice(-MAX_MSGS); await col.updateOne({ _id: u.id }, { $set: { msgs, notas, ult: Date.now() } }, { upsert: true }); }
  return NextResponse.json({ ok: true, r, link });
}
