import { erlcComando, erlcJugadores, erlcListo } from "./erlc";
// Cuando la MDT arresta a alguien, se le manda ":jail <usuario de Roblox>" en ER:LC y se anota la condena (minutos).
export async function encarcelar(d, s, minutos, motivo = "") {
  const roblox = s?.cedula?.roblox; if (!roblox || !(minutos > 0)) return null;
  const r = await erlcComando(`:jail ${roblox}`);
  await d.collection("erlc_jail").insertOne({ uid: s.id, roblox, minutos, motivo: String(motivo).slice(0, 120), hasta: new Date(Date.now() + minutos * 6e4), activo: true, jails: r.ok ? 1 : 0, error: r.ok ? null : r.error, at: new Date(), ultimo: new Date() });
  return r;
}
// Revisa las condenas activas: si el sujeto sigue conectado pero ya no está en la cárcel y le falta tiempo, se le manda :jail otra vez.
export async function vigilarCondenas(d) {
  if (!erlcListo()) return;
  const c = d.collection("config"), t = await c.findOne({ _id: "jailRun" }); if (t && Date.now() - t.at < 45000) return;
  await c.updateOne({ _id: "jailRun" }, { $set: { at: Date.now() } }, { upsert: true });
  const col = d.collection("erlc_jail"); await col.updateMany({ activo: true, hasta: { $lte: new Date() } }, { $set: { activo: false, fin: new Date() } });
  const act = await col.find({ activo: true }).limit(8).toArray(); if (!act.length) return;
  const jug = await erlcJugadores(); if (!jug) return; let n = 0;
  for (const j of act) {
    const p = jug.find((x) => String(x.Player || "").split(":")[0].toLowerCase() === j.roblox.toLowerCase()); if (!p || String(p.Team || "").toLowerCase() === "jail") continue;
    const r = await erlcComando(`:jail ${j.roblox}`); await col.updateOne({ _id: j._id }, { $set: { ultimo: new Date(), error: r.ok ? null : r.error }, $inc: { jails: r.ok ? 1 : 0 } });
    if (++n >= 2) break; await new Promise((res) => setTimeout(res, 5200)); // la API permite ~1 comando cada 5 s
  }
}
