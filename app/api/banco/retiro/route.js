import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { BANCOS } from "@/lib/bancos";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// Retirar efectivo de cualquiera de las tarjetas del usuario (incluida la de Comerciante).
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json(), k = b.banco, m = Math.floor(Number(b.monto));
  if (!BANCOS[k] || !u.cuentas?.[k]) return bad("No tienes tarjeta de ese banco"); if (!(m > 0) || m > 1e9) return bad("Monto inválido");
  const d = await db(), r = await d.collection("users").updateOne({ id: u.id, [`cuentas.${k}.saldo`]: { $gte: m } }, { $inc: { [`cuentas.${k}.saldo`]: -m, balance: m } });
  if (!r.modifiedCount) return bad(`Saldo insuficiente en ${BANCOS[k].corto}`);
  await d.collection("tx").insertOne({ user: u.id, type: "retiro", item: `Retiro de ${BANCOS[k].corto} (banco → efectivo)`, amount: -m, at: new Date() });
  return NextResponse.json({ ok: true });
}
