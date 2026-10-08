import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { esComida, needsDe, FRIO } from "@/lib/comida";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json().catch(() => ({})), fid = String(b.fid || ""), us = (await db()).collection("users"), ahora = Date.now();
  const inv = (u.inventory || []).find((i) => i.fid === fid && esComida(i)), nev = u.nevera, ennev = nev?.items?.find((i) => i.fid === fid);
  const ok = (msg) => NextResponse.json({ ok: true, msg });
  switch (b.accion) {
    case "comer": {
      if (!inv) return bad("No tienes eso en tu inventario (si está en la nevera, sácalo primero)");
      const n = needsDe(u, ahora), bebida = inv.tipo === "bebida", venc = +new Date(inv.caduca) <= ahora; let h = n.h, s = n.s, msg;
      if (venc) { const q = 5 + Math.floor(Math.random() * 11); if (Math.random() < 0.8) { h = Math.max(0, h - q); s = Math.max(0, s - q); msg = `Estaba vencido y te cayó mal: bajaste ${q}% de hambre y de sed.`; } else msg = "Estaba vencido, pero esta vez no te pasó nada (no te alimentó)."; }
      else if (bebida) { s = Math.min(100, s + inv.sube); msg = `Bebiste ${inv.name}: +${inv.sube}% de sed.`; } else { h = Math.min(100, h + inv.sube); msg = `Comiste ${inv.name}: +${inv.sube}% de hambre.`; }
      const r = await us.updateOne({ id: u.id, "inventory.fid": fid }, { $pull: { inventory: { fid } }, $set: { needs: { h, s, t: ahora } } }); if (!r.modifiedCount) return bad("No se pudo");
      return ok(msg);
    }
    case "guardar": {
      if (!inv) return bad("No tienes eso en tu inventario"); if (!nev) return bad("No tienes nevera"); if ((nev.items || []).length >= nev.cap) return bad("No hay espacio en tu nevera");
      const rest = Math.max(0, +new Date(inv.caduca) - ahora), item = { ...inv, caduca: new Date(ahora + rest * FRIO), guardado: new Date(ahora) };
      const r = await us.updateOne({ id: u.id, "inventory.fid": fid, [`nevera.items.${nev.cap - 1}`]: { $exists: false } }, { $pull: { inventory: { fid } }, $push: { "nevera.items": item } }); if (!r.modifiedCount) return bad("No hay espacio en tu nevera");
      return ok(`${inv.name} guardado en la nevera: ahora dura más.`);
    }
    case "sacar": {
      if (!ennev) return bad("Eso no está en tu nevera"); const rest = Math.max(0, +new Date(ennev.caduca) - ahora), item = { ...ennev, caduca: new Date(ahora + rest / FRIO) }; delete item.guardado;
      const r = await us.updateOne({ id: u.id, "nevera.items.fid": fid }, { $pull: { "nevera.items": { fid } } }); if (!r.modifiedCount) return bad("No se pudo");
      await us.updateOne({ id: u.id }, { $push: { inventory: item } }); return ok(`${ennev.name} sacado de la nevera.`);
    }
    case "botar": {
      if (!inv && !ennev) return bad("No tienes eso"); await us.updateOne({ id: u.id }, inv ? { $pull: { inventory: { fid } } } : { $pull: { "nevera.items": { fid } } }); return ok("Lo botaste.");
    }
  }
  return bad("Acción inválida");
}
