import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
export async function POST() {
  const u = await apiUser(); if (!u) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  await (await db()).collection("notifs").updateMany({ uid: u.id, read: false }, { $set: { read: true } });
  return NextResponse.json({ ok: true });
}
