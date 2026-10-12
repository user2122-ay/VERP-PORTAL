import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { tieneTelefono } from "@/lib/redes";
import { pagoKey, pagarA, metodosDe } from "@/lib/pago";
import { appVisible, reservaIngresar, reservaPagar, impuestoGanancia, ecoCfg, snapshot } from "@/lib/reserva";
import { tirar, perdida, MIN, MAX, ESPERA } from "@/lib/casino";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// Una jugada de tragamonedas. La apuesta se paga con la cuenta elegida y entra a la RESERVA; el premio sale de la reserva (si no alcanza no se paga) y de la ganancia se cobra el impuesto (a la Tesorería).
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401); const d = await db();
  if (!tieneTelefono(u) || !(await appVisible(d, u, "casino"))) return bad("El casino no está disponible", 403);
  const b = await req.json().catch(() => ({})), monto = Math.floor(Number(b.monto)); if (!(monto >= MIN && monto <= MAX)) return bad(`La apuesta va de $${MIN} a $${MAX.toLocaleString("es")}`);
  const pk = pagoKey(u, b.pago); if (!pk) return bad("Elige con qué pagar"); const us = d.collection("users"), ahora = Date.now();
  if (!(await us.updateOne({ id: u.id, $or: [{ casinoAt: { $lt: ahora - ESPERA } }, { casinoAt: { $exists: false } }] }, { $set: { casinoAt: ahora } })).modifiedCount) return bad("Espera unos segundos entre jugadas");
  if (!(await us.updateOne({ id: u.id, [pk]: { $gte: monto } }, { $inc: { [pk]: -monto } })).modifiedCount) { await us.updateOne({ id: u.id }, { $unset: { casinoAt: "" } }); return bad("Saldo insuficiente"); }
  await reservaIngresar(d, monto, "casino", u.id, "Apuesta");
  let res = tirar(), premio = monto * res.mult, sinFondos = false;
  if (premio > 0 && !(await reservaPagar(d, premio, "casino", u.id, "Premio"))) { res = perdida(); premio = 0; sinFondos = true; } // la reserva no alcanza: no se puede pagar
  let imp = 0, neto = 0;
  if (premio > 0) { imp = await impuestoGanancia(d, premio - monto, "Impuesto a ganancias del casino"); neto = premio - imp; await pagarA(d, u.id, b.deposito, neto); }
  await d.collection("tx").insertOne({ user: u.id, type: "casino", item: premio > 0 ? `Casino: ganaste $${premio.toLocaleString("es")}${imp ? ` (impuesto $${imp.toLocaleString("es")})` : ""}` : "Casino: perdiste la apuesta", amount: neto - monto, at: new Date() });
  try { await snapshot(d); } catch {}
  const f = await us.findOne({ id: u.id }); return NextResponse.json({ ok: true, reels: res.reels, premio, impuesto: imp, neto, mult: res.mult, sinFondos, metodos: metodosDe(f), impPct: (await ecoCfg(d)).impGan });
}
