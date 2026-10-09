import { erlcComando, erlcJugadores, erlcListo } from "./erlc";
// Mensajes automáticos en ER:LC (se configuran en Administración → ER:LC). Solo se mandan con el servidor ABIERTO (panel de Apertura) y con jugadores dentro.
//  - Bienvenida: al abrir el servidor se manda cada 5 minutos durante 20 minutos.
//  - Reglas: pasados los 20 minutos de la apertura se manda una regla (:h) cada cierto tiempo, rotando la lista.
export const REGLAS = [
  "🎭 Recuerda priorizar un rol serio y realista en todo momento.", "🚓 Valora la vida de tu personaje (FearRP) en cada situación.", "🚫 Evita el FailRP. Actúa como lo harías en la vida real.",
  "⚖️ No inicies persecuciones o tiroteos sin un motivo válido de rol.", "🚗 Conduce de forma realista. Evita maniobras imposibles o irreales.", "🤝 Respeta el desarrollo del rol de los demás jugadores.",
  "🚨 No interrumpas escenas de rol ajenas sin una razón válida.", "🗣️ Mantén el rol en todo momento y evita romper la inmersión.", "🚔 Si eres parte de una escena, síguela hasta su conclusión.",
  "🚑 Respeta el rol de los servicios de emergencia y coopera cuando sea necesario.", "📻 Utiliza las comunicaciones de manera realista durante el rol.", "🚘 Evita el Vehicle Deathmatch (VDM). Usa los vehículos de forma responsable.",
  "🔫 Evita el Random Deathmatch (RDM). Toda acción debe tener un contexto de rol.", "🎬 Un buen rol se basa en la creatividad, el respeto y el realismo.", "🌟 Recuerda: la calidad del rol depende de todos. ¡Disfruta la experiencia!"];
export const DEF = { bienv: { on: true, texto: "🌴 ¡Bienvenido a VE:RP! Respeta las reglas, rolea con realismo y disfruta la experiencia.", cadaMin: 5, durMin: 20 }, reglas: { on: true, cadaMin: 10, lista: REGLAS } };
export async function configAuto(d) { const c = (await d.collection("config").findOne({ _id: "erlcAuto" })) || {}; return { bienv: { ...DEF.bienv, ...(c.bienv || {}) }, reglas: { ...DEF.reglas, ...(c.reglas || {}), lista: c.reglas?.lista?.length ? c.reglas.lista : REGLAS }, ult: c.ult || {}, idx: c.idx || 0 }; }
const limpia = (t) => String(t || "").replace(/[\r\n]+/g, " ").trim().slice(0, 200);
// Revisa si toca mandar un mensaje. Se llama sola (cada minuto) desde el contador de miembros de la cabecera, la MDT y el cron /api/erlc/vigilar.
export async function tickAutomatico(d) {
  if (!erlcListo()) return null;
  const ap = await d.collection("config").findOne({ _id: "apertura" }); if (ap?.servidor !== "abierto") return null;
  const lock = await d.collection("config").findOneAndUpdate({ _id: "erlcAutoRun", $or: [{ at: { $lt: Date.now() - 50000 } }, { at: { $exists: false } }] }, { $set: { at: Date.now() } }, { upsert: false });
  if (!lock) { try { await d.collection("config").insertOne({ _id: "erlcAutoRun", at: Date.now() }); } catch { return null; } }
  const c = await configAuto(d), ahora = Date.now(), desde = +new Date(ap.abiertoAt || ap.at || ahora), min = (ahora - desde) / 6e4, nueva = c.ult.apDesde !== desde; // "nueva" = es una apertura distinta a la última vez
  const ub = nueva ? 0 : c.ult.bienv || 0, ur = nueva ? 0 : c.ult.regla || 0; let cmd = null, marca = null;
  if (c.bienv.on && min <= c.bienv.durMin + 0.5 && ahora - ub >= c.bienv.cadaMin * 6e4 - 5000) { cmd = ":h " + limpia(c.bienv.texto); marca = "bienv"; }
  else if (c.reglas.on && min > c.bienv.durMin && ahora - ur >= c.reglas.cadaMin * 6e4 - 5000) { const l = c.reglas.lista.map(limpia).filter(Boolean); if (l.length) { cmd = ":h " + l[c.idx % l.length]; marca = "regla"; } }
  if (!cmd) return null;
  const jug = await erlcJugadores(); if (!jug || !jug.length) return null; // solo si hay alguien dentro
  const r = await erlcComando(cmd), set = { [`ult.${marca}`]: ahora, "ult.apDesde": desde, "ult.error": r.ok ? null : r.error, ...(nueva ? { [`ult.${marca === "bienv" ? "regla" : "bienv"}`]: 0 } : {}) };
  await d.collection("config").updateOne({ _id: "erlcAuto" }, { $set: set, ...(marca === "regla" && r.ok ? { $inc: { idx: 1 } } : {}) }, { upsert: true });
  return { cmd, ok: r.ok };
}
