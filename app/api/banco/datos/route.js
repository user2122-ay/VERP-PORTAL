import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth";
import { tarjetaDe } from "@/lib/tarjeta";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await apiUser(); if (!u?.cedula) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const { cvc, venc } = await tarjetaDe(u);
  return NextResponse.json({ cvc, venc });
}
