import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
export async function POST(req) {
  const u = await apiUser(); if (!u) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (u.cedula) return NextResponse.json({ error: "Ya tienes cédula" }, { status: 400 });
  const b = await req.json(); const c = (s) => String(s || "").trim().slice(0, 40);
  if (!c(b.nombres) || !c(b.apellidos) || !b.nac || !c(b.roblox)) return NextResponse.json({ error: "Completa todos los campos" }, { status: 400 });
  const num = "V-" + Math.random().toString(36).slice(2, 8).toUpperCase() + "-" + Date.now().toString(36).slice(-3).toUpperCase();
  await (await db()).collection("users").updateOne({ id: u.id }, { $set: { cedula: { nombres: c(b.nombres).toUpperCase(), apellidos: c(b.apellidos).toUpperCase(), nac: b.nac, roblox: c(b.roblox), num, emision: new Date() } } });
  return NextResponse.json({ ok: true });
}
