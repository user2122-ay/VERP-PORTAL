import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { LUGARES_CASA, ESPERA_GUARDAR, guardable, esAuto } from "@/lib/casa";
import { casaRef } from "@/lib/mdt";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json().catch(() => ({})), us = (await db()).collection("users"), inv = u.inventory || [];
  const it = inv.find((i) => i.name === b.name && +new Date(i.at) === +new Date(b.at)); if (!it) return bad("Ese objeto no está en tu inventario");
  if (b.accion === "sacar") {
    if (it.loc !== "casa") return bad("Ese objeto no está guardado en casa"); if (it.plantada) return bad("Una planta sembrada no se puede sacar: espera a cosecharla");
    const falta = u.guardarAt ? ESPERA_GUARDAR - (Date.now() - +new Date(u.guardarAt)) : 0; if (falta > 0) return bad(`Espera ${Math.ceil(falta / 60000)} min para pasar otro objeto entre tu inventario y el de la casa`);
    const r = await us.updateOne({ id: u.id, inventory: { $elemMatch: { name: it.name, at: it.at, loc: "casa", plantada: { $ne: true } } } }, { $set: { "inventory.$.loc": "personal", guardarAt: new Date() }, $unset: { "inventory.$.casa": "", "inventory.$.lugar": "" } });
    if (!r.modifiedCount) return bad("No se pudo sacar. Intenta de nuevo"); return NextResponse.json({ ok: true });
  }
  if (b.accion === "guardar") {
    if (it.loc === "casa") return bad("Ya está guardado en casa"); if (!guardable(it)) return bad("Ese objeto no se puede guardar en una casa");
    if (!inv.some((i) => i.category === "Propiedades" && casaRef(i.name, i.at) === b.casa)) return bad("Elige una de tus casas");
    const auto = esAuto(it), lugar = auto ? "Garaje" : b.lugar;
    if (!LUGARES_CASA.includes(lugar)) return bad("Elige en qué parte de la casa lo escondes");
    if (auto && inv.some((i) => esAuto(i) && i.loc === "casa" && i.casa === b.casa)) return bad("El garaje de esa casa ya tiene un auto. Solo cabe uno por garaje");
    const falta = u.guardarAt ? ESPERA_GUARDAR - (Date.now() - +new Date(u.guardarAt)) : 0; if (falta > 0) return bad(`Espera ${Math.ceil(falta / 60000)} min para guardar otro objeto`);
    const r = await us.updateOne({ id: u.id, $and: [{ $or: [{ guardarAt: { $exists: false } }, { guardarAt: { $lte: new Date(Date.now() - ESPERA_GUARDAR) } }] }, { inventory: { $elemMatch: { name: it.name, at: it.at, loc: { $ne: "casa" } } } }, ...(auto ? [{ inventory: { $not: { $elemMatch: { category: "Concesionario", loc: "casa", casa: b.casa } } } }] : [])] }, { $set: { "inventory.$.loc": "casa", "inventory.$.casa": b.casa, "inventory.$.lugar": lugar, guardarAt: new Date() } });
    if (!r.modifiedCount) return bad("No se pudo guardar. Intenta de nuevo"); return NextResponse.json({ ok: true });
  }
  return bad("Acción inválida");
}
