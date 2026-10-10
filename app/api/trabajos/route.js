import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { nombreDe } from "@/lib/rol";
import { validName } from "@/lib/roblox";
import { BANCOS } from "@/lib/bancos";
import { trabajoDe, MAX_HORAS, MAX_PENDIENTES } from "@/lib/trabajos";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const https = (s) => { try { const h = new URL(String(s || "").trim()); return h.protocol === "https:" ? h.href : null; } catch { return null; } };
// Solicitud de trabajo secundario: usuario de Roblox + evidencias (inicio 1, durante 1, final 3) + trabajo + horas. El total se calcula aquí, no se confía en el del navegador.
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json().catch(() => ({})), roblox = String(b.roblox || "").trim(), t = trabajoDe(b.trabajo), horas = Math.floor(Number(b.horas));
  if (!validName(roblox)) return bad("Escribe tu usuario de Roblox (3 a 20 letras, números o _)");
  if (!t) return bad("Elige el trabajo que realizaste");
  if (!(horas >= 1 && horas <= MAX_HORAS)) return bad(`Las horas deben ser de 1 a ${MAX_HORAS}`);
  const inicio = https(b.inicio), durante = https(b.durante), final = (Array.isArray(b.final) ? b.final : []).map(https);
  if (!inicio) return bad("Falta la evidencia del inicio del trabajo (1 foto, link https)");
  if (!durante) return bad("Falta la evidencia durante el trabajo (1 foto, link https)");
  if (final.length !== 3 || final.some((x) => !x)) return bad("Faltan las 3 fotos de evidencia al finalizar el trabajo (links https)");
  const cuenta = String(b.cuenta || "efectivo"); if (cuenta !== "efectivo" && (!u.cuentas?.[cuenta] || BANCOS[cuenta]?.comercial)) return bad("Elige una cuenta válida para recibir el pago");
  const d = await db(), c = d.collection("trabajos");
  if ((await c.countDocuments({ user: u.id, estado: "pendiente" })) >= MAX_PENDIENTES) return bad(`Ya tienes ${MAX_PENDIENTES} solicitudes pendientes: espera a que el staff las revise`);
  await c.insertOne({ user: u.id, userName: nombreDe(u), roblox, trabajo: t[0], trabajoN: t[1], tarifa: t[2], horas, total: t[2] * horas, ev: { inicio, durante, final }, cuenta, estado: "pendiente", at: new Date() });
  return NextResponse.json({ ok: true, total: t[2] * horas });
}
