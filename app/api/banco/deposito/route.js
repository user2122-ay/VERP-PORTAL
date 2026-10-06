import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { BANCOS } from "@/lib/bancos";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json(), k = b.banco, m = Math.floor(Number(b.monto));
  if (!u.cuentas?.[k]) return bad("No tienes tarjeta de ese banco"); if (!(m > 0)) return bad("Monto inválido");
  const d = await db(), r = await d.collection("users").updateOne({ id: u.id, balance: { $gte: m } }, { $inc: { balance: -m, [`cuentas.${k}.saldo`]: m } });
  if (!r.modifiedCount) return bad("No tienes tanto efectivo");
  await d.collection("tx").insertOne({ user: u.id, type: "deposito", item: `Depósito a ${BANCOS[k].corto} (efectivo → banco)`, amount: m, at: new Date() });
  return NextResponse.json({ ok: true });
}
