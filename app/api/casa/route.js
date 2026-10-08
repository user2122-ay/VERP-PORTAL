import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { LUGARES_CASA, ESPERA_GUARDAR, guardable } from "@/lib/casa";
import { casaRef } from "@/lib/mdt";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json().catch(() => ({})), us = (await db()).collection("users"), inv = u.inventory || [];
  const it = inv.find((i) => i.name === b.name && +new Date(i.at) === +new Date(b.at)); if (!it) return bad("Ese objeto no está en tu inventario");
  if (b.accion === "sacar") {
    if (it.loc !== "casa") return bad("Ese objeto no está guardado en casa");
    await us.updateOne({ id: u.id, inventory: { $elemMatch: { name: it.name, at: it.at, loc: "casa" } } }, { $set: { "inventory.$.loc": "personal" }, $unset: { "inventory.$.casa": "", "inventory.$.lugar": "" } });
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "guardar") {
    if (it.loc === "casa") return bad("Ya está guardado en casa"); if (!guardable(it)) return bad("Ese objeto no se puede guardar en una casa");
    if (!inv.some((i) => i.category === "Propiedades" && casaRef(i.name, i.at) === b.casa)) return bad("Elige una de tus casas");
    if (!LUGARES_CASA.includes(b.lugar)) return bad("Elige en qué parte de la casa lo escondes");
    const falta = u.guardarAt ? ESPERA_GUARDAR - (Date.now() - +new Date(u.guardarAt)) : 0; if (falta > 0) return bad(`Espera ${Math.ceil(falta / 60000)} min para guardar otro objeto`);
    const r = await us.updateOne({ id: u.id, $or: [{ guardarAt: { $exists: false } }, { guardarAt: { $lte: new Date(Date.now() - ESPERA_GUARDAR) } }], inventory: { $elemMatch: { name: it.name, at: it.at, loc: { $ne: "casa" } } } }, { $set: { "inventory.$.loc": "casa", "inventory.$.casa": b.casa, "inventory.$.lugar": b.lugar, guardarAt: new Date() } });
    if (!r.modifiedCount) return bad("No se pudo guardar. Intenta de nuevo"); return NextResponse.json({ ok: true });
  }
  return bad("Acción inválida");
}
