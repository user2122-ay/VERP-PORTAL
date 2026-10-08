import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { pagoKey } from "@/lib/pago";
import { ingresarTesoreria } from "@/lib/tesoreria";
import { estadoMulta } from "@/lib/multas";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// El ciudadano paga su multa cuando quiere (efectivo o cualquiera de sus tarjetas). El dinero va a la Tesorería del Estado.
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json().catch(() => ({})), pk = pagoKey(u, b.pago); if (!pk) return bad("Método de pago inválido");
  let _id; try { _id = new ObjectId(String(b.id)); } catch { return bad("Multa inválida", 404); }
  const d = await db(), c = d.collection("multas"), m = await c.findOne({ _id, sujeto: u.id }); if (!m || m.estado === "pagada") return bad("Esa multa ya no está pendiente", 404);
  const claim = await c.updateOne({ _id, sujeto: u.id, estado: "pendiente" }, { $set: { estado: "cobrando" } }); if (!claim.modifiedCount) return bad("Esa multa ya se está pagando", 409);
  if (!(await d.collection("users").updateOne({ id: u.id, [pk]: { $gte: m.monto } }, { $inc: { [pk]: -m.monto } })).modifiedCount) { await c.updateOne({ _id }, { $set: { estado: "pendiente" } }); return bad("Saldo insuficiente"); }
  const at = new Date(), tarde = estadoMulta(m) === "vencida";
  await c.updateOne({ _id }, { $set: { estado: "pagada", pagadaAt: at, tarde } });
  await ingresarTesoreria(d, m.monto, `Multa pagada por ${m.sujetoN}`, "Multas PNB");
  await d.collection("tx").insertOne({ user: u.id, type: "multa", item: `Multa pagada (${(m.articulos || []).join("; ").slice(0, 80)})`, amount: -m.monto, at });
  await d.collection("notifs").insertMany([{ uid: u.id, title: "Multa pagada", body: `Pagaste la multa de $${m.monto.toLocaleString("es")}.`, at, read: false }, { uid: m.por, title: "Multa pagada", body: `${m.sujetoN} pagó la multa de $${m.monto.toLocaleString("es")}${tarde ? " (fuera de plazo)" : ""}.`, at, read: false }]);
  return NextResponse.json({ ok: true });
}
