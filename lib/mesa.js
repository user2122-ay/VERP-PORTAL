import { pagoKey, pagarA, metodosDe } from "@/lib/pago";
import { casinoIngresar, casinoPagar, saldoCasino, impuestoGanancia, ecoCfg, snapshot } from "@/lib/reserva";
import { ingresarTesoreria } from "@/lib/tesoreria";
import { apuestaMax, casinoAbierto, ESPERA } from "@/lib/casino";
// Cobra la apuesta de la cuenta elegida. Con espera=true también aplica la pausa entre jugadas.
export async function cobrar(d, u, pago, monto, espera = true) {
  const pk = pagoKey(u, pago); if (!pk) return "Elige con qué pagar"; const us = d.collection("users"), ahora = Date.now();
  if (espera && !(await us.updateOne({ id: u.id, $or: [{ casinoAt: { $lt: ahora - ESPERA } }, { casinoAt: { $exists: false } }] }, { $set: { casinoAt: ahora } })).modifiedCount) return "Espera unos segundos entre jugadas";
  if (!(await us.updateOne({ id: u.id, [pk]: { $gte: monto } }, { $inc: { [pk]: -monto } })).modifiedCount) { if (espera) await us.updateOne({ id: u.id }, { $unset: { casinoAt: "" } }); return "Saldo insuficiente"; }
  return null;
}
// Reparte el resultado de una ronda. premio = lo TOTAL que vuelve al jugador (apuesta incluida). Ganancia: sale del fondo del casino y paga impuesto.
// Pérdida: la mitad (según Economía) a la Tesorería y el resto al fondo del casino.
export async function liquidar(d, u, { apuesta, premio, deposito, juego }) {
  let profit = premio - apuesta, imp = 0, sinFondos = false;
  if (profit > 0 && !(await casinoPagar(d, profit, u.id, "Premio " + juego))) { premio = apuesta; profit = 0; sinFondos = true; }
  let neto = premio; if (profit > 0) { imp = await impuestoGanancia(d, profit, "Impuesto a ganancias del casino"); neto = premio - imp; }
  if (neto > 0) await pagarA(d, u.id, deposito, neto);
  if (profit < 0) { const perdida = apuesta - premio, { casinoTes } = await ecoCfg(d), aTes = Math.round((perdida * casinoTes) / 100); if (aTes > 0) await ingresarTesoreria(d, aTes, "Apuestas perdidas en el casino", "Casino"); await casinoIngresar(d, perdida - aTes, u.id, "Apuesta perdida"); }
  await d.collection("tx").insertOne({ user: u.id, type: "casino", item: profit > 0 ? `Casino (${juego}): ganaste $${profit.toLocaleString("es")}${imp ? ` (impuesto $${imp.toLocaleString("es")})` : ""}` : profit === 0 ? `Casino (${juego}): empate` : `Casino (${juego}): perdiste $${(apuesta - premio).toLocaleString("es")}`, amount: neto - apuesta, at: new Date() });
  try { await snapshot(d); } catch {}
  return { premio, impuesto: imp, neto, profit, sinFondos };
}
export async function estadoCasino(d, uid) { const us = await d.collection("users").findOne({ id: uid }), f = await saldoCasino(d); return { metodos: metodosDe(us), abierto: casinoAbierto(f), max: apuestaMax(f), impPct: (await ecoCfg(d)).impGan }; }
