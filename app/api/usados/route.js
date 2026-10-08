import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { pagoKey, pagarA } from "@/lib/pago";
import { nombreDe } from "@/lib/rol";
import { tieneLic } from "@/lib/licencia";
import { esUnico, yaTiene } from "@/lib/catalogo";
import { revendible, MAX_PUBLICADOS } from "@/lib/usados";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json().catch(() => ({})), d = await db(), col = d.collection("usados"), us = d.collection("users"), at = new Date(), yo = nombreDe(u);
  if (b.accion === "publicar") { // el artículo sale del inventario y queda en la publicación hasta que se venda o lo cancele
    const it = (u.inventory || []).find((i) => i.name === b.name && +new Date(i.at) === +new Date(b.at)); if (!it) return bad("Ese objeto no está en tu inventario");
    if (!revendible(it)) return bad("Ese objeto no se puede revender (autos, casas, licencias, accesos con duración, robados, retenidos o guardados en casa)");
    const precio = Math.floor(Number(b.precio)), pagado = Number(it.price) || 0; if (!(precio >= 1)) return bad("Escribe el precio de venta");
    if (precio >= pagado) return bad(`Tiene que ser más barato que lo que pagaste ($${pagado.toLocaleString("es")})`);
    if (b.pago !== "efectivo" && !u.cuentas?.[b.pago]) return bad("Elige dónde quieres cobrar");
    if ((await col.countDocuments({ seller: u.id, estado: "abierta" })) >= MAX_PUBLICADOS) return bad(`Máximo ${MAX_PUBLICADOS} publicaciones abiertas`);
    if (!(await us.updateOne({ id: u.id }, { $pull: { inventory: { name: it.name, at: it.at } } })).modifiedCount) return bad("No se pudo publicar", 409);
    await col.insertOne({ seller: u.id, sellerName: yo, item: it, precio, pagado, pago: b.pago, estado: "abierta", at }); return NextResponse.json({ ok: true });
  }
  const id = oid(b.id); if (!id) return bad("Publicación inválida", 404);
  if (b.accion === "cancelar") {
    const l = await col.findOneAndUpdate({ _id: id, seller: u.id, estado: "abierta" }, { $set: { estado: "cancelada" } }); if (!l) return bad("No se puede cancelar", 404);
    await us.updateOne({ id: u.id }, { $push: { inventory: l.item } }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "comprar") {
    const pk = pagoKey(u, b.pago); if (!pk) return bad("Método de pago inválido");
    const l = await col.findOneAndUpdate({ _id: id, estado: "abierta", seller: { $ne: u.id } }, { $set: { estado: "cerrando" } }); if (!l) return bad("Ya no está disponible", 404);
    const volver = (m) => col.updateOne({ _id: id }, { $set: { estado: "abierta" } }).then(() => bad(m));
    if (l.item.category === "Armas" && !tieneLic(u, "armas")) return volver("Necesitas la Licencia de Armas para comprar armas");
    if (esUnico(l.item) && yaTiene(u, l.item)) return volver("Ya tienes este objeto: solo se puede tener uno");
    if (!(await us.updateOne({ id: u.id, [pk]: { $gte: l.precio } }, { $inc: { [pk]: -l.precio } })).modifiedCount) return volver("Saldo insuficiente");
    await pagarA(d, l.seller, l.pago, l.precio);
    const nuevo = { ...l.item, at: new Date(), price: l.precio, usado: true }; delete nuevo.loc; delete nuevo.casa; delete nuevo.lugar; delete nuevo.retenido;
    await us.updateOne({ id: u.id }, { $push: { inventory: nuevo } });
    await col.updateOne({ _id: id }, { $set: { estado: "vendida", comprador: u.id, vendidoAt: at } });
    await d.collection("tx").insertMany([{ user: u.id, type: "compra", item: `Segunda mano: ${l.item.name}`, amount: -l.precio, at }, { user: l.seller, type: "venta", item: `Reventa: ${l.item.name}`, amount: l.precio, at }]);
    await d.collection("notifs").insertMany([{ uid: u.id, title: "Compra de segunda mano", body: `Compraste ${l.item.name} por $${l.precio.toLocaleString("es")}.`, at, read: false }, { uid: l.seller, title: "Vendiste un artículo", body: `${yo} compró tu ${l.item.name} por $${l.precio.toLocaleString("es")}.`, at, read: false }]);
    return NextResponse.json({ ok: true });
  }
  return bad("Acción inválida");
}
