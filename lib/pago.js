import { BANCOS } from "./bancos";
// Campo de Mongo del que se descuenta según el método de pago ("efectivo" o la clave de un banco que el usuario tenga).
export const pagoKey = (u, pago) => (pago === "efectivo" ? "balance" : u.cuentas?.[pago] ? `cuentas.${pago}.saldo` : null);
// Métodos disponibles para mostrar en la ventana "¿Con qué vas a pagar?"
export const metodosDe = (u) => [{ k: "efectivo", label: "Efectivo", saldo: u.balance }, ...Object.keys(BANCOS).filter((k) => u.cuentas?.[k]).map((k) => ({ k, label: `Tarjeta ${BANCOS[k].corto}`, saldo: u.cuentas[k].saldo }))];
// Paga a un usuario en la cuenta que eligió (efectivo o tarjeta). Si ya no la tiene, va a efectivo.
export async function pagarA(d, uid, pago, monto) {
  const us = d.collection("users"), k = pago === "efectivo" || !pago ? "balance" : `cuentas.${pago}.saldo`, f = k === "balance" ? { id: uid } : { id: uid, [`cuentas.${pago}`]: { $exists: true } };
  if (!(await us.updateOne(f, { $inc: { [k]: monto } })).modifiedCount) await us.updateOne({ id: uid }, { $inc: { balance: monto } });
}
