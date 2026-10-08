import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { placaStaff } from "@/lib/admin";
import { canReview } from "@/lib/roles";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// Pide la placa del staff. 5 fallos bloquean 5 minutos; la sesión dura 8 horas.
export async function POST(req) {
  const u = await apiUser(); if (!u || !canReview(u.rank)) return bad("Sin permiso", 403);
  const esperada = placaStaff(u); if (!esperada) return bad("No tienes placa asignada. Pídele a Fundación o Asuntos Internos que te la asigne.", 403);
  const b = await req.json().catch(() => ({})), f = u.adminFail, at = new Date(), us = (await db()).collection("users");
  if (f?.n >= 5 && Date.now() - +new Date(f.at) < 3e5) return bad("Demasiados intentos. Espera 5 minutos", 429);
  if (String(b.placa || "").trim().toUpperCase() !== String(esperada).toUpperCase()) { await us.updateOne({ id: u.id }, { $set: { adminFail: { n: f && Date.now() - +new Date(f.at) < 3e5 ? f.n + 1 : 1, at } } }); return bad("Placa incorrecta", 401); }
  await us.updateOne({ id: u.id }, { $set: { adminSesion: at }, $unset: { adminFail: "" } }); return NextResponse.json({ ok: true });
}
