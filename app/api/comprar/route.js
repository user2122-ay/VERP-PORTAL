import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { pagoKey } from "@/lib/pago";
import { nuevaPlaca, normPlaca } from "@/lib/placa";
import { nombreDe } from "@/lib/rol";
import { COLORES_CASA } from "@/lib/catalogo";
import { acreditarNegocio, NEGOCIOS } from "@/lib/negocios";
import { iva as ivaDe, ingresarTesoreria, tasaITBMS } from "@/lib/tesoreria";
import { licTipo, tieneLic, numeroLicencia } from "@/lib/licencia";
const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return err("Sin sesión", 401);
  const b = await req.json(), pk = pagoKey(u, b.pago); if (!pk) return err("Método de pago inválido");
  let _id; try { _id = new ObjectId(String(b.id)); } catch { return err("No disponible", 404); }
  const d = await db(), items = d.collection("items"), it = await items.findOne({ _id });
  if (!it || it.stock === 0) return err("No disponible", 404);
  const tasa = await tasaITBMS(d), pct = Math.round(tasa * 1000) / 10, lt = licTipo(it), imp = ivaDe(it.price, tasa), total = it.price + imp; // ITBMS ${pct}% sobre el precio

  if (it.category === "Concesionario" && !tieneLic(u, "conducir")) return err("Necesitas la Licencia de Conducir para comprar vehículos", 403);
  if (it.category === "Armas" && !tieneLic(u, "armas")) return err("Necesitas la Licencia de Armas para comprar armas", 403);
  if (lt && tieneLic(u, lt)) return err("Ya tienes esta licencia");
  if (it.stock > 0 && !(await items.updateOne({ _id, stock: { $gt: 0 } }, { $inc: { stock: -1 } })).modifiedCount) return err("Agotado");
  // Vehículos: placa VEN-000 aleatoria y registrada a nombre del comprador. Casas: el comprador elige el color.
  const pl = it.category === "Concesionario" ? await nuevaPlaca(d, { modelo: it.name, dueno: u.id, duenoN: nombreDe(u) }) : null;
  const color = it.category === "Propiedades" ? (COLORES_CASA.includes(b.color) ? b.color : COLORES_CASA[0]) : null;
  const vence = it.dias ? new Date(Date.now() + it.dias * 864e5) : null;
  const r = await d.collection("users").updateOne({ id: u.id, [pk]: { $gte: total }, ...(lt && it.sku ? { inventory: { $not: { $elemMatch: { sku: it.sku } } } } : {}) }, { $inc: { [pk]: -total }, $push: { inventory: { name: it.name, category: it.category, price: it.price, at: new Date(), sku: it.sku || null, tipo: it.tipo || null, ubicacion: it.ubicacion || null, img: it.img || null, placa: pl, color, vence, licNum: lt ? numeroLicencia(lt) : null } } });
  if (!r.modifiedCount) { if (pl) await d.collection("placas").deleteOne({ _id: normPlaca(pl) }); if (it.stock > 0) await items.updateOne({ _id }, { $inc: { stock: 1 } }); return err("Saldo insuficiente"); }
  await d.collection("tx").insertOne({ user: u.id, type: "compra", item: `${it.name} (incluye ITBMS ${pct}%: $${imp.toLocaleString("es")})`, amount: -total, at: new Date() });
  await d.collection("notifs").insertOne({ uid: u.id, title: "Compra realizada", body: `Compraste ${it.name} por $${it.price.toLocaleString("es")} + ITBMS ${pct}% ($${imp.toLocaleString("es")}) = $${total.toLocaleString("es")}.${pl ? ` Placa: ${pl}.` : ""}${color ? ` Color: ${color}.` : ""}`, at: new Date(), read: false });
  // El ITBMS va a la Tesorería. Si el dueño del negocio decidió NO pagarlo, ese 7% se queda con él y queda anotado como evadido.
  const neg = it.negocio ? await d.collection("negocios").findOne({ _id: it.negocio }) : null, remite = !neg?.owner || neg.pagaImpuesto !== false;
  if (remite) await ingresarTesoreria(d, imp, `ITBMS ${pct}%: ${it.name}`, neg?.owner ? NEGOCIOS[it.negocio]?.nombre || it.negocio : "Mercado");
  else await d.collection("negocios").updateOne({ _id: it.negocio }, { $inc: { evadido: imp } });
  await acreditarNegocio(d, it.negocio, it.price + (remite ? 0 : imp), `Venta: ${it.name}${remite ? "" : " (ITBMS no remitido)"}`);
  return NextResponse.json({ ok: true });
}
