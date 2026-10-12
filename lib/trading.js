// Mercado de trading ficticio. El precio depende solo de la hora (curva determinista), así todos ven lo mismo y se puede dibujar el historial sin guardar nada.
export const ACTIVOS = {
  VEBTC: { n: "VeBitcoin", ic: "₿", c: "#f7931a", base: 4200, vol: 0.07, T: [2440, 377, 63], p: [0.4, 2.1, 4.4] },
  PETRO: { n: "PetroVE", ic: "🛢️", c: "#34d399", base: 68, vol: 0.03, T: [1980, 611, 89], p: [1.3, 0.2, 3.7] },
  CAFE: { n: "CafeCoin", ic: "☕", c: "#c08457", base: 3.2, vol: 0.05, T: [1530, 289, 47], p: [2.8, 5.1, 1.1] },
  ORO: { n: "Oro VE", ic: "🥇", c: "#facc15", base: 1900, vol: 0.02, T: [3100, 733, 131], p: [0.9, 3.3, 2.5] },
};
export const MIN_COMPRA = 100, MAX_COMPRA = 100000;
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; };
export function precio(k, t = Date.now()) {
  const a = ACTIVOS[k]; if (!a) return 0; const m = t / 6e4, f = (i) => Math.sin((2 * Math.PI * m) / a.T[i] + a.p[i]);
  const b = Math.floor(m / 5), fr = m / 5 - b, n0 = hash(k + b) - 0.5, n1 = hash(k + (b + 1)) - 0.5, ruido = n0 + (n1 - n0) * fr, tend = 0.55 * f(0) + 0.3 * f(1) + 0.15 * f(2);
  return Math.round(Math.max(a.base * 0.15, a.base * (1 + a.vol * (tend * 3 + ruido * 4))) * 100) / 100;
}
// Velas: n velas de `min` minutos que terminan ahora.
export function velas(k, min, n, ahora = Date.now()) {
  const paso = min * 6e4, fin = Math.ceil(ahora / paso) * paso, out = [];
  for (let i = n - 1; i >= 0; i--) {
    const t0 = fin - (i + 1) * paso, pts = []; for (let j = 0; j <= 6; j++) pts.push(precio(k, Math.min(ahora, t0 + (paso * j) / 6)));
    out.push({ t: t0, o: pts[0], c: pts[6], h: Math.max(...pts), l: Math.min(...pts) });
  }
  return out;
}
export const r6 = (x) => Math.round(x * 1e6) / 1e6;
