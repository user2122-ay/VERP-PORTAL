import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const u = await apiUser(), c = u?.cuentas?.[new URL(req.url).searchParams.get("b")];
  if (!c) return NextResponse.json({ error: "Sin tarjeta" }, { status: 404 });
  return NextResponse.json({ cvc: c.cvc, venc: c.venc });
}
