import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { tieneTelefono } from "@/lib/redes";
import { pagoKey, pagarA, metodosDe } from "@/lib/pago";
import { appVisible, reservaIngresar, reservaPagar, impuestoGanancia, snapshot } from "@/lib/reserva";
import { ACTIVOS, precio, MIN_COMPRA, MAX_COMPRA, r6 } from "@/lib/trading";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const $ = (n) => `$${Number(n).toLocaleString("es")}`;
// Comprar: pagas con la cuenta que elijas y el dinero entra a la RESERVA. Vender: la reserva te paga en la cuenta que elijas (si alcanza) y de la ganancia se cobra impuesto (a la Tesorería).
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401); const d = await db();
  if (!tieneTelefono(u) || !(await appVisible(d, u, "trading"))) return bad("El trading no está disponible", 403);
  const b = await req.json().catch(() => ({})), k = String(b.activo || ""); if (!ACTIVOS[k]) return bad("Activo inválido");
  const px = precio(k), us = d.collection("users"), h = u.trading?.hold?.[k]; let msg = "";
  if (b.accion === "comprar") {
    const m = Math.floor(Number(b.monto)); if (!(m >= MIN_COMPRA && m <= MAX_COMPRA)) return bad(`Compra de ${$(MIN_COMPRA)} a ${$(MAX_COMPRA)}`);
    const pk = pagoKey(u, b.pago); if (!pk) return bad("Elige con qué pagar"); const qty = r6(m / px);
    if (!(await us.updateOne({ id: u.id, [pk]: { $gte: m } }, { $inc: { [pk]: -m, [`trading.hold.${k}.q`]: qty, [`trading.hold.${k}.costo`]: m } })).modifiedCount) return bad("Saldo insuficiente");
    await reservaIngresar(d, m, "trading", u.id, `Compra de ${k}`);
    await d.collection("tx").insertOne({ user: u.id, type: "trading", item: `Trading: compraste ${qty} ${k} a ${$(px)}`, amount: -m, at: new Date() });
    msg = `Compraste ${qty} ${k} a ${$(px)} por ${$(m)}`;
  } else if (b.accion === "vender") {
    if (!h || !(h.q > 0)) return bad("No tienes de ese activo"); const todo = !!b.todo, qty = todo ? h.q : r6(Math.min(Number(b.qty), h.q)); if (!(qty > 0)) return bad("Cantidad inválida");
    const valor = Math.round(qty * px); if (valor < 1) return bad("Es muy poco para vender");
    const costoP = todo ? h.costo || 0 : (h.costo || 0) * (qty / h.q), filtro = todo ? { id: u.id, [`trading.hold.${k}.q`]: h.q } : { id: u.id, [`trading.hold.${k}.q`]: { $gte: qty } };
    if (!(await reservaPagar(d, valor, "trading", u.id, `Venta de ${k}`))) return bad("La reserva no tiene fondos para pagarte esa venta ahora. Vende una parte o intenta más tarde");
    const r = await us.updateOne(filtro, todo ? { $unset: { [`trading.hold.${k}`]: "" } } : { $inc: { [`trading.hold.${k}.q`]: -qty, [`trading.hold.${k}.costo`]: -costoP } });
    if (!r.modifiedCount) { await reservaIngresar(d, valor, "trading", u.id, "Venta cancelada"); return bad("No se pudo vender, intenta de nuevo"); }
    const gan = valor - costoP, imp = await impuestoGanancia(d, Math.round(gan), "Impuesto a ganancias de trading"), neto = valor - imp;
    await pagarA(d, u.id, b.deposito, neto);
    await d.collection("tx").insertOne({ user: u.id, type: "trading", item: `Trading: vendiste ${qty} ${k} a ${$(px)}${imp ? ` (impuesto ${$(imp)})` : ""}`, amount: neto, at: new Date() });
    msg = `Vendiste ${qty} ${k} por ${$(valor)}${imp ? ` · impuesto a la ganancia ${$(imp)}` : ""} · recibes ${$(neto)}`;
  } else return bad("Acción inválida");
  try { await snapshot(d); } catch {}
  const f = await us.findOne({ id: u.id }); return NextResponse.json({ ok: true, msg, metodos: metodosDe(f), hold: f.trading?.hold || {} });
}
