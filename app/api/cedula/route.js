import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { LUGARES, ESTADOS_CIVILES } from "@/lib/zonas";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u) return bad("Sin sesión", 401);
  if (u.cedula) return bad("Ya tienes cédula");
  if (!u.verif?.ok) return bad("Debes verificar tu cuenta de Roblox primero", 403);
  const b = await req.json(); const c = (s) => String(s || "").trim().replace(/\s+/g, " ").slice(0, 40);
  if (b.venezolano !== true) return bad("Los extranjeros deben tramitar su visa antes de obtener cédula. Abre un ticket de visación en el Discord.");
  const nombres = c(b.nombres), apellidos = c(b.apellidos);
  if (!nombres || !apellidos) return bad("Completa nombres y apellidos");
  if (!LUGARES[b.lugar]) return bad("Elige Caracas, La Guaira o El Ávila");
  if (!ESTADOS_CIVILES.includes(b.edoCivil)) return bad("Estado civil inválido");
  const nac = new Date(b.nac + "T00:00:00Z");
  if (isNaN(nac) || nac.getUTCFullYear() < 1930 || nac > new Date()) return bad("Fecha de nacimiento inválida");
  const d = await db(), [lo, hi] = LUGARES[b.lugar]; let num;
  for (let i = 0; i < 20; i++) {
    const n = String(lo + Math.floor(Math.random() * (hi - lo + 1)));
    if (!(await d.collection("users").findOne({ "cedula.num": n }))) { num = n; break; }
  }
  if (!num) return bad("No se pudo generar el número, intenta de nuevo", 500);
  const emision = new Date(), vence = new Date(emision); vence.setUTCFullYear(vence.getUTCFullYear() + 10);
  const r = await d.collection("users").updateOne({ id: u.id, cedula: { $exists: false } }, { $set: { cedula: {
    nombres: nombres.toUpperCase(), apellidos: apellidos.toUpperCase(), nac: b.nac, edoCivil: b.edoCivil.toUpperCase(), lugar: b.lugar,
    nacionalidad: "VENEZOLANO", num, roblox: u.verif.robloxName, robloxId: u.verif.robloxId, avatar: u.verif.avatar, emision, vence } }, $unset: { verif: "" } });
  if (!r.modifiedCount) return bad("Ya tienes cédula");
  return NextResponse.json({ ok: true });
}
