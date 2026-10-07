import { db } from "./db";
// Negocios que se pueden comprar (necesitan Tarjeta de Comerciante). Cambia aquí precios, nombres y fotos.
export const NEGOCIOS = {
  concesionario: { nombre: "Concesionario", img: "/negocios/concesionario.jpg", precio: 3000000, edita: "Precios e impuestos de los vehículos" },
  toolstore: { nombre: "Tool Store", img: "/negocios/toolstore.jpg", precio: 125000, edita: "Precios de herramientas (mínimo $500)" },
  movil: { nombre: "GadgetShack · Tienda de móvil", img: "/negocios/movil.jpg", precio: 120000, edita: "Precios de celulares, computadoras, drones, radios, acceso Dark Web, chip y planes" },
  armeria: { nombre: "Armería Liberty Guns & Ammo", img: "/negocios/armeria.jpg", precio: 95000, edita: "Precios de las armas" },
  taller: { nombre: "Taller clandestino", img: "/negocios/taller.jpg", precio: 95000, oculto: true, edita: "Compra autos robados a los delictivos y los revende (solo en la Dark Web)" },
};
export const PLANES = [50, 80, 100], MIN_HERRAMIENTA = 500;
let ok = false;
export async function ensureNegocios(d) {
  if (ok) return; ok = true;
  await d.collection("negocios").bulkWrite(Object.keys(NEGOCIOS).map((k) => ({ updateOne: { filter: { _id: k }, update: { $setOnInsert: { owner: null } }, upsert: true } })));
}
export const planesDe = async (d) => (await d.collection("negocios").findOne({ _id: "movil" }))?.planes || PLANES;
// Impuesto sobre las ventas de un negocio con dueño (0.05 = 5%). Por ahora está APAGADO (0). Para activarlo cambia este número.
export const IMPUESTO_NEGOCIO = 0;
// Categoría del artículo -> negocio al que pertenece (así sus ventas llegan al dueño y él puede editar sus precios).
export const NEGOCIO_DE = { Concesionario: "concesionario", Armas: "armeria", Herramientas: "toolstore", Telefonía: "movil", Tecnología: "movil" };
// Si el negocio tiene dueño, lo que se vende en él se deposita en su Tarjeta de Comerciante (menos el impuesto, si está activo).
export async function acreditarNegocio(d, key, monto, motivo) {
  if (!key) return;
  const n = await d.collection("negocios").findOne({ _id: key }); if (!n?.owner) return;
  const imp = Math.floor(monto * IMPUESTO_NEGOCIO), neto = monto - imp;
  const r = await d.collection("users").updateOne({ id: n.owner, "cuentas.com": { $exists: true } }, { $inc: { "cuentas.com.saldo": neto } }); if (!r.modifiedCount) return;
  const at = new Date(), nota = imp ? ` (impuesto ${Math.round(IMPUESTO_NEGOCIO * 100)}%: -$${imp.toLocaleString("es")})` : "";
  await d.collection("tx").insertOne({ user: n.owner, type: "venta", item: motivo + nota, amount: neto, at });
  await d.collection("notifs").insertOne({ uid: n.owner, title: `Venta en ${NEGOCIOS[key].nombre}`, body: `${motivo}: +$${neto.toLocaleString("es")} en tu Tarjeta de Comerciante.${nota}`, at, read: false });
}

// Acredita dinero en la Tarjeta de Comerciante de un usuario (ventas de la Dark Web). Devuelve false si no tiene la tarjeta.
export async function creditarCom(d, uid, monto, motivo) {
  const r = await d.collection("users").updateOne({ id: uid, "cuentas.com": { $exists: true } }, { $inc: { "cuentas.com.saldo": monto } }); if (!r.modifiedCount) return false;
  const at = new Date();
  await d.collection("tx").insertOne({ user: uid, type: "venta", item: motivo, amount: monto, at });
  await d.collection("notifs").insertOne({ uid, title: "Venta en la Dark Web", body: `${motivo}: +$${monto.toLocaleString("es")} en tu Tarjeta de Comerciante.`, at, read: false });
  return true;
}
