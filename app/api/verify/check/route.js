import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { getBio, getBust } from "@/lib/roblox";
export const dynamic = "force-dynamic";
export async function POST() {
  const u = await apiUser(); if (!u) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const v = u.verif; if (!v) return NextResponse.json({ error: "Primero indica tu usuario de Roblox" }, { status: 400 });
  if (v.ok) return NextResponse.json({ ok: true, avatar: v.avatar, robloxName: v.robloxName });
  if (Date.now() - new Date(v.at).getTime() > 30 * 60 * 1000) return NextResponse.json({ error: "El código expiró. Genera uno nuevo." }, { status: 410 });
  const bio = await getBio(v.robloxId);
  if (bio === null) return NextResponse.json({ error: "Roblox no respondió, intenta en un momento" }, { status: 502 });
  if (!bio.toUpperCase().includes(v.code)) return NextResponse.json({ ok: false, error: "No encontramos el código en tu biografía. Guarda los cambios en Roblox y vuelve a intentar." });
  const avatar = await getBust(v.robloxId);
  await (await db()).collection("users").updateOne({ id: u.id }, { $set: { "verif.ok": true, "verif.avatar": avatar } });
  return NextResponse.json({ ok: true, avatar, robloxName: v.robloxName });
}
