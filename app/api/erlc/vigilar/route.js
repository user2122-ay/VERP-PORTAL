import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vigilarCondenas } from "@/lib/jail";
import { tickAutomatico } from "@/lib/erlcauto";
// Llámala cada minuto desde un cron externo: /api/erlc/vigilar?k=TU_CRON_SECRET (o con el encabezado Authorization: Bearer TU_CRON_SECRET)
export async function GET(req) {
  const k = new URL(req.url).searchParams.get("k") || (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!process.env.CRON_SECRET || k !== process.env.CRON_SECRET) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const d = await db(); await vigilarCondenas(d); try { await tickAutomatico(d); } catch {} return NextResponse.json({ ok: true });
}
