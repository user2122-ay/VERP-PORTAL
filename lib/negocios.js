import { db } from "./db";
// Negocios que se pueden comprar (necesitan Tarjeta de Comerciante). Cambia aquí precios, nombres y fotos.
export const NEGOCIOS = {
  concesionario: { nombre: "Concesionario", img: "/negocios/concesionario.jpg", precio: 3000000, edita: "Precios e impuestos de los vehículos" },
  toolstore: { nombre: "Tool Store", img: "/negocios/toolstore.jpg", precio: 900000, edita: "Precios de herramientas y objetos (mínimo $2.000)" },
  movil: { nombre: "GadgetShack · Tienda de móvil", img: "/negocios/movil.jpg", precio: 1500000, edita: "Precios de celulares, drones, radios, chip, VPN y planes" },
  taller: { nombre: "Taller clandestino", img: "/negocios/taller.jpg", precio: 1200000, edita: "Compra y reventa de vehículos robados (próxima fase)" },
};
export const PLANES = [50, 80, 100], MIN_HERRAMIENTA = 2000;
let ok = false;
export async function ensureNegocios(d) {
  if (ok) return; ok = true;
  await d.collection("negocios").bulkWrite(Object.keys(NEGOCIOS).map((k) => ({ updateOne: { filter: { _id: k }, update: { $setOnInsert: { owner: null } }, upsert: true } })));
}
export const planesDe = async (d) => (await d.collection("negocios").findOne({ _id: "movil" }))?.planes || PLANES;
// Si el negocio tiene dueño, lo que se vende en él se deposita en su Tarjeta de Comerciante.
export async function acreditarNegocio(d, key, monto, motivo) {
  if (!key) return;
  const n = await d.collection("negocios").findOne({ _id: key }); if (!n?.owner) return;
  const r = await d.collection("users").updateOne({ id: n.owner, "cuentas.com": { $exists: true } }, { $inc: { "cuentas.com.saldo": monto } }); if (!r.modifiedCount) return;
  const at = new Date();
  await d.collection("tx").insertOne({ user: n.owner, type: "venta", item: motivo, amount: monto, at });
  await d.collection("notifs").insertOne({ uid: n.owner, title: `Venta en ${NEGOCIOS[key].nombre}`, body: `${motivo}: +$${monto.toLocaleString("es")} en tu Tarjeta de Comerciante.`, at, read: false });
}
