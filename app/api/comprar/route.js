import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const d = await db(), it = await d.collection("items").findOne({ _id: new ObjectId((await req.json()).id) });
  if (!it || it.stock === 0) return NextResponse.json({ error: "No disponible" }, { status: 404 });
  const r = await d.collection("users").updateOne({ id: u.id, balance: { $gte: it.price } }, { $inc: { balance: -it.price }, $push: { inventory: { name: it.name, category: it.category, price: it.price, at: new Date() } } });
  if (!r.modifiedCount) return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
  if (it.stock > 0) await d.collection("items").updateOne({ _id: it._id }, { $inc: { stock: -1 } });
  await d.collection("tx").insertOne({ user: u.id, type: "compra", item: it.name, amount: -it.price, at: new Date() });
  await d.collection("notifs").insertOne({ uid: u.id, title: "Compra realizada", body: `Compraste ${it.name} por $${it.price.toLocaleString("es")}.`, at: new Date(), read: false });
  return NextResponse.json({ ok: true });
}
