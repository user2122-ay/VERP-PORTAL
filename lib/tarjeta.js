import { db } from "./db";
// Números ficticios de 16 dígitos (prefijo 7700). Se descartan los que pasarían el algoritmo de tarjetas reales (Luhn).
const luhn = (s) => { let t = 0; [...s].reverse().forEach((c, i) => { let n = +c; if (i % 2) { n *= 2; if (n > 9) n -= 9; } t += n; }); return t % 10 === 0; };
// Devuelve { num, cvc, venc }; crea lo que falte (también para usuarios que ya tenían tarjeta).
export async function tarjetaDe(u) {
  const col = (await db()).collection("users"), set = {};
  if (!u.cvc) set.cvc = String(Math.floor(Math.random() * 900) + 100);
  if (!u.venc) { const x = new Date(); set.venc = `${String(x.getUTCMonth() + 1).padStart(2, "0")}/${String(x.getUTCFullYear() + 4).slice(2)}`; }
  if (!u.tarjeta) for (;;) {
    let t = "7700"; for (let i = 0; i < 12; i++) t += Math.floor(Math.random() * 10);
    if (luhn(t) || (await col.findOne({ tarjeta: t }))) continue; set.tarjeta = t; break;
  }
  if (Object.keys(set).length) { await col.updateOne({ id: u.id, ...(set.tarjeta ? { tarjeta: { $exists: false } } : {}) }, { $set: set }); u = await col.findOne({ id: u.id }); }
  return { num: u.tarjeta, cvc: u.cvc, venc: u.venc };
}
// Para retiros y casino: pide CVC y fecha de validez como seguridad.
export const verificarTarjeta = (u, cvc, venc) => !!u.cvc && String(cvc).trim() === u.cvc && String(venc).trim() === u.venc;
