import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { BANCOS } from "@/lib/bancos";
import { tieneTelefono } from "@/lib/redes";
import { planesDe, acreditarNegocio } from "@/lib/negocios";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  if (!tieneTelefono(u) || !u.chip) return bad("Necesitas un teléfono y un chip"); if (u.plan) return bad("Ya tienes un plan");
  const d = await db(), m = Number((await req.json()).monto); if (!(await planesDe(d)).includes(m)) return bad("Plan inválido");
  let ok = false; for (const k of Object.keys(BANCOS).filter((x) => !BANCOS[x].comercial && u.cuentas?.[x])) if ((await d.collection("users").updateOne({ id: u.id, [`cuentas.${k}.saldo`]: { $gte: m } }, { $inc: { [`cuentas.${k}.saldo`]: -m } })).modifiedCount) { ok = true; break; }
  if (!ok) return bad("Necesitas saldo en tu banco para activar el plan (deposita efectivo en tu tarjeta)");
  const at = new Date(); await d.collection("users").updateOne({ id: u.id }, { $set: { plan: { monto: m, desde: at, proximo: new Date(+at + 7 * 864e5) } } });
  await d.collection("tx").insertOne({ user: u.id, type: "cobro", item: "Plan de telefonía (primera semana)", amount: -m, at }); await acreditarNegocio(d, "movil", m, "Plan de telefonía");
  return NextResponse.json({ ok: true });
}
