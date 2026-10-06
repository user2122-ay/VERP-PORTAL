import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const nom = (x) => x.cedula.nombres.split(" ")[0] + " " + x.cedula.apellidos.split(" ")[0];
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json(), m = Math.floor(Number(b.monto)), nota = String(b.nota || "").trim().slice(0, 60);
  const num = String(b.num || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!(m > 0) || m > 1e9) return bad("Monto inválido");
  const d = await db(), to = await d.collection("users").findOne({ "cedula.num": num });
  if (!to) return bad("No existe una cédula con ese número", 404);
  if (to.id === u.id) return bad("No puedes transferirte a ti mismo");
  const r = await d.collection("users").updateOne({ id: u.id, balance: { $gte: m } }, { $inc: { balance: -m } });
  if (!r.modifiedCount) return bad("Saldo insuficiente");
  await d.collection("users").updateOne({ id: to.id }, { $inc: { balance: m } });
  const at = new Date(), n = nota ? ` · ${nota}` : "", $ = m.toLocaleString("es");
  await d.collection("tx").insertMany([
    { user: u.id, type: "transferencia", item: `Enviado a ${nom(to)}${n}`, amount: -m, at },
    { user: to.id, type: "transferencia", item: `Recibido de ${nom(u)}${n}`, amount: m, at }]);
  await d.collection("notifs").insertMany([
    { uid: u.id, title: "Transferencia enviada", body: `Enviaste $${$} a ${nom(to)}.`, at, read: false },
    { uid: to.id, title: "Transferencia recibida", body: `${nom(u)} te envió $${$}${n}.`, at, read: false }]);
  return NextResponse.json({ ok: true });
}
