import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { CHIP_PRECIO, OPS, numeroDe, fmtTel } from "@/lib/redes";
import { pagoKey } from "@/lib/pago";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  if (u.chip) return bad("Ya tienes una línea");
  const pk = pagoKey(u, (await req.json().catch(() => ({}))).pago); if (!pk) return bad("Método de pago inválido");
  const d = await db(); let num = null;
  for (const op of [...OPS].sort(() => Math.random() - 0.5)) { const n = numeroDe(u.cedula.num, op); if (!(await d.collection("users").findOne({ "chip.num": n }))) { num = n; break; } }
  if (!num) return bad("No hay un número libre para tu cédula");
  const r = await d.collection("users").updateOne({ id: u.id, [pk]: { $gte: CHIP_PRECIO }, chip: { $exists: false } }, { $inc: { [pk]: -CHIP_PRECIO }, $set: { chip: { num, nombre: "", at: new Date() } } });
  if (!r.modifiedCount) return bad("Saldo insuficiente");
  const at = new Date();
  await d.collection("tx").insertOne({ user: u.id, type: "compra", item: "Chip VE WhatsApp", amount: -CHIP_PRECIO, at });
  await d.collection("notifs").insertOne({ uid: u.id, title: "Chip entregado", body: `Tu línea es ${fmtTel(num)}. Ya puedes usar VE WhatsApp.`, at, read: false });
  return NextResponse.json({ ok: true });
}
