import { db } from "./db";
import { BANCOS } from "./bancos";
// Números ficticios de 16 dígitos; se descartan los que pasarían el algoritmo de tarjetas reales (Luhn).
const luhn = (s) => { let t = 0; [...s].reverse().forEach((c, i) => { let n = +c; if (i % 2) { n *= 2; if (n > 9) n -= 9; } t += n; }); return t % 10 === 0; };
export async function nuevaCuenta(k) {
  const col = (await db()).collection("users");
  for (;;) {
    let t = BANCOS[k].pref; for (let i = 0; i < 12; i++) t += Math.floor(Math.random() * 10);
    if (luhn(t) || (await col.findOne({ $or: Object.keys(BANCOS).map((x) => ({ [`cuentas.${x}.num`]: t })) }))) continue;
    const x = new Date();
    return { num: t, cvc: String(Math.floor(Math.random() * 900) + 100), venc: `${String(x.getUTCMonth() + 1).padStart(2, "0")}/${String(x.getUTCFullYear() + 4).slice(2)}`, saldo: 0 };
  }
}
// Para retiros y casino: pide CVC y fecha de validez de la tarjeta del banco k.
export const verificarTarjeta = (u, k, cvc, venc) => { const c = u.cuentas?.[k]; return !!c && String(cvc).trim() === c.cvc && String(venc).trim() === c.venc; };
