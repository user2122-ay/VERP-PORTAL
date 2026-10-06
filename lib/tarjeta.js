import { db } from "./db";
// Números ficticios de 16 dígitos (prefijo 7700). Se descartan los que pasarían el algoritmo de tarjetas reales (Luhn).
const luhn = (s) => { let t = 0; [...s].reverse().forEach((c, i) => { let n = +c; if (i % 2) { n *= 2; if (n > 9) n -= 9; } t += n; }); return t % 10 === 0; };
export async function tarjetaDe(u) {
  if (u.tarjeta) return u.tarjeta;
  const col = (await db()).collection("users");
  for (;;) {
    let t = "7700"; for (let i = 0; i < 12; i++) t += Math.floor(Math.random() * 10);
    if (luhn(t) || (await col.findOne({ tarjeta: t }))) continue;
    const r = await col.updateOne({ id: u.id, tarjeta: { $exists: false } }, { $set: { tarjeta: t } });
    return r.modifiedCount ? t : (await col.findOne({ id: u.id })).tarjeta;
  }
}
