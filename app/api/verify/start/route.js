import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { findUser, validName } from "@/lib/roblox";
export const dynamic = "force-dynamic";
const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code = () => "VERP-" + Array.from(randomBytes(6), (b) => A[b % A.length]).join("");
export async function POST(req) {
  const u = await apiUser(); if (!u) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (u.cedula) return NextResponse.json({ error: "Ya tienes cédula" }, { status: 400 });
  const { roblox } = await req.json(); const n = String(roblox || "").trim();
  if (!validName(n)) return NextResponse.json({ error: "Usuario de Roblox inválido" }, { status: 400 });
  const rb = await findUser(n); if (!rb) return NextResponse.json({ error: "No encontramos ese usuario de Roblox" }, { status: 404 });
  const d = await db();
  if (await d.collection("users").findOne({ "cedula.robloxId": rb.id })) return NextResponse.json({ error: "Esa cuenta de Roblox ya tiene una cédula" }, { status: 409 });
  const c = code();
  await d.collection("users").updateOne({ id: u.id }, { $set: { verif: { robloxId: rb.id, robloxName: rb.name, code: c, ok: false, at: new Date() } } });
  return NextResponse.json({ ok: true, code: c, robloxName: rb.name });
}
