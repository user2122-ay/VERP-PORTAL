import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { tieneTelefono } from "@/lib/redes";
import { pagoKey, pagarA, metodosDe } from "@/lib/pago";
import { appVisible, casinoIngresar, casinoPagar, saldoCasino, impuestoGanancia, ecoCfg, snapshot } from "@/lib/reserva";
import { ingresarTesoreria } from "@/lib/tesoreria";
import { tirar, perdida, MIN, ESPERA, apuestaMax, casinoAbierto } from "@/lib/casino";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// Una jugada. La apuesta se paga con la cuenta elegida. Si PIERDES: la mitad va a la Tesorería y la otra mitad al FONDO del casino. Si GANAS: el premio sale del fondo (y se devuelve tu apuesta); de la ganancia se cobra el impuesto (a la Tesorería).
// Si el fondo no alcanza para pagar el premio máximo de tu apuesta, el casino se cierra "por el momento" hasta que Administración le asigne más fondos.
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401); const d = await db();
  if (!tieneTelefono(u) || !(await appVisible(d, u, "casino"))) return bad("El casino no está disponible", 403);
  const fondo = await saldoCasino(d); if (!casinoAbierto(fondo)) return bad("🔒 El casino está cerrado por el momento: se quedó sin fondos. Vuelve cuando Administración le asigne más.", 409);
  const b = await req.json().catch(() => ({})), monto = Math.floor(Number(b.monto)), mx = apuestaMax(fondo); if (!(monto >= MIN && monto <= mx)) return bad(`La apuesta va de $${MIN} a $${mx.toLocaleString("es")} (lo que el fondo del casino puede pagar)`);
  const pk = pagoKey(u, b.pago); if (!pk) return bad("Elige con qué pagar"); const us = d.collection("users"), ahora = Date.now();
  if (!(await us.updateOne({ id: u.id, $or: [{ casinoAt: { $lt: ahora - ESPERA } }, { casinoAt: { $exists: false } }] }, { $set: { casinoAt: ahora } })).modifiedCount) return bad("Espera unos segundos entre jugadas");
  if (!(await us.updateOne({ id: u.id, [pk]: { $gte: monto } }, { $inc: { [pk]: -monto } })).modifiedCount) { await us.updateOne({ id: u.id }, { $unset: { casinoAt: "" } }); return bad("Saldo insuficiente"); }
  let res = tirar(), premio = monto * res.mult, sinFondos = false;
  if (premio > 0 && !(await casinoPagar(d, premio - monto, u.id, "Premio"))) { res = perdida(); premio = 0; sinFondos = true; } // el fondo no alcanzó: se pierde
  let imp = 0, neto = 0;
  if (premio > 0) { imp = await impuestoGanancia(d, premio - monto, "Impuesto a ganancias del casino"); neto = premio - imp; await pagarA(d, u.id, b.deposito, neto); } // la apuesta vuelve al jugador junto con el premio
  else { const { casinoTes } = await ecoCfg(d), aTes = Math.round((monto * casinoTes) / 100); if (aTes > 0) await ingresarTesoreria(d, aTes, "Apuestas perdidas en el casino", "Casino"); await casinoIngresar(d, monto - aTes, u.id, "Apuesta perdida"); }
  await d.collection("tx").insertOne({ user: u.id, type: "casino", item: premio > 0 ? `Casino: ganaste $${premio.toLocaleString("es")}${imp ? ` (impuesto $${imp.toLocaleString("es")})` : ""}` : "Casino: perdiste la apuesta", amount: neto - monto, at: new Date() });
  try { await snapshot(d); } catch {}
  const f = await us.findOne({ id: u.id }), fn = await saldoCasino(d); return NextResponse.json({ ok: true, reels: res.reels, premio, impuesto: imp, neto, mult: res.mult, sinFondos, metodos: metodosDe(f), impPct: (await ecoCfg(d)).impGan, abierto: casinoAbierto(fn), max: apuestaMax(fn) });
}
