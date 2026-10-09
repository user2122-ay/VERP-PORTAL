import { traspasarPlaca } from "./placa";
import { factorHoy } from "./mnegro";
import { enviarPush } from "./push";
// Si el Taller clandestino no tiene dueño, la plataforma compra sola las ofertas que quedaron abiertas (a la cotización vigente).
export async function comprarPendientes(d) {
  if ((await d.collection("negocios").findOne({ _id: "taller" }))?.owner) return 0;
  const col = d.collection("dw"), l = await col.find({ tipo: "oferta", estado: "abierta" }).limit(50).toArray(); if (!l.length) return 0;
  const mn = await factorHoy(d), us = d.collection("users"), at = new Date(); let n = 0;
  for (const o of l) {
    if (!(await col.updateOne({ _id: o._id, estado: "abierta" }, { $set: { estado: "vendida" } })).modifiedCount) continue;
    const base = Math.min(15000, Math.max(1, Math.floor(o.propuesta?.monto || o.precio))), cobro = Math.round(base * mn.factor);
    await traspasarPlaca(d, o.car?.placa);
    const k = o.pago === "efectivo" ? "balance" : `cuentas.${o.pago}.saldo`, f = o.pago === "efectivo" ? { id: o.seller } : { id: o.seller, [`cuentas.${o.pago}`]: { $exists: true } };
    if (!(await us.updateOne(f, { $inc: { [k]: cobro } })).modifiedCount) await us.updateOne({ id: o.seller }, { $inc: { balance: cobro } });
    await col.updateOne({ _id: o._id }, { $set: { vendido: cobro } });
    await d.collection("tx").insertOne({ user: o.seller, type: "venta", item: `Auto vendido (Dark Web): ${o.car?.name}`, amount: cobro, at });
    const body = `El Taller clandestino no tiene dueño: la plataforma compró ${o.car?.name} por $${cobro.toLocaleString("es")} (cotización x${mn.factor}).`;
    await d.collection("notifs").insertOne({ uid: o.seller, title: "Auto vendido", body, at, read: false }); await enviarPush(o.seller, { title: "Auto vendido", body, url: "/darkweb" }); n++;
  }
  return n;
}
