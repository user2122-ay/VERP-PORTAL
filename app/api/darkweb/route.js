import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { pagoKey } from "@/lib/pago";
import { creditarCom } from "@/lib/negocios";
import { esRol, nombreDe } from "@/lib/rol";
import { nuevaPlaca, traspasarPlaca } from "@/lib/placa";
import { tieneVpn } from "@/lib/vpn";
import { factorHoy } from "@/lib/mnegro";
import { enviarPush } from "@/lib/push";
import { estaRetenido } from "@/lib/decomiso";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const vpn = tieneVpn;
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
const money = (n) => "$" + Number(n).toLocaleString("es");
const tallerDe = async (d) => (await d.collection("negocios").findOne({ _id: "taller" }))?.owner || null;
// Saca un auto del inventario (queda en depósito dentro de la publicación). Devuelve el auto o null.
async function sacar(d, u, b) {
  let it = (u.inventory || [])[+b.i];
  if (!it || it.name !== b.name || +new Date(it.at) !== +new Date(b.at) || it.category !== "Concesionario" || it.loc === "casa" || estaRetenido(it)) return null; // un auto guardado en el garaje no se puede vender
  const r = await d.collection("users").updateOne({ id: u.id }, { $pull: { inventory: { name: it.name, at: it.at } } }); if (!r.modifiedCount) return null;
  if (!it.placa) it = { ...it, placa: await nuevaPlaca(d, { modelo: it.name, dueno: u.id, duenoN: nombreDe(u) }) }; // autos viejos sin placa
  return it;
}
// Paga al vendedor en la cuenta que eligió (efectivo o tarjeta). Si ya no la tiene, va a efectivo.
async function pagarA(d, uid, pago, monto) {
  const us = d.collection("users"), k = pago === "efectivo" ? "balance" : `cuentas.${pago}.saldo`;
  const f = pago === "efectivo" ? { id: uid } : { id: uid, [`cuentas.${pago}`]: { $exists: true } };
  if (!(await us.updateOne(f, { $inc: { [k]: monto } })).modifiedCount) await us.updateOne({ id: uid }, { $inc: { balance: monto } });
}
const avisar = async (d, uid, title, body) => { await d.collection("notifs").insertOne({ uid, title, body, at: new Date(), read: false }); await enviarPush(uid, { title, body, url: "/darkweb" }); };
const entrega = (car, extra = {}) => ({ ...car, at: new Date(), robado: true, placa: car.placa || null, ...extra });

export async function GET(req) {
  const u = await apiUser(); if (!u?.cedula || !vpn(u)) return bad("Necesitas una VPN", 403);
  const id = oid(new URL(req.url).searchParams.get("id")); if (!id) return bad("Publicación inválida");
  const l = await (await db()).collection("dw").findOne({ _id: id, $or: [{ seller: u.id }, { buyer: u.id }] }); if (!l) return bad("No participas en esta negociación", 403);
  return NextResponse.json({ l: { id: String(l._id), estado: l.estado, precio: l.precio, propuesta: l.propuesta, car: l.car.name, chat: l.chat, soyVendedor: l.seller === u.id } });
}

export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401); if (!vpn(u)) return bad("Necesitas una VPN", 403);
  const b = await req.json(), d = await db(), col = d.collection("dw"), us = d.collection("users"), at = new Date(), yo = nombreDe(u);
  const mine = (id) => ({ _id: id, $or: [{ seller: u.id }, { buyer: u.id }] });
  switch (b.accion) {
    case "publicar": {
      if (!(await esRol(u, "delictivo"))) return bad("Necesitas el rol delictivo", 403);
      const precio = Math.floor(Number(b.precio)); if (!(precio >= 1 && precio <= 15000)) return bad("El precio inicial debe estar entre $1 y $15.000");
      if (!pagoKey(u, b.pago)) return bad("Cuenta de cobro inválida");
      const car = await sacar(d, u, b); if (!car) return bad("Ese vehículo ya no está en tu inventario");
      const dueño = await tallerDe(d), base = { tipo: "oferta", seller: u.id, sellerName: yo, car, precio, pago: b.pago, chat: [], at };
      if (!dueño || dueño === u.id) { // sin taller con dueño: aceptación automática
        const mn = await factorHoy(d), cobro = Math.round(precio * mn.factor);
        await traspasarPlaca(d, car.placa); await pagarA(d, u.id, b.pago, cobro); await col.insertOne({ ...base, estado: "vendida", vendido: cobro });
        await d.collection("tx").insertOne({ user: u.id, type: "venta", item: `Auto vendido (Dark Web): ${car.name}`, amount: cobro, at });
        await avisar(d, u.id, "Auto vendido", `Cotización: ${mn.mood} (x${mn.factor}): +${money(cobro)} por ${car.name}.`);
        return NextResponse.json({ ok: true, auto: true, cobro });
      }
      await col.insertOne({ ...base, estado: "abierta", buyer: dueño, propuesta: { by: u.id, monto: precio } });
      await avisar(d, dueño, "Nueva oferta en tu taller", `${yo} ofrece ${car.name} por ${money(precio)}. Entra a la Dark Web para negociar.`);
      return NextResponse.json({ ok: true });
    }
    case "ofrecer": {
      const id = oid(b.id), monto = Math.floor(Number(b.monto)); if (!id || !(monto >= 1 && monto <= 50000000)) return bad("Monto inválido");
      const l = await col.findOneAndUpdate({ ...mine(id), tipo: "oferta", estado: "abierta" }, { $set: { precio: monto, propuesta: { by: u.id, monto } }, $push: { chat: { sys: true, txt: `${yo} ofrece ${money(monto)}`, at } } });
      if (!l) return bad("Negociación no disponible", 404); await avisar(d, l.seller === u.id ? l.buyer : l.seller, "Nueva contraoferta", `${yo} ofrece ${money(monto)} por ${l.car.name}.`);
      return NextResponse.json({ ok: true });
    }
    case "msg": {
      const id = oid(b.id), txt = String(b.txt || "").trim().slice(0, 300); if (!id || !txt) return bad("Mensaje vacío");
      if (!(await col.updateOne({ ...mine(id), estado: "abierta" }, { $push: { chat: { by: u.id, name: yo, txt, at } } })).modifiedCount) return bad("Negociación no disponible", 404);
      return NextResponse.json({ ok: true });
    }
    case "aceptar": { // acepta la última propuesta de la OTRA parte
      const id = oid(b.id); if (!id) return bad("Publicación inválida");
      const l = await col.findOneAndUpdate({ ...mine(id), tipo: "oferta", estado: "abierta", "propuesta.by": { $ne: u.id } }, { $set: { estado: "cerrando" } });
      if (!l) return bad("No hay una propuesta de la otra parte para aceptar"); const m = l.propuesta.monto;
      if (!(await us.updateOne({ id: l.buyer, "cuentas.com.saldo": { $gte: m } }, { $inc: { "cuentas.com.saldo": -m } })).modifiedCount) { await col.updateOne({ _id: id }, { $set: { estado: "abierta" } }); return bad("El taller no tiene saldo suficiente en su Tarjeta de Comerciante"); }
      await traspasarPlaca(d, l.car.placa); await pagarA(d, l.seller, l.pago, m); await us.updateOne({ id: l.buyer }, { $push: { inventory: entrega(l.car, { price: m }) } });
      await d.collection("negocios").updateOne({ _id: "taller" }, { $inc: { perdido: m } }); await col.updateOne({ _id: id }, { $set: { estado: "vendida", vendido: m }, $push: { chat: { sys: true, txt: `Trato cerrado por ${money(m)}`, at } } });
      await d.collection("tx").insertMany([{ user: l.seller, type: "venta", item: `Auto vendido (Dark Web): ${l.car.name}`, amount: m, at }, { user: l.buyer, type: "compra", item: `Auto comprado (Taller): ${l.car.name}`, amount: -m, at }]);
      await avisar(d, l.seller, "Trato cerrado", `Vendiste ${l.car.name} por ${money(m)}.`); await avisar(d, l.buyer, "Trato cerrado", `Compraste ${l.car.name} por ${money(m)}. Ya está en tu inventario.`);
      return NextResponse.json({ ok: true });
    }
    case "cancelar": {
      const id = oid(b.id), l = id && (await col.findOneAndUpdate({ _id: id, seller: u.id, estado: "abierta" }, { $set: { estado: "cancelada" } })); if (!l) return bad("No se puede cancelar", 404);
      await us.updateOne({ id: u.id }, { $push: { inventory: { ...l.car, at: new Date() } } }); return NextResponse.json({ ok: true });
    }
    case "reventa": { // el dueño del taller pone a la venta un auto de su inventario
      return bad("Esta opción ya no está disponible", 403);
      const precio = Math.floor(Number(b.precio)); if (!(precio >= 1 && precio <= 50000000)) return bad("Precio inválido");
      const car = await sacar(d, u, b); if (!car) return bad("Ese vehículo ya no está en tu inventario");
      await col.insertOne({ tipo: "reventa", seller: u.id, sellerName: yo, car, precio, estado: "abierta", chat: [], at }); return NextResponse.json({ ok: true });
    }
    case "ventaSistema": { // el dueño del taller vende un auto robado a la plataforma: máximo $15.000 y como mucho $1.000 más de lo que pagó
      if ((await tallerDe(d)) !== u.id) return bad("Solo el dueño del Taller clandestino puede vender a la plataforma", 403);
      const it = (u.inventory || [])[+b.i]; if (!it || it.category !== "Concesionario" || !it.robado || it.loc === "casa") return bad("Elige un auto robado que lleves encima (no en el garaje)");
      const pagado = Math.max(0, Number(it.price) || 0), tope = Math.min(15000, pagado + 1000), precio = Math.floor(Number(b.precio));
      if (!(precio >= 1)) return bad("Precio inválido"); if (precio > tope) return bad(`Máximo ${money(tope)}: lo compraste en ${money(pagado)} y solo puedes ganar $1.000 (tope $15.000)`);
      if (!pagoKey(u, b.pago)) return bad("Cuenta de cobro inválida");
      const car = await sacar(d, u, b); if (!car) return bad("Ese vehículo ya no está en tu inventario");
      const mn = await factorHoy(d), cobro = Math.round(precio * mn.factor);
      await traspasarPlaca(d, car.placa); await pagarA(d, u.id, b.pago, cobro); await d.collection("negocios").updateOne({ _id: "taller" }, { $inc: { ganado: cobro, ventas: 1 } });
      await col.insertOne({ tipo: "sistema", seller: u.id, sellerName: yo, car, precio, estado: "vendida", vendido: cobro, comprado: pagado, chat: [], at });
      await d.collection("tx").insertOne({ user: u.id, type: "venta", item: `Auto vendido a la plataforma (Dark Web): ${car.name}`, amount: cobro, at });
      await avisar(d, u.id, "Auto vendido a la plataforma", `Vendiste ${car.name} por ${money(cobro)} (cotización ${mn.mood}, x${mn.factor}; lo compraste en ${money(pagado)}).`);
      return NextResponse.json({ ok: true, precio: cobro });
    }
    case "comprar": { // compra de un auto puesto a la venta por el taller
      const id = oid(b.id), pk = pagoKey(u, b.pago); if (!id) return bad("Publicación inválida"); if (!pk) return bad("Método de pago inválido");
      const l = await col.findOneAndUpdate({ _id: id, tipo: "reventa", estado: "abierta", seller: { $ne: u.id } }, { $set: { estado: "cerrando" } }); if (!l) return bad("Ya no está disponible", 404);
      if (!(await us.updateOne({ id: u.id, [pk]: { $gte: l.precio } }, { $inc: { [pk]: -l.precio } })).modifiedCount) { await col.updateOne({ _id: id }, { $set: { estado: "abierta" } }); return bad("Saldo insuficiente"); }
      if (!(await creditarCom(d, l.seller, l.precio, `Venta: ${l.car.name}`))) await us.updateOne({ id: l.seller }, { $inc: { balance: l.precio } });
      await us.updateOne({ id: u.id }, { $push: { inventory: entrega(l.car, { price: l.precio }) } }); await col.updateOne({ _id: id }, { $set: { estado: "vendida", vendido: l.precio, comprador: u.id } });
      await d.collection("tx").insertOne({ user: u.id, type: "compra", item: `Auto (Taller clandestino): ${l.car.name}`, amount: -l.precio, at }); return NextResponse.json({ ok: true });
    }
  }
  return bad("Acción inválida");
}
