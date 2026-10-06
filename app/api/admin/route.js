import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
export async function POST(req) {
  const u = await apiUser(); if (!u?.rank) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const b = await req.json(), d = await db(), full = u.rank === "FUNDACION";
  const log = (x) => d.collection("audit").insertOne({ by: u.id, rank: u.rank, ...x, at: new Date() });
  if (b.a === "addItem" && full) { await d.collection("items").insertOne({ name: b.name, brand: b.brand || "", year: b.year || "", price: +b.price, img: b.img || "", category: b.category, stock: -1 }); await log({ act: "addItem", name: b.name }); }
  else if (b.a === "delItem" && full) { await d.collection("items").deleteOne({ _id: new ObjectId(b.id) }); await log({ act: "delItem", id: b.id }); }
  else if (b.a === "money" && ["FUNDACION", "ASUNTOS_INTERNOS"].includes(u.rank)) { const r = await d.collection("users").updateOne({ id: b.uid }, { $inc: { balance: +b.amount } }); if (!r.matchedCount) return NextResponse.json({ error: "Usuario no existe" }, { status: 404 }); await log({ act: "money", uid: b.uid, amount: +b.amount }); }
  else if (b.a === "done") { await d.collection("reports").updateOne({ _id: new ObjectId(b.id) }, { $set: { estado: "resuelto" } }); await log({ act: "done", id: b.id }); }
  else return NextResponse.json({ error: "Tu rango no permite esto" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
