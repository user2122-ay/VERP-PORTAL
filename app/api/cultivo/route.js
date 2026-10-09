import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { esRol, nombreDe } from "@/lib/rol";
import { tieneVpn } from "@/lib/vpn";
import { pagoKey } from "@/lib/pago";
import { estaRetenido } from "@/lib/decomiso";
import { casaRef } from "@/lib/mdt";
import { enviarPush } from "@/lib/push";
import { PLANTAS, HORAS_CULTIVO, BOLSAS_PLANTA, POR_KILO, LIM_DIA, PATIO_TIPOS, MAX_PLANTAS_CASA, TRAF, OFERTA_MAX, esSemilla, esBolsa } from "@/lib/cultivo";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const money = (n) => "$" + Number(n).toLocaleString("es"), oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
const avisar = async (d, uid, title, body) => { await d.collection("notifs").insertOne({ uid, title, body, at: new Date(), read: false }); await enviarPush(uid, { title, body, url: "/inventario" }); };
const quitaVacios = (us, id) => us.updateOne({ id }, { $pull: { inventory: { category: "Sustancias", cant: { $lte: 0 } } } });
// Compra de semillas (Delictivo), cultivo en el patio, cosecha, venta al traficante y venta directa entre jugadores.
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  if (u.muerte) return bad("Tu personaje murió", 403);
  const b = await req.json().catch(() => ({})), d = await db(), us = d.collection("users"), inv = u.inventory || [], at = new Date(), a = b.accion;
  const buscar = () => inv.find((i) => i.name === b.name && +new Date(i.at) === +new Date(b.at));
  const delict = async () => (await esRol(u, "delictivo")) && tieneVpn(u);

  if (a === "comprar") {
    if (!(await delict())) return bad("Necesitas el rol delictivo y una VPN activa", 403);
    const p = PLANTAS[b.tipo]; if (!p) return bad("Producto inválido");
    const comp = d.collection("cultivo_compras"); if ((await comp.countDocuments({ uid: u.id, tipo: b.tipo, at: { $gte: new Date(+at - 864e5) } })) >= LIM_DIA) return bad(`Solo puedes comprar ${LIM_DIA} semillas de ${p.nombre} cada 24 horas`);
    const k = pagoKey(u, b.pago); if (!k) return bad("Método de pago inválido");
    if (!(await us.updateOne({ id: u.id, [k]: { $gte: p.precio } }, { $inc: { [k]: -p.precio } })).modifiedCount) return bad("Saldo insuficiente");
    await us.updateOne({ id: u.id }, { $push: { inventory: { name: p.semilla, sku: "semilla-" + b.tipo, category: "Sustancias", planta: b.tipo, price: p.precio, img: p.img, at } } });
    await comp.insertOne({ uid: u.id, tipo: b.tipo, at }); return NextResponse.json({ ok: true });
  }
  if (a === "cultivar") { // la semilla pasa al patio de la casa y empieza a crecer
    const it = buscar(); if (!it || !esSemilla(it)) return bad("Esa semilla no está en tu inventario"); if (it.loc === "casa") return bad("Ya está en una casa"); if (estaRetenido(it)) return bad("Está retenida por la policía", 403);
    const casa = inv.find((i) => i.category === "Propiedades" && casaRef(i.name, i.at) === b.casa); if (!casa) return bad("Elige una de tus casas");
    if (casa.tipo != null && !PATIO_TIPOS.includes(String(casa.tipo))) return bad("Esa casa no tiene patio apto para cultivar");
    if (inv.filter((i) => i.plantada && i.casa === b.casa).length >= MAX_PLANTAS_CASA) return bad(`El patio de esa casa ya tiene ${MAX_PLANTAS_CASA} plantas`);
    const listo = new Date(+at + HORAS_CULTIVO * 36e5);
    const r = await us.updateOne({ id: u.id, inventory: { $elemMatch: { name: it.name, at: it.at, plantada: { $ne: true }, loc: { $ne: "casa" } } } }, { $set: { "inventory.$.plantada": true, "inventory.$.loc": "casa", "inventory.$.casa": b.casa, "inventory.$.lugar": "Patio", "inventory.$.plantadoAt": at, "inventory.$.listoAt": listo } });
    if (!r.modifiedCount) return bad("No se pudo plantar. Intenta de nuevo"); return NextResponse.json({ ok: true, msg: `Plantada. Estará lista en ${HORAS_CULTIVO} horas. Recuerda guardar tus evidencias del rol.` });
  }
  if (a === "cosechar") {
    const it = buscar(); if (!it?.plantada) return bad("Esa planta no existe"); if (+new Date(it.listoAt) > +at) return bad("Todavía no está lista");
    const p = PLANTAS[it.planta]; if (!p) return bad("Planta inválida");
    if (!(await us.updateOne({ id: u.id }, { $pull: { inventory: { name: it.name, at: it.at, plantada: true, listoAt: { $lte: at } } } })).modifiedCount) return bad("No se pudo cosechar");
    await us.updateOne({ id: u.id }, { $push: { inventory: { name: p.bolsas, sku: "bolsa-" + it.planta, category: "Sustancias", sustancia: it.planta, cant: BOLSAS_PLANTA, price: 0, img: p.img, at: new Date(), loc: "casa", casa: it.casa, lugar: "Patio" } } });
    return NextResponse.json({ ok: true, msg: `Cosechaste ${BOLSAS_PLANTA} bolsitas de ${p.nombre}. Están guardadas en el patio de tu casa.` });
  }
  // ——— ventas: solo lo que llevas encima (no lo que está en casa) ———
  const llevo = () => { const it = buscar(); return it && esBolsa(it) && it.loc !== "casa" && !estaRetenido(it) ? it : null; };
  if (a === "oferta") { // el traficante hace una oferta que fluctúa
    if (!(await delict())) return bad("Necesitas el rol delictivo y una VPN activa", 403);
    const it = llevo(); if (!it) return bad("Esa sustancia no está en lo que llevas encima");
    const unidad = b.unidad === "kilo" ? "kilo" : "bolsa", n = Math.floor(+b.cant), need = unidad === "kilo" ? n * POR_KILO : n; if (!(n >= 1)) return bad("Escribe la cantidad"); if (it.cant < need) return bad(`Solo tienes ${it.cant} bolsitas`);
    const base = n * TRAF[unidad], f = TRAF.min + Math.random() * (TRAF.max - TRAF.min), total = Math.max(1, Math.round(base * f)), exp = new Date(+at + TRAF.minutos * 6e4);
    await us.updateOne({ id: u.id }, { $set: { ofertaTraf: { name: it.name, at: it.at, unidad, n, need, base, total, exp } } });
    return NextResponse.json({ ok: true, oferta: { base, total, pct: Math.round(f * 100), exp, unidad, n } });
  }
  if (a === "rechazarOferta") { await us.updateOne({ id: u.id }, { $unset: { ofertaTraf: "" } }); return NextResponse.json({ ok: true }); }
  if (a === "aceptarOferta") {
    if (!(await delict())) return bad("Necesitas el rol delictivo y una VPN activa", 403);
    const o = u.ofertaTraf; if (!o || +new Date(o.exp) < +at) return bad("La oferta del traficante venció. Pide otra");
    const r = await us.updateOne({ id: u.id, "ofertaTraf.total": o.total, inventory: { $elemMatch: { name: o.name, at: o.at, cant: { $gte: o.need }, loc: { $ne: "casa" } } } }, { $inc: { "inventory.$.cant": -o.need, balance: o.total }, $unset: { ofertaTraf: "" } });
    if (!r.modifiedCount) return bad("Ya no tienes esa cantidad"); await quitaVacios(us, u.id);
    return NextResponse.json({ ok: true, msg: `El traficante te pagó ${money(o.total)} en efectivo.` });
  }
  if (a === "ofrecer") { // venta directa a un jugador con precio acordado
    if (!(await delict())) return bad("Necesitas el rol delictivo y una VPN activa", 403);
    const it = llevo(); if (!it) return bad("Esa sustancia no está en lo que llevas encima");
    const n = Math.floor(+b.cant), precio = Math.floor(+b.precio); if (!(n >= 1) || it.cant < n) return bad("Cantidad inválida"); if (!(precio >= 1) || precio > OFERTA_MAX) return bad(`El precio debe estar entre $1 y ${money(OFERTA_MAX)}`);
    const t = await us.findOne({ id: String(b.to), cedula: { $exists: true } }); if (!t || t.id === u.id) return bad("Elige a otro ciudadano");
    const c = d.collection("ventas_sus"); if (await c.countDocuments({ de: u.id, para: t.id, estado: "pendiente" })) return bad("Ya tienes una oferta pendiente con esa persona");
    await c.insertOne({ de: u.id, deN: nombreDe(u), para: t.id, paraN: nombreDe(t), name: it.name, sustancia: it.sustancia, img: it.img || "", itemAt: it.at, n, precio, estado: "pendiente", at });
    await avisar(d, t.id, "Te ofrecen una venta", `${nombreDe(u)} te ofrece ${n} bolsitas (${it.name}) por ${money(precio)}. Míralo en Inventario para aceptar o rechazar.`); return NextResponse.json({ ok: true });
  }
  if (a === "cancelar") { const id = oid(b.id); if (!id || !(await d.collection("ventas_sus").updateOne({ _id: id, de: u.id, estado: "pendiente" }, { $set: { estado: "cancelada" } })).modifiedCount) return bad("No disponible", 404); return NextResponse.json({ ok: true }); }
  if (a === "responder") { // el comprador acepta (paga en efectivo) o rechaza
    const id = oid(b.id), c = d.collection("ventas_sus"), v = id && (await c.findOneAndUpdate({ _id: id, para: u.id, estado: "pendiente" }, { $set: { estado: "cerrando" } })); if (!v) return bad("Oferta no disponible", 404);
    if (!b.ok) { await c.updateOne({ _id: id }, { $set: { estado: "rechazada", resuelto: at } }); await avisar(d, v.de, "Venta rechazada", `${nombreDe(u)} rechazó tu oferta.`); return NextResponse.json({ ok: true }); }
    if (!(await us.updateOne({ id: u.id, balance: { $gte: v.precio } }, { $inc: { balance: -v.precio } })).modifiedCount) { await c.updateOne({ _id: id }, { $set: { estado: "pendiente" } }); return bad(`No tienes ${money(v.precio)} en efectivo`); }
    const r = await us.updateOne({ id: v.de, inventory: { $elemMatch: { name: v.name, at: v.itemAt, cant: { $gte: v.n }, loc: { $ne: "casa" } } } }, { $inc: { "inventory.$.cant": -v.n, balance: v.precio } });
    if (!r.modifiedCount) { await us.updateOne({ id: u.id }, { $inc: { balance: v.precio } }); await c.updateOne({ _id: id }, { $set: { estado: "fallida", resuelto: at } }); return bad("El vendedor ya no tiene esa mercancía"); }
    await quitaVacios(us, v.de); const p = PLANTAS[v.sustancia];
    await us.updateOne({ id: u.id }, { $push: { inventory: { name: v.name, sku: "bolsa-" + v.sustancia, category: "Sustancias", sustancia: v.sustancia, cant: v.n, price: 0, img: p?.img || v.img, at: new Date() } } });
    await c.updateOne({ _id: id }, { $set: { estado: "aceptada", resuelto: at } }); await avisar(d, v.de, "Venta completada", `${nombreDe(u)} te pagó ${money(v.precio)} por ${v.n} bolsitas.`);
    return NextResponse.json({ ok: true, msg: `Compraste ${v.n} bolsitas por ${money(v.precio)}.` });
  }
  return bad("Acción inválida");
}
