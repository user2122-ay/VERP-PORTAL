import { db } from "./db";
import { BANCOS } from "./bancos";
import { acreditarNegocio } from "./negocios";
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
export async function cobrar(u) {
  if (!u.plan && !Object.keys(BANCOS).some((k) => BANCOS[k].semanal && u.cuentas?.[k])) return; const d = await db(), bancos = Object.keys(BANCOS).filter((k) => !BANCOS[k].comercial && u.cuentas?.[k]);
  for (const k of Object.keys(BANCOS)) if (BANCOS[k].semanal && u.cuentas?.[k]) await ciclo(u, d, `cuentas.${k}.proximo`, BANCOS[k].semanal, [k, ...bancos.filter((x) => x !== k)], `Membresía ${BANCOS[k].corto}`, null);
  if (u.plan) await ciclo(u, d, "plan.proximo", u.plan.monto, bancos, "Plan de telefonía", "movil");
}
