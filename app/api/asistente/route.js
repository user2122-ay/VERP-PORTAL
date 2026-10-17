import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { ecoCfg } from "@/lib/reserva";
import { nivelDe, HORAS } from "@/lib/cuerpo";
import { casaRef } from "@/lib/mdt";
import { nombreDe } from "@/lib/rol";
import { responder, SALUDO, SISTEMA } from "@/lib/asistente";
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
  return out;
}
async function ia(texto, historial, ctx) {
  const key = process.env.ANTHROPIC_API_KEY; if (!key) return null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ model: process.env.ASISTENTE_MODEL || "claude-haiku-5-5", max_tokens: 450, system: SISTEMA + "\n\nDatos de esta persona ahora mismo:\n" + ctx, messages: [...historial.slice(-8).map((m) => ({ role: m.r === "u" ? "user" : "assistant", content: m.t })), { role: "user", content: texto }] }) });
    if (!r.ok) return null; const j = await r.json(); return j.content?.map((x) => x.text).join("").trim().slice(0, 900) || null;
  } catch { return null; }
}
export async function GET() {
  const { u, d, visible, anon } = await acceso(); if (!visible) return NextResponse.json({ visible: false });
  if (anon) return NextResponse.json({ visible: true, anon: true, nombre: "", avisos: [], notas: [], historial: [] });
  const doc = (await d.collection("asistente").findOne({ _id: u.id })) || {};
  return NextResponse.json({ visible: true, anon: false, nombre: nombreDe(u), avisos: await avisos(d, u), notas: (doc.notas || []).map((n) => n.t), historial: (doc.msgs || []).slice(-20).map((m) => ({ r: m.r, t: m.t })) });
}
export async function POST(req) {
  const { u, d, visible, anon } = await acceso(); if (!visible) return bad("El asistente todavía está en beta", 403);
  const b = await req.json().catch(() => ({})), msg = String(b.msg || "").trim().slice(0, 300), ruta = String(b.ruta || "").slice(0, 60); if (!msg) return bad("Escribe algo");
  const col = d.collection("asistente"); let doc = anon ? {} : (await col.findOne({ _id: u.id })) || {}; const nuevos = [], notas = doc.notas || [];
  if (!anon && doc.ult && Date.now() - doc.ult < 1200) return bad("Un momento, voy leyendo", 429);
  let r = null, link = "";
  const rec = !anon && /^(recuerda|recuérdame|recuerdame|anota|apunta|guarda)\b( que)?\s+(.{3,})/i.exec(msg);
  if (anon) { const x = responder(msg); r = x?.r; link = x?.link || ""; if (!r) r = SALUDO.test(msg) ? "Hola. Te puedo ayudar a registrarte o a iniciar sesión en el portal de VE:RP. Pregúntame lo que necesites." : "Por ahora aquí solo te ayudo con el registro y el inicio de sesión. Cuéntame qué te pasa."; }
  else if (rec) { if (notas.length >= MAX_NOTAS) r = `Ya tengo ${MAX_NOTAS} cosas anotadas. Dime “olvida todo” o “olvida 1” para hacer espacio.`; else { notas.push({ t: rec[3].trim().slice(0, 200), at: new Date() }); r = `Listo, lo recuerdo: “${rec[3].trim().slice(0, 200)}”.`; } }
  else if (/(qu[eé] recuerdas|mis notas|mis recuerdos|qu[eé] te dije)/i.test(msg)) r = notas.length ? "Esto es lo que recuerdo:\n" + notas.map((n, i) => `${i + 1}. ${n.t}`).join("\n") : "Todavía no me has pedido recordar nada. Dime “recuerda que…” y lo anoto.";
  else if (/^(olvida|borra)\s+(todo|mis notas|todas)/i.test(msg)) { notas.length = 0; r = "Listo, olvidé todo lo que tenía anotado."; }
  else if (/^(olvida|borra)\s+(\d+)/i.test(msg)) { const i = Number(/(\d+)/.exec(msg)[1]) - 1; if (notas[i]) { const x = notas.splice(i, 1)[0]; r = `Olvidé: “${x.t}”.`; } else r = "No tengo una nota con ese número."; }
  else if (/(qu[eé] me pasa|c[oó]mo voy|mi estado|resumen|qu[eé] tengo pendiente|pendiente)/i.test(msg)) { const a = await avisos(d, u); r = a.length ? "Esto es lo que veo ahora:\n" + a.map((x) => "- " + x.t).join("\n") : "Todo tranquilo: no tienes nada urgente."; link = a[0]?.link || ""; }
  else {
    const ctx = `Nombre: ${nombreDe(u)}\nPantalla actual: ${ruta || "?"}\n` + ((await avisos(d, u)).map((x) => x.t).join("\n") || "Sin pendientes.") + (notas.length ? "\nNotas que pidió recordar: " + notas.map((n) => n.t).join(" | ") : ""), x = responder(msg);
    r = await ia(msg, doc.msgs || [], ctx); if (!r) { r = x?.r; link = x?.link || ""; } if (r && x?.link && !link) link = x.link;
    if (!r) r = SALUDO.test(msg) ? `Hola, ${nombreDe(u).split(" ")[0] || "bienvenido"}. Pregúntame cómo funciona algo del portal o dime “recuerda que…” y lo anoto.` : "No estoy seguro de eso. Prueba con otras palabras (por ejemplo: comida, casa, casino, trading, TikTok, banco) o pregúntale al staff en el Discord.";
  }
  if (!anon) { const msgs = [...(doc.msgs || []), { r: "u", t: msg, at: new Date() }, { r: "a", t: r, at: new Date() }].slice(-MAX_MSGS); await col.updateOne({ _id: u.id }, { $set: { msgs, notas, ult: Date.now() } }, { upsert: true }); }
  return NextResponse.json({ ok: true, r, link });
}
