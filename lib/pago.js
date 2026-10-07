import { BANCOS } from "./bancos";
// Campo de Mongo del que se descuenta según el método de pago ("efectivo" o la clave de un banco que el usuario tenga).
export const pagoKey = (u, pago) => (pago === "efectivo" ? "balance" : u.cuentas?.[pago] ? `cuentas.${pago}.saldo` : null);
// Métodos disponibles para mostrar en la ventana "¿Con qué vas a pagar?"
export const metodosDe = (u) => [{ k: "efectivo", label: "Efectivo", saldo: u.balance }, ...Object.keys(BANCOS).filter((k) => u.cuentas?.[k]).map((k) => ({ k, label: `Tarjeta ${BANCOS[k].corto}`, saldo: u.cuentas[k].saldo }))];
