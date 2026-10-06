import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { liquidar } from "./liquidar";
const k = () => new TextEncoder().encode(process.env.SESSION_SECRET);
export const sign = (p) => new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(k());
export async function session() {
  try { const t = cookies().get("s")?.value; return t ? (await jwtVerify(t, k())).payload : null; } catch { return null; }
}
export const rankOf = (id) => ["FUNDACION", "ASUNTOS_INTERNOS", "MODERACION"].find((r) => (process.env[r + "_IDS"] || "").split(",").map((x) => x.trim()).includes(id)) || null;
export async function needUser(o = {}) {
  const s = await session(); if (!s) redirect("/login");
  await liquidar();
  const u = await (await db()).collection("users").findOne({ id: s.id }, { projection: { _id: 0 } });
  if (!u) redirect("/login");
  if (!u.cedula && !o.noCedula) redirect("/registro");
  return { ...u, rank: rankOf(u.id) };
}
export async function apiUser() {
  const s = await session(); if (!s) return null;
  const u = await (await db()).collection("users").findOne({ id: s.id });
  return u ? { ...u, rank: rankOf(u.id) } : null;
}
