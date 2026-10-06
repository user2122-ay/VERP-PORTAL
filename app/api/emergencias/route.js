import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { zona } from "@/lib/zonas";
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const c = (await db()).collection("reports");
  if (await c.countDocuments({ user: u.id, at: { $gt: new Date(Date.now() - 120000) } })) return NextResponse.json({ error: "Espera 2 minutos entre reportes." }, { status: 429 });
  const b = await req.json(), x = +b.x, y = +b.y;
  if (!(x >= 0 && x <= 100 && y >= 0 && y <= 100)) return NextResponse.json({ error: "Ubicación inválida" }, { status: 400 });
  await c.insertOne({ user: u.id, nombre: u.cedula.nombres + " " + u.cedula.apellidos, tipo: String(b.tipo).slice(0, 40), calle: String(b.calle || "").slice(0, 80), desc: String(b.desc).slice(0, 400), x, y, zona: zona(x, y), estado: "pendiente", at: new Date() });
  return NextResponse.json({ ok: true });
}
