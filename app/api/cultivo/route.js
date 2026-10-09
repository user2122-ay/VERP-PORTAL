import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { esRol } from "@/lib/rol";
import { tieneVpn } from "@/lib/vpn";
import { pagoKey, pagarA } from "@/lib/pago";
import { factorHoy } from "@/lib/mnegro";
import { estaRetenido } from "@/lib/decomiso";
import { casaRef } from "@/lib/mdt";
import { PLANTAS, MIN_CULTIVO, duracionCultivo, BOLSAS_PLANTA, POR_KILO, LIM_DIA, PATIO_TIPOS, MAX_PLANTAS_CASA, TRAF, esSemilla, esBolsa } from "@/lib/cultivo";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const money = (n) => "$" + Number(n).toLocaleString("es");
const quitaVacios = (us, id) => us.updateOne({ id }, { $pull: { inventory: { category: "Sustancias", cant: { $lte: 0 } } } });
// Compra de semillas (Dark Web), cultivo en el patio, cosecha y venta a la plataforma (Dark Web).
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
    const listo = new Date(+at + MIN_CULTIVO * 6e4);
    const r = await us.updateOne({ id: u.id, inventory: { $elemMatch: { name: it.name, at: it.at, plantada: { $ne: true }, loc: { $ne: "casa" } } } }, { $set: { "inventory.$.plantada": true, "inventory.$.loc": "casa", "inventory.$.casa": b.casa, "inventory.$.lugar": "Patio", "inventory.$.plantadoAt": at, "inventory.$.listoAt": listo } });
    if (!r.modifiedCount) return bad("No se pudo plantar. Intenta de nuevo"); return NextResponse.json({ ok: true, msg: `Plantada. Estará lista en ${duracionCultivo()}. Recuerda guardar tus evidencias del rol.` });
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
  if (a === "vender") { // venta en la Dark Web: la plataforma compra al precio vigente (mismo mercado que los autos: x0.60 a x1.40, cambia cada 2 horas). El dinero sale de la nada
    if (!(await delict())) return bad("Necesitas el rol delictivo y una VPN activa", 403);
    const it = llevo(); if (!it) return bad("Esa sustancia no está en lo que llevas encima (lo que está en casa hay que sacarlo primero)");
    const unidad = b.unidad === "kilo" ? "kilo" : "bolsa", n = Math.floor(+b.cant), need = unidad === "kilo" ? n * POR_KILO : n; if (!(n >= 1)) return bad("Escribe la cantidad"); if (it.cant < need) return bad(`Solo tienes ${it.cant} bolsitas`);
    const mn = await factorHoy(d), total = Math.max(1, Math.round(n * TRAF[unidad] * mn.factor));
    if (!(await us.updateOne({ id: u.id, inventory: { $elemMatch: { name: it.name, at: it.at, cant: { $gte: need }, loc: { $ne: "casa" } } } }, { $inc: { "inventory.$.cant": -need } })).modifiedCount) return bad("Ya no tienes esa cantidad");
    await quitaVacios(us, u.id); await pagarA(d, u.id, b.pago, total);
    await d.collection("tx").insertOne({ user: u.id, type: "venta", item: `Sustancias vendidas (Dark Web): ${need} bolsitas`, amount: total, at });
    return NextResponse.json({ ok: true, msg: `La plataforma te pagó ${money(total)} (cotización x${mn.factor}).` });
  }
  return bad("Acción inválida");
}
