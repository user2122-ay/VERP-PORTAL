import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { impuesto } from "@/lib/economia";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const nom = (x) => x.cedula.nombres.split(" ")[0] + " " + x.cedula.apellidos.split(" ")[0];
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json(), m = Math.floor(Number(b.monto)), nota = String(b.nota || "").trim().slice(0, 60);
  const dg = String(b.dest || "").replace(/\D/g, "");
  if (!(m > 0) || m > 1e9) return bad("Monto inválido");
  const d = await db(), { fee, inflacion } = await impuesto(d);
  const to = await d.collection("users").findOne(dg.length === 16 ? { tarjeta: dg } : { "cedula.num": dg.replace(/^0+/, "") || "x" });
  if (!to) return bad("No existe esa tarjeta o cédula", 404);
  if (to.id === u.id) return bad("No puedes transferirte a ti mismo");
  const r = await d.collection("users").updateOne({ id: u.id, balance: { $gte: m + fee } }, { $inc: { balance: -(m + fee) } });
  if (!r.modifiedCount) return bad(`Saldo insuficiente (monto + impuesto de $${fee})`);
  await d.collection("users").updateOne({ id: to.id }, { $inc: { balance: m } });
  const at = new Date(), n = nota ? ` · ${nota}` : "", $ = m.toLocaleString("es");
  await d.collection("tx").insertMany([
    { user: u.id, type: "transferencia", item: `Enviado a ${nom(to)}${n}`, amount: -m, at },
    { user: u.id, type: "impuesto", item: `Impuesto BVC (inflación ${inflacion}%)`, amount: -fee, at },
    { user: to.id, type: "transferencia", item: `Recibido de ${nom(u)}${n}`, amount: m, at }]);
  await d.collection("notifs").insertMany([
    { uid: u.id, title: "Transferencia enviada", body: `Enviaste $${$} a ${nom(to)}. Impuesto: $${fee}.`, at, read: false },
    { uid: to.id, title: "Transferencia recibida", body: `${nom(u)} te envió $${$}${n}.`, at, read: false }]);
  return NextResponse.json({ ok: true });
}
