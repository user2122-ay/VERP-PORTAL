import { BANCOS } from "./bancos";
import { esComida, esNevera, FACTOR_NEVERA, venceMs } from "./comida";
import { casaRef } from "./mdt";
// Vivienda compartida. El dueño de una casa invita a otros jugadores como FAMILIA (gratis, acceso completo) o ALQUILINO (paga una cuota semanal que pone el dueño, acceso limitado).
// Habitaciones por tipo de casa (individual = 1 persona, matrimonial = 2). Las plazas se regulan: máximo 6 personas por casa contando al dueño.
export const HAB = { 0: { ind: 1, mat: 1 }, 1: { ind: 0, mat: 2 }, 2: { ind: 2, mat: 1 }, 3: { ind: 1, mat: 1, garaje: true }, 4: { ind: 3, mat: 3 } };
export const MAX_PLAZAS = 6, CUOTA_MAX = 10000, DIAS_INVITACION = 3, DIAS_GRACIA = 14, MAX_DEPOSITOS = 15, SEM = 7 * 864e5;
export const tipoDe = (c) => { const t = c?.tipo ?? /(\d)\s*$/.exec(c?.name || "")?.[1]; return HAB[Number(t)] ? Number(t) : 0; };
export const plazas = (tipo) => { const h = HAB[tipo] || HAB[0]; return Math.min(MAX_PLAZAS, h.ind + 2 * h.mat); }; // incluye al dueño
export const cupo = (tipo) => plazas(tipo) - 1; // ocupantes que puede invitar el dueño
export const etiquetaCasa = (c) => `${c.name}${c.ubicacion ? " · " + c.ubicacion : ""}`;
export const limpiar = (it) => { const x = { ...it, loc: "personal" }; delete x.casa; delete x.lugar; delete x.por; delete x.nev; return x; };
// Cobra una cuota de alquiler al inquilino (tarjetas y luego efectivo) y se la acredita al dueño.
export async function cobrarCuota(d, u, duenoId, monto, concepto) {
  const us = d.collection("users"), fuentes = [...Object.keys(BANCOS).filter((k) => !BANCOS[k].comercial && u.cuentas?.[k]).map((k) => `cuentas.${k}.saldo`), "balance"]; let ok = false;
  for (const f of fuentes) if ((await us.updateOne({ id: u.id, [f]: { $gte: monto } }, { $inc: { [f]: -monto } })).modifiedCount) { ok = true; break; }
  if (!ok) return false;
  await us.updateOne({ id: duenoId }, { $inc: { balance: monto } });
  await d.collection("tx").insertMany([{ user: u.id, type: "alquiler", item: concepto, amount: -monto, at: new Date() }, { user: duenoId, type: "alquiler", item: concepto, amount: monto, at: new Date() }]);
  await d.collection("notifs").insertOne({ uid: duenoId, title: "Cuota de alquiler", body: `${concepto}: te pagaron $${monto.toLocaleString("es")} en efectivo.`, at: new Date(), read: false });
  return true;
}
// Devuelve a su dueño lo que un ocupante dejó en la casa (objetos escondidos y comida de la nevera).
export async function devolverCosas(d, duenoId, ref, rid) {
  const us = d.collection("users"), o = await us.findOne({ id: duenoId }, { projection: { inventory: 1 } }); let n = 0;
  for (const x of (o?.inventory || []).filter((i) => i.casa === ref && i.por === rid)) {
    const sel = esComida(x) ? { fid: x.fid, por: rid } : { name: x.name, at: x.at, por: rid };
    if (!(await us.updateOne({ id: duenoId }, { $pull: { inventory: sel } })).modifiedCount) continue;
    const y = limpiar(x); if (esComida(x) && x.enNevera) { y.enNevera = false; y.vence = new Date(Date.now() + Math.max(0, venceMs(x) - Date.now()) / FACTOR_NEVERA); }
    await us.updateOne({ id: rid }, { $push: { inventory: y } }); n++;
  }
  return n;
}
export async function quitarOcupante(d, h, rid, motivo) {
  await devolverCosas(d, h.owner, h._id, rid); await d.collection("hogares").updateOne({ _id: h._id }, { $pull: { ocup: { id: rid } } });
  const txt = `${h.etiqueta || "la casa"}: ${motivo}`; await d.collection("notifs").insertOne({ uid: rid, title: "Vivienda compartida", body: txt, at: new Date(), read: false });
}
// Si Administración quita una casa, se disuelve el hogar: todos los ocupantes reciben de vuelta sus cosas.
export async function disolverHogar(d, ref) {
  const h = await d.collection("hogares").findOne({ _id: ref }); if (!h) return;
  for (const o of h.ocup || []) await quitarOcupante(d, h, o.id, "la casa ya no está disponible: el hogar se disolvió y recuperaste tus cosas");
  await d.collection("hogares").deleteOne({ _id: ref });
}
// Alquiler semanal de quien vive como alquilino. Si debe más de 14 días, lo sacan de la casa.
export async function cobrarAlquiler(u, d) {
  const hs = await d.collection("hogares").find({ ocup: { $elemMatch: { id: u.id, cuota: { $gt: 0 } } } }).toArray(), col = d.collection("hogares");
  for (const h of hs) {
    const o = h.ocup.find((x) => x.id === u.id); let p = new Date(o.prox);
    for (let i = 0; i < 4 && p <= new Date(); i++) {
      const sig = new Date(+p + SEM); if (!(await col.updateOne({ _id: h._id, ocup: { $elemMatch: { id: u.id, prox: p } } }, { $set: { "ocup.$.prox": sig } })).modifiedCount) break;
      if (!(await cobrarCuota(d, u, h.owner, o.cuota, `Alquiler de ${h.etiqueta}`))) { await col.updateOne({ _id: h._id, ocup: { $elemMatch: { id: u.id, prox: sig } } }, { $set: { "ocup.$.prox": p } }); break; }
      p = sig;
    }
    if (+p < Date.now() - DIAS_GRACIA * 864e5) { await quitarOcupante(d, h, u.id, "te sacaron por deber más de 14 días de alquiler"); await d.collection("notifs").insertOne({ uid: h.owner, title: "Vivienda compartida", body: `${o.name} fue sacado de ${h.etiqueta} por no pagar el alquiler.`, at: new Date(), read: false }); }
  }
}
export { casaRef, esNevera };
