import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUser } from "@/lib/admin";
import { contarReinicio, reiniciarTodo } from "@/lib/reinicio";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// SOLO el Developer, con la sesión de Administración vigente.
export async function GET() {
  const a = await adminUser(); if (!a || a.rank !== "DEVELOPER") return bad("Solo el Developer", 403);
  return NextResponse.json({ info: await contarReinicio(await db()) });
}
export async function POST(req) {
  const a = await adminUser(); if (!a || a.rank !== "DEVELOPER") return bad("Solo el Developer", 403);
  const b = await req.json().catch(() => ({}));
  if (String(b.frase || "").trim() !== "REINICIAR TODO") return bad('Escribe exactamente "REINICIAR TODO" para confirmar');
  const d = await db(), res = await reiniciarTodo(d, { conservarStaff: b.conservarStaff !== false });
  await d.collection("audit").insertOne({ by: a.id, byName: a.name, rank: a.rank, act: "reiniciarBD", objetivo: "Base de datos completa", razon: "Reinicio total", detalle: res, at: new Date() });
  return NextResponse.json({ ok: true, res });
}
