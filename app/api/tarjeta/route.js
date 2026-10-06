import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { BANCOS } from "@/lib/bancos";
import { nuevaCuenta } from "@/lib/tarjeta";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const k = (await req.json()).banco, b = BANCOS[k]; if (!b) return bad("Banco inválido");
  if (u.cuentas?.[k]) return bad("Ya tienes esta tarjeta");
  const d = await db(), cuenta = await nuevaCuenta(k);
  const r = await d.collection("users").updateOne({ id: u.id, balance: { $gte: b.precio }, [`cuentas.${k}`]: { $exists: false } }, { $inc: { balance: -b.precio }, $set: { [`cuentas.${k}`]: cuenta } });
  if (!r.modifiedCount) return bad("Saldo insuficiente en efectivo");
  const at = new Date();
  await d.collection("tx").insertOne({ user: u.id, type: "compra", item: `Tarjeta ${b.nombre}`, amount: -b.precio, at });
  await d.collection("notifs").insertOne({ uid: u.id, title: "Tarjeta entregada", body: `Tu tarjeta ${b.nombre} ha sido entregada. Ya aparece en tu banco.`, at, read: false });
  return NextResponse.json({ ok: true });
}
