// Lógica pura de las mesas del casino (ruleta española, blackjack, hipódromo). La usan el servidor (decide) y el cliente (dibuja).
export const ROJOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const colorNum = (n) => (n === 0 ? "verde" : ROJOS.includes(n) ? "rojo" : "negro");
// Apuestas de la ruleta: tipo → [paga (x a 1), ¿gana el número n?]
export const RULETA = {
  num: [35, (n, v) => n === v], rojo: [1, (n) => colorNum(n) === "rojo"], negro: [1, (n) => colorNum(n) === "negro"], par: [1, (n) => n > 0 && n % 2 === 0], impar: [1, (n) => n % 2 === 1],
  bajo: [1, (n) => n >= 1 && n <= 18], alto: [1, (n) => n >= 19], doc: [2, (n, v) => n >= 1 && Math.ceil(n / 12) === v], col: [2, (n, v) => n >= 1 && ((n - 1) % 3) + 1 === v],
};
export function validarApuestas(a) {
  if (!Array.isArray(a) || !a.length || a.length > 14) return null; const o = [];
  for (const x of a) { const t = String(x?.t), m = Math.floor(Number(x?.m)), v = Math.floor(Number(x?.v ?? 0)); if (!RULETA[t] || !(m >= 100) || m > 5000) return null; if (t === "num" && !(v >= 0 && v <= 36)) return null; if ((t === "doc" || t === "col") && !(v >= 1 && v <= 3)) return null; o.push({ t, v, m }); }
  return o;
}
export const premioRuleta = (n, ap) => ap.reduce((s, x) => s + (RULETA[x.t][1](n, x.v) ? x.m * (RULETA[x.t][0] + 1) : 0), 0);
// Blackjack: carta 0..51 → rango 0..12 (A,2..10,J,Q,K), palo 0..3
export const rango = (c) => c % 13, palo = (c) => Math.floor(c / 13);
export function valorMano(m) { let s = 0, a = 0; for (const c of m) { const r = rango(c); if (r === 0) { a++; s += 11; } else s += Math.min(10, r + 1); } while (s > 21 && a > 0) { s -= 10; a--; } return { total: s, blando: a > 0 }; }
export const esBJ = (m) => m.length === 2 && valorMano(m).total === 21;
// Hipódromo: 6 caballos; la carrera se simula en el servidor y el cliente solo anima los cuadros.
export const NOMBRES = ["Relámpago", "Sabanero", "Llanero", "Tormenta", "Cacique", "Orinoco", "Fantasma", "Centella", "Maracucho", "Guaraira", "Andino", "Turpial", "Bravío", "Morrocoy", "Catire", "Zamuro"];
export const COLORES = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899"];
export const PASOS = 110, EDGE = 0.88;
