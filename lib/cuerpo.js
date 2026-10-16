// Sistema del cuerpo: comida y agua bajan de forma lineal (20% cada 30 minutos = 0% en 2,5 horas) y SOLO mientras el jugador está dentro del servidor de ER:LC (se detecta con la API).
// Si cualquiera llega a 0% el personaje muere (CK) y se bloquea toda la página hasta apelar o crear otro usuario.
export const HORAS = { comida: 2.5, agua: 2.5 }; // 100% / 2,5 h = 40% por hora = 20% cada 30 min
import { erlcJugadores, erlcListo } from "./erlc";
// Nunca pasa de 100%: aunque comas de más (o el dato guardado esté mal) la barra se queda en 100.
export const nivelDe = (e, h, ref = Date.now()) => (e ? Math.min(100, Math.max(0, Math.min(100, e.n) - ((ref - +new Date(e.t)) / 36e5) * (100 / h))) : 100);
// El hambre y la sed solo bajan mientras el jugador está DENTRO del servidor de ER:LC (se detecta con la API de ER:LC, por el usuario de Roblox de su cédula).
// Cada ~45 s se consulta la lista de jugadores; a quien no está dentro se le corre la hora de "última vez que comió/bebió" lo que pasó, así ese tiempo no cuenta.
// Si ER:LC no está configurado o no responde, no se pausa a nadie (todo sigue como antes).
export async function tickPresencia(d) {
  if (!erlcListo()) return false;
  const c = d.collection("config"), ahora = Date.now(), ap = await c.findOne({ _id: "apertura" }); if (ap?.servidor === "cerrado") return false;
  let prev = await c.findOneAndUpdate({ _id: "presencia", $or: [{ lock: { $lt: ahora - 45000 } }, { lock: { $exists: false } }] }, { $set: { lock: ahora } }, { returnDocument: "before" });
  if (!prev) { if (await c.findOne({ _id: "presencia" })) return false; try { await c.insertOne({ _id: "presencia", lock: ahora, fuera: [] }); } catch { return false; } prev = { fuera: [] }; }
  const jug = await erlcJugadores(); if (!jug) return false; // sin respuesta: no se toca nada y la próxima vez se compensa el tiempo completo
  const dentro = new Set(jug.map((x) => String(x.Player || "").split(":")[0].toLowerCase())), us = d.collection("users");
  const desdeAp = +new Date(ap?.abiertoAt || ap?.at || 0), ms = prev.ult && prev.ult > desdeAp ? ahora - prev.ult : 0; // si el servidor se abrió después de la última medición, ese tiempo no cuenta
  if (ms > 0 && prev.fuera?.length) for (const k of ["comida", "agua"]) await us.updateMany({ id: { $in: prev.fuera }, [`cuerpo.${k}.t`]: { $type: "date" }, muerte: { $exists: false } }, [{ $set: { [`cuerpo.${k}.t`]: { $dateAdd: { startDate: `$cuerpo.${k}.t`, unit: "millisecond", amount: Math.round(ms) } } } }]);
  const todos = await us.find({ "cedula.roblox": { $exists: true }, muerte: { $exists: false }, dev: { $ne: true } }, { projection: { id: 1, "cedula.roblox": 1 } }).toArray();
  await c.updateOne({ _id: "presencia" }, { $set: { ult: ahora, fuera: todos.filter((x) => !dentro.has(String(x.cedula.roblox).toLowerCase())).map((x) => x.id) } });
  return true;
}
// ¿Está este usuario fuera del servidor de ER:LC? (para mostrar la pausa). Devuelve la hora de la última medición o null.
export async function fueraDeErlc(d, uid) {
  if (!erlcListo()) return null; const p = await d.collection("config").findOne({ _id: "presencia" }); return p?.ult && p.fuera?.includes(uid) ? new Date(p.ult) : null;
}
// El hambre y la sed SOLO corren con el servidor abierto (lo marca el panel de Apertura). Cerrado = las barras se quedan quietas y no se puede comer.
export async function servidorEstado(d) {
  const r = await d.collection("config").findOne({ _id: "apertura" }), cerrado = r?.servidor === "cerrado";
  return { abierto: !cerrado, desde: cerrado && r.cerradoDesde ? new Date(r.cerradoDesde) : null };
}
// Al abrir el servidor se corre la hora de "la última vez que comiste/bebiste" lo que estuvo cerrado, para que ese tiempo no cuente.
export async function descongelarCuerpo(d, ms) {
  if (!(ms > 0)) return; const col = d.collection("users");
  for (const k of ["comida", "agua"]) await col.updateMany({ [`cuerpo.${k}.t`]: { $type: "date" }, muerte: { $exists: false } }, [{ $set: { [`cuerpo.${k}.t`]: { $dateAdd: { startDate: `$cuerpo.${k}.t`, unit: "millisecond", amount: Math.round(ms) } } } }]);
}
const agotado = (e, h) => +new Date(e.t) + (e.n / (100 / h)) * 36e5;
export async function aplicarCuerpo(d, u) {
  if (!u?.cedula || u.dev || u.muerte) return u; // el Developer no se muere
  const ahora = new Date(), col = d.collection("users");
  if (!u.cuerpo) { const cuerpo = { comida: { n: 100, t: ahora }, agua: { n: 100, t: ahora } }; await col.updateOne({ id: u.id, cuerpo: { $exists: false } }, { $set: { cuerpo } }); return { ...u, cuerpo }; }
  if (!(await servidorEstado(d)).abierto) return u; // servidor cerrado: no baja nada y nadie muere
  if (erlcListo()) { let medido = false; try { medido = await tickPresencia(d); } catch {} const f = await col.findOne({ id: u.id }, { projection: { cuerpo: 1 } }); if (f?.cuerpo) u = { ...u, cuerpo: f.cuerpo }; if (!medido) return u; /* no se pudo medir ahora (la API no respondió o hay otra medición en curso): no se mata a nadie con datos sin compensar */ } // la hora de "última comida" ya viene corrida por el tiempo fuera de ER:LC
  const E = (x) => x || { n: 100, t: ahora }, tc = agotado(E(u.cuerpo.comida), HORAS.comida), ta = agotado(E(u.cuerpo.agua), HORAS.agua);
  if (Math.min(tc, ta) > +ahora) return u;
  const muerte = { causa: ta <= tc ? "sed" : "hambre", at: new Date(Math.min(tc, ta)) };
  await col.updateOne({ id: u.id, muerte: { $exists: false } }, { $set: { muerte } });
  return { ...u, muerte };
}
