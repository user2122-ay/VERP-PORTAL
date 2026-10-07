import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
export async function POST(req) {
  const u = await apiUser(); if (!u) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const s = await req.json(); if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  const col = (await db()).collection("users");
  await col.updateOne({ id: u.id }, { $pull: { push: { endpoint: s.endpoint } } });
  await col.updateOne({ id: u.id }, { $push: { push: { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } } } });
  return NextResponse.json({ ok: true });
}
