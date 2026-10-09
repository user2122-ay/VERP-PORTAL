import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
// Cierra la sesión de Administración (se llama sola al salir del panel).
export async function POST() { const u = await apiUser(); if (u) await (await db()).collection("users").updateOne({ id: u.id }, { $unset: { adminSesion: "" } }); return NextResponse.json({ ok: true }); }
