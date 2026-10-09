import { comprarPendientes } from "@/lib/dwauto";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { pagoKey } from "@/lib/pago";
import { tieneVpn } from "@/lib/vpn";
import { NEGOCIOS, MIN_HERRAMIENTA, MAX_NEGOCIOS, esComidaNeg, ensureNegocios } from "@/lib/negocios";
import { PRECIO_MAX } from "@/lib/comida";
import { ingresarTesoreria } from "@/lib/tesoreria";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json(), d = await db(), n0 = NEGOCIOS[b.key]; if (!n0) return bad("Negocio inválido");
  await ensureNegocios(d); const neg = d.collection("negocios"), at = new Date();
  if (b.accion === "comprar") {
    const pk = pagoKey(u, b.pago); if (!pk) return bad("Método de pago inválido");
    if (n0.oculto && !tieneVpn(u)) return bad("Necesitas una VPN para entrar a la Dark Web");
    if ((await neg.countDocuments({ owner: u.id })) >= MAX_NEGOCIOS) return bad(`Solo puedes tener ${MAX_NEGOCIOS} negocios por persona`);
    const v0 = await neg.findOne({ _id: b.key }); if (v0?.vetado?.uid === u.id && +new Date(v0.vetado.hasta) > Date.now()) return bad(`Devolviste este negocio: no puedes volver a comprarlo hasta el ${new Date(v0.vetado.hasta).toLocaleDateString("es")}`);
    if (!u.cuentas?.com) return bad("Necesitas la Tarjeta de Comerciante ($50 en el Mercado) para comprar un negocio");
    if (!(await neg.updateOne({ _id: b.key, owner: null }, { $set: { owner: u.id, desde: at, inversion: n0.precio, ganado: 0, ventas: 0, perdido: n0.precio, evadido: 0, impuestoPagado: 0, estado: "normal", pagaImpuesto: true }, $unset: { morosoDesde: "", clausuradoAt: "", clausuraRazon: "", multaPagadaAt: "" } })).modifiedCount) return bad("Este negocio ya tiene dueño");
    if (!(await d.collection("users").updateOne({ id: u.id, [pk]: { $gte: n0.precio } }, { $inc: { [pk]: -n0.precio } })).modifiedCount) { await neg.updateOne({ _id: b.key }, { $set: { owner: null } }); return bad("Saldo insuficiente"); }
    await d.collection("tx").insertOne({ user: u.id, type: "compra", item: `Negocio: ${n0.nombre}`, amount: -n0.precio, at });
    await d.collection("notifs").insertOne({ uid: u.id, title: "Negocio comprado", body: `Ahora eres dueño de ${n0.nombre}. Las ventas llegan a tu Tarjeta de Comerciante.`, at, read: false });
    return NextResponse.json({ ok: true });
  }
  const nd = await neg.findOne({ _id: b.key }); if (nd?.owner !== u.id) return bad("No eres el dueño de este negocio", 403);
  if (b.accion === "pagarClausura") { // paga la multa que puso el Ministro desde aquí mismo y el negocio se reabre
    if (nd.estado !== "clausurado") return bad("Tu negocio no está clausurado"); const m = Math.floor(Number(nd.clausuraMulta)); if (!(m >= 1)) return bad("Esta clausura no tiene multa: usa el botón de reabrir o ve a la Policía");
    const pk = pagoKey(u, b.pago); if (!pk) return bad("Método de pago inválido");
    if (!(await d.collection("users").updateOne({ id: u.id, [pk]: { $gte: m } }, { $inc: { [pk]: -m } })).modifiedCount) return bad("No te alcanza el saldo para pagar la multa");
    if (!(await neg.updateOne({ _id: b.key, owner: u.id, estado: "clausurado" }, { $set: { estado: "normal", pagaImpuesto: true, reabiertoAt: at }, $unset: { morosoDesde: "", clausuradoAt: "", clausuraRazon: "", clausuraMulta: "", multaPagadaAt: "" } })).modifiedCount) { await d.collection("users").updateOne({ id: u.id }, { $inc: { [pk]: m } }); return bad("No se pudo reabrir, no se cobró nada"); }
    await ingresarTesoreria(d, m, `Multa de clausura: ${n0.nombre}`, "Clausura");
    await d.collection("tx").insertOne({ user: u.id, type: "multa", item: `Multa de clausura: ${n0.nombre}`, amount: -m, at });
    await d.collection("notifs").insertOne({ uid: u.id, title: "Negocio reabierto", body: `Pagaste la multa de $${m.toLocaleString("es")} y ${n0.nombre} volvió a abrir. Ya puedes vender.`, at, read: false }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "reabrir") { // negocio clausurado: se reabre si pagaste la multa que te puso la Policía después de la clausura
    if (nd.estado !== "clausurado") return bad("Tu negocio no está clausurado");
    if (nd.clausuraMulta) return bad("Paga la multa de reapertura desde este panel");
    if (!nd.multaPagadaAt || +new Date(nd.multaPagadaAt) < +new Date(nd.clausuradoAt || 0)) return bad("Primero ve a la Policía: debes pagar la multa de reapertura (Inventario → Multas)");
    await neg.updateOne({ _id: b.key }, { $set: { estado: "normal", pagaImpuesto: true, reabiertoAt: at }, $unset: { morosoDesde: "", clausuradoAt: "", clausuraRazon: "" } });
    await d.collection("notifs").insertOne({ uid: u.id, title: "Negocio reabierto", body: `${n0.nombre} volvió a abrir. Ya puedes vender.`, at, read: false }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "abandonar") { // dejar el negocio clausurado: queda libre para que otro lo compre
    if (nd.estado !== "clausurado") return bad("Solo puedes dejar un negocio que esté clausurado");
    await neg.updateOne({ _id: b.key }, { $set: { owner: null, estado: "normal", pagaImpuesto: true }, $unset: { morosoDesde: "", clausuradoAt: "", clausuraRazon: "", multaPagadaAt: "", desde: "" } });
    await d.collection("notifs").insertOne({ uid: u.id, title: "Dejaste el negocio", body: `Ya no eres dueño de ${n0.nombre}.`, at, read: false }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "devolver") { // el dueño devuelve el negocio al sistema: se le reembolsa el precio inicial y no puede recomprarlo en 15 días
    if ((nd.estado || "normal") !== "normal") return bad("Un negocio moroso o clausurado no se puede devolver: regularízalo primero");
    const monto = Math.max(0, Math.floor(nd.inversion ?? n0.precio)), hasta = new Date(Date.now() + 15 * 864e5);
    if (!(await neg.updateOne({ _id: b.key, owner: u.id }, { $set: { owner: null, estado: "normal", pagaImpuesto: true, vetado: { uid: u.id, hasta } }, $unset: { desde: "", morosoDesde: "", clausuradoAt: "", clausuraRazon: "", multaPagadaAt: "" } })).modifiedCount) return bad("No se pudo devolver");
    const conCom = (await d.collection("users").updateOne({ id: u.id, "cuentas.com": { $exists: true } }, { $inc: { "cuentas.com.saldo": monto } })).modifiedCount;
    if (!conCom) await d.collection("users").updateOne({ id: u.id }, { $inc: { balance: monto } });
    await d.collection("tx").insertOne({ user: u.id, type: "venta", item: `Negocio devuelto al sistema: ${n0.nombre}`, amount: monto, at });
    await d.collection("notifs").insertOne({ uid: u.id, title: "Negocio devuelto", body: `Devolviste ${n0.nombre}: recibiste $${monto.toLocaleString("es")} en ${conCom ? "tu Tarjeta de Comerciante" : "efectivo"}. No podrás volver a comprarlo hasta el ${hasta.toLocaleDateString("es")}. Queda a la venta en el Mercado.`, at, read: false });
    if (b.key === "taller") await comprarPendientes(d);
    return NextResponse.json({ ok: true });
  }
  if (nd.estado === "clausurado") return bad("Tu negocio está clausurado: no puedes administrarlo hasta reabrirlo", 403);
  if (b.accion === "editar") {
    let _id; try { _id = new ObjectId(String(b.id)); } catch { return bad("Artículo inválido"); }
    const it = await d.collection("items").findOne({ _id, negocio: b.key }); if (!it) return bad("Ese artículo no es de tu negocio", 404);
    const price = Number(b.price); if (!Number.isFinite(price) || price < 0) return bad("Precio inválido");
    if (it.category === "Comida y bebida" && price > PRECIO_MAX) return bad(`El precio máximo de una comida o bebida es $${PRECIO_MAX}`);
    if (b.key === "toolstore" && price < MIN_HERRAMIENTA) return bad(`El precio mínimo es $${MIN_HERRAMIENTA}`);
    const set = { price }; if (b.key === "concesionario" && b.impuesto !== "" && b.impuesto != null) { const i = Number(b.impuesto); if (!Number.isFinite(i) || i < 0) return bad("Impuesto inválido"); set.impuesto = i; }
    await d.collection("items").updateOne({ _id }, { $set: set }); return NextResponse.json({ ok: true });
  }
  if (b.accion === "impuesto") { // el dueño decide si paga o no el ITBMS de lo que vende
    if (b.key === "taller") return bad("El mercado negro no paga impuestos"); if (esComidaNeg(b.key)) return bad("Las comidas y bebidas no llevan impuestos");
    const paga = b.paga === true;
    if (paga && nd.estado === "moroso") return bad("Tu negocio está moroso. Para regularizarte ve a la Policía y paga la multa; después el Ministro del Interior decide si queda limpio o lo clausura", 403);
    await neg.updateOne({ _id: b.key }, paga ? { $set: { pagaImpuesto: true, estado: "normal" } } : { $set: { pagaImpuesto: false, estado: "moroso", morosoDesde: nd.morosoDesde || at } });
    if (!paga) await d.collection("notifs").insertOne({ uid: u.id, title: "Negocio moroso", body: `${n0.nombre} dejó de pagar impuestos y quedó MOROSO. Para pagar debes ir a la Policía.`, at, read: false });
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "planes" && b.key === "movil") {
    const p = (b.planes || []).map(Number); if (p.length !== 3 || p.some((x) => !(x >= 10 && x <= 1000))) return bad("Los 3 planes deben valer entre $10 y $1.000");
    await neg.updateOne({ _id: "movil" }, { $set: { planes: p.sort((x, y) => x - y) } }); return NextResponse.json({ ok: true });
  }
  return bad("Acción inválida");
}
