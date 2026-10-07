import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { pagoKey } from "@/lib/pago";
import { placa } from "@/lib/placa";
import { acreditarNegocio } from "@/lib/negocios";
const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return err("Sin sesión", 401);
  const b = await req.json(), pk = pagoKey(u, b.pago); if (!pk) return err("Método de pago inválido");
  let _id; try { _id = new ObjectId(String(b.id)); } catch { return err("No disponible", 404); }
  const d = await db(), items = d.collection("items"), it = await items.findOne({ _id });
  if (!it || it.stock === 0) return err("No disponible", 404);
  if (it.stock > 0 && !(await items.updateOne({ _id, stock: { $gt: 0 } }, { $inc: { stock: -1 } })).modifiedCount) return err("Agotado");
  const r = await d.collection("users").updateOne({ id: u.id, [pk]: { $gte: it.price } }, { $inc: { [pk]: -it.price }, $push: { inventory: { name: it.name, category: it.category, price: it.price, at: new Date(), sku: it.sku || null, tipo: it.tipo || null, ubicacion: it.ubicacion || null, img: it.img || null, placa: it.category === "Concesionario" ? placa() : null } } });
  if (!r.modifiedCount) { if (it.stock > 0) await items.updateOne({ _id }, { $inc: { stock: 1 } }); return err("Saldo insuficiente"); }
  await d.collection("tx").insertOne({ user: u.id, type: "compra", item: it.name, amount: -it.price, at: new Date() });
  await d.collection("notifs").insertOne({ uid: u.id, title: "Compra realizada", body: `Compraste ${it.name} por $${it.price.toLocaleString("es")}.`, at: new Date(), read: false });
  await acreditarNegocio(d, it.negocio, it.price, `Venta: ${it.name}`);
  return NextResponse.json({ ok: true });
}
