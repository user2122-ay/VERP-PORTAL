import { db } from "./db";
import { BANCOS } from "./bancos";
import { acreditarNegocio } from "./negocios";
import { ingresarTesoreria } from "./tesoreria";
const SEM = 7 * 864e5;
async function pagar(u, d, monto, fuentes) {
  for (const k of fuentes) { const r = await d.collection("users").updateOne({ id: u.id, [`cuentas.${k}.saldo`]: { $gte: monto } }, { $inc: { [`cuentas.${k}.saldo`]: -monto } }); if (r.modifiedCount) { u.cuentas[k].saldo -= monto; return true; } }
  return false;
}
// Cobra cada semana: membresía de comerciante ($5) y plan de teléfono. Si no hay saldo queda pendiente y se reintenta en cada visita.
async function ciclo(u, d, campo, monto, fuentes, item, negocio) {
  let p = campo.split(".").reduce((o, k) => o?.[k], u); if (!p) return; p = new Date(p); const ini = +p;
  for (let i = 0; i < 8 && p <= new Date(); i++) {
    if (!(await pagar(u, d, monto, fuentes))) break; p = new Date(+p + SEM);
    await d.collection("tx").insertOne({ user: u.id, type: "cobro", item, amount: -monto, at: new Date() }); await acreditarNegocio(d, negocio, monto, item);
  }
  if (+p !== ini) await d.collection("users").updateOne({ id: u.id }, { $set: { [campo]: p } });
}
// Impuesto SEMANAL de cada casa (el monto lo pone Administración en la casa). Se cobra cada 7 días desde la compra (de tarjetas y, si no alcanza, de efectivo) y llega a la Tesorería del Estado.
// Si no hay saldo queda pendiente y se reintenta en cada visita (se acumulan hasta 8 semanas).
async function cobrarCasas(u, d) {
  const casas = (u.inventory || []).filter((i) => i.category === "Propiedades"); if (!casas.length) return;
  const us = d.collection("users"), cat = d.collection("items"), fuentes = [...Object.keys(BANCOS).filter((k) => !BANCOS[k].comercial && u.cuentas?.[k]).map((k) => `cuentas.${k}.saldo`), "balance"];
  for (const c of casas) {
    const sel = { name: c.name, at: c.at };
    if (!c.impProx) { await us.updateOne({ id: u.id, inventory: { $elemMatch: { ...sel, impProx: { $exists: false } } } }, { $set: { "inventory.$.impProx": new Date(Date.now() + SEM) } }); continue; } // casas anteriores a este sistema: el primer cobro es en 7 días
    const doc = await cat.findOne({ category: "Propiedades", name: c.name, ubicacion: c.ubicacion }, { projection: { impuesto: 1 } }), monto = Math.round(Number(doc?.impuesto) || 0); if (monto <= 0) continue;
    let p = new Date(c.impProx);
    for (let i = 0; i < 8 && p <= new Date(); i++) {
      const sig = new Date(+p + SEM);
      if (!(await us.updateOne({ id: u.id, inventory: { $elemMatch: { ...sel, impProx: p } } }, { $set: { "inventory.$.impProx": sig } })).modifiedCount) break; // otra petición ya lo cobró
      let ok = false; for (const f of fuentes) if ((await us.updateOne({ id: u.id, [f]: { $gte: monto } }, { $inc: { [f]: -monto } })).modifiedCount) { ok = true; break; }
      if (!ok) { await us.updateOne({ id: u.id, inventory: { $elemMatch: { ...sel, impProx: sig } } }, { $set: { "inventory.$.impProx": p } }); break; }
      p = sig; const item = `Impuesto semanal de la casa: ${c.ubicacion || c.name}`;
      await d.collection("tx").insertOne({ user: u.id, type: "impuesto", item, amount: -monto, at: new Date() });
      await ingresarTesoreria(d, monto, item, c.ubicacion || c.name);
      await d.collection("notifs").insertOne({ uid: u.id, title: "Impuesto de tu casa", body: `Se cobró el impuesto semanal de ${c.ubicacion || c.name}: $${monto.toLocaleString("es")}. Fue a la Tesorería del Estado.`, at: new Date(), read: false });
    }
  }
}
export async function cobrar(u) {
  if (u.inventory?.some((i) => i.category === "Propiedades")) await cobrarCasas(u, await db());
  if (!u.plan && !Object.keys(BANCOS).some((k) => BANCOS[k].semanal && u.cuentas?.[k])) return; const d = await db(), bancos = Object.keys(BANCOS).filter((k) => !BANCOS[k].comercial && u.cuentas?.[k]);
  for (const k of Object.keys(BANCOS)) if (BANCOS[k].semanal && u.cuentas?.[k]) await ciclo(u, d, `cuentas.${k}.proximo`, BANCOS[k].semanal, [k, ...bancos.filter((x) => x !== k)], `Membresía ${BANCOS[k].corto}`, null);
  if (u.plan) await ciclo(u, d, "plan.proximo", u.plan.monto, bancos, "Plan de telefonía", "movil");
}
