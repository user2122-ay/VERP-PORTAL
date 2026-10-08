import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { liquidar } from "./liquidar";
import { cobrar } from "./cobros";
import { rolesDe, flagsDe } from "./rol";
const k = () => new TextEncoder().encode(process.env.SESSION_SECRET);
export const sign = (p) => new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(k());
export async function session() {
  try { const t = cookies().get("s")?.value; return t ? (await jwtVerify(t, k())).payload : null; } catch { return null; }
}
export const rankOf = (id) => ["FUNDACION", "ASUNTOS_INTERNOS", "JUNTA_DIRECTIVA", "MODERACION"].find((r) => (process.env[r + "_IDS"] || "").split(",").map((x) => x.trim()).includes(id)) || null;
const rk = (u) => (u.dev ? "DEVELOPER" : rankOf(u.id) || u.staff || u.rank || null);
export async function needUser(o = {}) {
  const s = await session(); if (!s) redirect("/login");
  await liquidar();
  let u = await (await db()).collection("users").findOne({ id: s.id }, { projection: { _id: 0 } });
  if (!u) redirect("/login");
  if (!u.rolesAt || Date.now() - +new Date(u.rolesAt) > 3e5) { // revisa en Discord los roles delictivo/policía y los guarda
    const r = await rolesDe(u.id);
    if (r) { const f = { ...flagsDe(r), rolesAt: new Date() }; await (await db()).collection("users").updateOne({ id: u.id }, { $set: f }); u = { ...u, ...f }; }
  }
  if (!u.cedula && !o.noCedula) redirect("/registro");
  await cobrar(u);
  return { ...u, rank: rk(u) };
}
export async function apiUser() {
  const s = await session(); if (!s) return null;
  const u = await (await db()).collection("users").findOne({ id: s.id });
  return u ? { ...u, rank: rk(u) } : null;
}
