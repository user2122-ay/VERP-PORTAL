import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { canAdmin } from "@/lib/roles";
const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u || !canAdmin(u.rank)) return err("Sin permiso", 403);
  const b = await req.json(), d = await db();
  const log = (x) => d.collection("audit").insertOne({ by: u.id, byName: u.name, rank: u.rank, ...x, at: new Date() });
  const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
  const str = (s, n = 80) => String(s || "").trim().slice(0, n);
  if (b.a === "addItem") {
    const price = Number(b.price); if (!str(b.name) || !Number.isFinite(price) || price < 0) return err("Nombre o precio inválido");
    await d.collection("items").insertOne({ name: str(b.name), brand: str(b.brand), year: str(b.year, 10), price, img: str(b.img, 500), category: str(b.category, 30), stock: -1 });
    await log({ act: "addItem", name: str(b.name), price });
  } else if (b.a === "delItem") {
    const id = oid(b.id); if (!id) return err("ID inválido");
    await d.collection("items").deleteOne({ _id: id }); await log({ act: "delItem", id: String(id) });
  } else if (b.a === "money") {
    const amount = Number(b.amount); if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1e9) return err("Monto inválido");
    const r = await d.collection("users").updateOne({ id: str(b.uid, 30) }, { $inc: { balance: amount } });
    if (!r.matchedCount) return err("Usuario no existe", 404);
    await log({ act: "money", uid: str(b.uid, 30), amount });
  } else if (b.a === "done") {
    const id = oid(b.id); if (!id) return err("ID inválido");
    await d.collection("reports").updateOne({ _id: id }, { $set: { estado: "resuelto" } }); await log({ act: "done", id: String(id) });
  } else return err("Acción desconocida");
  return NextResponse.json({ ok: true });
}
