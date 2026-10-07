import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { CHIP_PRECIO, nuevoNumero, fmtTel } from "@/lib/redes";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST() {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  if (u.chip) return bad("Ya tienes una línea");
  const d = await db(); let num; do { num = nuevoNumero(); } while (await d.collection("users").findOne({ "chip.num": num }));
  const r = await d.collection("users").updateOne({ id: u.id, balance: { $gte: CHIP_PRECIO }, chip: { $exists: false } }, { $inc: { balance: -CHIP_PRECIO }, $set: { chip: { num, nombre: "", at: new Date() } } });
  if (!r.modifiedCount) return bad("Saldo insuficiente en efectivo");
  const at = new Date();
  await d.collection("tx").insertOne({ user: u.id, type: "compra", item: "Chip VE WhatsApp", amount: -CHIP_PRECIO, at });
  await d.collection("notifs").insertOne({ uid: u.id, title: "Chip entregado", body: `Tu línea es ${fmtTel(num)}. Ya puedes usar VE WhatsApp.`, at, read: false });
  return NextResponse.json({ ok: true });
}
