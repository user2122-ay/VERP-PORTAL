import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { pagoKey } from "@/lib/pago";
import { tieneVpn } from "@/lib/vpn";
import { NEGOCIOS, MIN_HERRAMIENTA, ensureNegocios } from "@/lib/negocios";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json(), d = await db(), n0 = NEGOCIOS[b.key]; if (!n0) return bad("Negocio inválido");
  await ensureNegocios(d); const neg = d.collection("negocios"), at = new Date();
  if (b.accion === "comprar") {
    const pk = pagoKey(u, b.pago); if (!pk) return bad("Método de pago inválido");
    if (n0.oculto && !tieneVpn(u)) return bad("Necesitas una VPN para entrar a la Dark Web");
    if (!u.cuentas?.com) return bad("Necesitas la Tarjeta de Comerciante ($50 en el Mercado) para comprar un negocio");
    if (!(await neg.updateOne({ _id: b.key, owner: null }, { $set: { owner: u.id, desde: at } })).modifiedCount) return bad("Este negocio ya tiene dueño");
    if (!(await d.collection("users").updateOne({ id: u.id, [pk]: { $gte: n0.precio } }, { $inc: { [pk]: -n0.precio } })).modifiedCount) { await neg.updateOne({ _id: b.key }, { $set: { owner: null } }); return bad("Saldo insuficiente"); }
    await d.collection("tx").insertOne({ user: u.id, type: "compra", item: `Negocio: ${n0.nombre}`, amount: -n0.precio, at });
    await d.collection("notifs").insertOne({ uid: u.id, title: "Negocio comprado", body: `Ahora eres dueño de ${n0.nombre}. Las ventas llegan a tu Tarjeta de Comerciante.`, at, read: false });
    return NextResponse.json({ ok: true });
  }
  if ((await neg.findOne({ _id: b.key }))?.owner !== u.id) return bad("No eres el dueño de este negocio", 403);
  if (b.accion === "editar") {
    let _id; try { _id = new ObjectId(String(b.id)); } catch { return bad("Artículo inválido"); }
    const it = await d.collection("items").findOne({ _id, negocio: b.key }); if (!it) return bad("Ese artículo no es de tu negocio", 404);
    const price = Number(b.price); if (!Number.isFinite(price) || price < 0) return bad("Precio inválido");
    if (b.key === "toolstore" && price < MIN_HERRAMIENTA) return bad(`El precio mínimo es $${MIN_HERRAMIENTA}`);
    const set = { price }; if (b.key === "concesionario" && b.impuesto !== "" && b.impuesto != null) { const i = Number(b.impuesto); if (!Number.isFinite(i) || i < 0) return bad("Impuesto inválido"); set.impuesto = i; }
    await d.collection("items").updateOne({ _id }, { $set: set }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "planes" && b.key === "movil") {
    const p = (b.planes || []).map(Number); if (p.length !== 3 || p.some((x) => !(x >= 10 && x <= 1000))) return bad("Los 3 planes deben valer entre $10 y $1.000");
    await neg.updateOne({ _id: "movil" }, { $set: { planes: p.sort((x, y) => x - y) } }); return NextResponse.json({ ok: true });
  }
  return bad("Acción inválida");
}
