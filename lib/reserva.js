// Reserva de respaldo ("banco central"): el dinero del Casino y del Trading NUNCA sale de la nada ni de la Tesorería.
// Lo que pierden los jugadores entra a la reserva y los premios / ventas se pagan DESDE la reserva (si no alcanza, no se paga).
// De las ganancias se cobra un impuesto que sí va a la Tesorería. Colecciones: config { _id: "reserva", saldo }, config { _id: "economia" }, eco_mov (movimientos), eco_hist (fotos de la masa monetaria).
import { ingresarTesoreria, egresarTesoreria } from "./tesoreria";
import { esFund } from "./tikverp";
export const RESERVA_INICIAL = 3000000, CASINO_INICIAL = 500000;
let listo = false;
async function ensure(d) {
  if (listo) return; const c = d.collection("config");
  if (!(await c.findOne({ _id: "reserva" }))) { try { await c.insertOne({ _id: "reserva", saldo: RESERVA_INICIAL }); await d.collection("eco_mov").insertOne({ tipo: "inicial", monto: RESERVA_INICIAL, concepto: "Fondo inicial de la reserva", at: new Date() }); } catch {} }
  if (!(await c.findOne({ _id: "casino" }))) { // el casino tiene su PROPIO fondo: se aparta de la reserva (no se crea dinero)
    try { const r = await c.findOne({ _id: "reserva" }), x = Math.min(CASINO_INICIAL, r?.saldo || 0); await c.insertOne({ _id: "casino", saldo: x }); if (x > 0) { await c.updateOne({ _id: "reserva" }, { $inc: { saldo: -x } }); await d.collection("eco_mov").insertOne({ tipo: "traspaso", monto: x, concepto: "Fondo inicial del casino (desde la reserva)", at: new Date() }); } } catch {}
  }
  listo = true;
}
export async function ecoCfg(d) {
  const c = (await d.collection("config").findOne({ _id: "economia" })) || {};
  return { inflacion: Number(c.inflacion ?? 25), impGan: Number(c.impGan ?? 10), tope: Number(c.tope || 0), casino: "abierto", casinoTes: Number(c.casinoTes ?? 50), trading: "abierto", tiktokChat: "abierto" };
}
// Ya no hay beta: casino, trading y chat de VE TikTok están abiertos para todos (las apps del teléfono piden tener teléfono).
export async function appVisible() { return true; }
export async function saldoReserva(d) { await ensure(d); return (await d.collection("config").findOne({ _id: "reserva" }))?.saldo || 0; }
const mov = (d, tipo, monto, uid, concepto) => d.collection("eco_mov").insertOne({ tipo, monto, uid: uid || null, concepto, at: new Date() });
export async function reservaIngresar(d, monto, tipo, uid, concepto) { if (!(monto > 0)) return; await ensure(d); await d.collection("config").updateOne({ _id: "reserva" }, { $inc: { saldo: monto } }); await mov(d, tipo, monto, uid, concepto); }
// Paga desde la reserva solo si alcanza.
export async function reservaPagar(d, monto, tipo, uid, concepto) {
  if (!(monto > 0)) return true; await ensure(d);
  const r = await d.collection("config").updateOne({ _id: "reserva", saldo: { $gte: monto } }, { $inc: { saldo: -monto } }); if (!r.modifiedCount) return false;
  await mov(d, tipo, -monto, uid, concepto); return true;
}
// Impuesto a las ganancias (solo si hay ganancia): va a la Tesorería. Devuelve lo cobrado.
export async function impuestoGanancia(d, ganancia, concepto) {
  if (!(ganancia > 0)) return 0; const { impGan } = await ecoCfg(d), t = Math.round((ganancia * impGan) / 100); if (t > 0) await ingresarTesoreria(d, t, concepto, "Impuesto a las ganancias"); return t;
}
// Fondo propio del casino (premios del tragamonedas). Entra la mitad de lo que se pierde (la otra mitad va a la Tesorería); si se queda sin fondo el casino se cierra hasta que Administración le asigne más.
export async function saldoCasino(d) { await ensure(d); return (await d.collection("config").findOne({ _id: "casino" }))?.saldo || 0; }
export async function casinoIngresar(d, monto, uid, concepto, tipo = "casino") { if (!(monto > 0)) return; await ensure(d); await d.collection("config").updateOne({ _id: "casino" }, { $inc: { saldo: monto } }); await mov(d, tipo, monto, uid, concepto); }
export async function casinoPagar(d, monto, uid, concepto, tipo = "casino") {
  if (!(monto > 0)) return true; await ensure(d); const r = await d.collection("config").updateOne({ _id: "casino", saldo: { $gte: monto } }, { $inc: { saldo: -monto } }); if (!r.modifiedCount) return false; await mov(d, tipo, -monto, uid, concepto); return true;
}
// Traspasos entre Tesorería (tes), Reserva (res) y fondo del casino (cas): el dinero sale de uno y entra al otro.
export const DIRS = ["tes2res", "res2tes", "tes2cas", "res2cas", "cas2tes", "cas2res"];
export async function traspaso(d, dir, monto, uid) {
  if (!DIRS.includes(dir)) return "Traspaso inválido"; const [a, b] = dir.split("2"), N = { tes: "la Tesorería", res: "la reserva", cas: "el casino" };
  const sale = a === "tes" ? await egresarTesoreria(d, monto, `Traspaso hacia ${N[b]}`, "Administración") : a === "res" ? await reservaPagar(d, monto, "traspaso", uid, `Hacia ${N[b]}`) : await casinoPagar(d, monto, uid, `Hacia ${N[b]}`, "traspaso");
  if (!sale) return `${N[a][0].toUpperCase() + N[a].slice(1)} no tiene tanto`;
  if (b === "tes") await ingresarTesoreria(d, monto, `Traspaso desde ${N[a]}`, "Administración"); else if (b === "res") await reservaIngresar(d, monto, "traspaso", uid, `Desde ${N[a]}`); else await casinoIngresar(d, monto, uid, `Desde ${N[a]}`, "traspaso");
  return null;
}
// Masa monetaria = efectivo + tarjetas + Tesorería + reserva.
export async function masa(d) {
  await ensure(d); const r = await d.collection("users").aggregate([{ $project: { ef: { $ifNull: ["$balance", 0] }, ct: { $sum: { $map: { input: { $objectToArray: { $ifNull: ["$cuentas", {}] } }, as: "c", in: { $ifNull: ["$$c.v.saldo", 0] } } } } } }, { $group: { _id: null, ef: { $sum: "$ef" }, ct: { $sum: "$ct" } } }]).toArray();
  const ef = r[0]?.ef || 0, ct = r[0]?.ct || 0, tes = (await d.collection("config").findOne({ _id: "tesoreria" }))?.saldo || 0, res = await saldoReserva(d), cas = await saldoCasino(d);
  return { ef, ct, tes, res, cas, total: ef + ct + tes + res + cas };
}
// ¿Se pasaría del tope de dinero en circulación si entran `extra` dólares nuevos? (tope 0 = sin tope)
export async function pasaTope(d, extra) { const { tope } = await ecoCfg(d); if (!(tope > 0)) return false; return (await masa(d)).total + extra > tope; }
export async function snapshot(d, forzar = false) {
  const h = d.collection("eco_hist"), ult = await h.find().sort({ at: -1 }).limit(1).toArray(); if (!forzar && ult[0] && Date.now() - +new Date(ult[0].at) < 36e5) return;
  const m = await masa(d); await h.insertOne({ at: new Date(), ...m, inflacion: (await ecoCfg(d)).inflacion });
}
export async function serie(d) { return (await d.collection("eco_hist").find().sort({ at: -1 }).limit(168).toArray()).reverse().map((x) => ({ at: new Date(x.at).toISOString(), total: x.total, ef: x.ef, ct: x.ct, tes: x.tes, res: x.res, cas: x.cas || 0, inf: x.inflacion })); }
// Movimientos de la reserva por día (últimos 14): lo que entra (jugadores pierden / compran) y lo que sale (premios / ventas).
export async function movDias(d) {
  const desde = new Date(Date.now() - 14 * 864e5), l = await d.collection("eco_mov").find({ at: { $gte: desde }, tipo: { $in: ["casino", "trading"] } }).toArray(), o = {};
  for (const x of l) { const k = new Date(x.at).toISOString().slice(0, 10); (o[k] ||= { dia: k, casinoIn: 0, casinoOut: 0, tradingIn: 0, tradingOut: 0 })[x.tipo + (x.monto > 0 ? "In" : "Out")] += Math.abs(x.monto); }
  return Object.values(o).sort((a, b) => a.dia.localeCompare(b.dia));
}
