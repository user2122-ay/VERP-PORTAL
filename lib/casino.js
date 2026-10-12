// Tragamonedas del celular. El resultado lo decide SIEMPRE el servidor. Muy poca probabilidad de ganar (≈9% de las jugadas, devuelve ≈59% en promedio).
export const SIMBOLOS = ["🍒", "🔔", "⭐", "7️⃣", "💎", "🪙"];
export const APUESTAS = [100, 250, 500, 1000, 2500, 5000], MIN = 100, MAX = 5000, ESPERA = 3000, MULT_MAX = 50;
// El casino solo acepta apuestas que su fondo pueda pagar al premio máximo (x50). Sin fondo para la apuesta mínima = cerrado.
export const apuestaMax = (fondo) => Math.min(MAX, Math.floor(fondo / MULT_MAX)), casinoAbierto = (fondo) => apuestaMax(fondo) >= MIN;
// [probabilidad acumulada, símbolo (índice), multiplicador de la apuesta]
export const TABLA = [[0.003, 4, 50], [0.010, 3, 20], [0.025, 2, 8], [0.050, 1, 4], [0.090, 0, 2]];
export function tirar() {
  const r = Math.random(); for (const [p, s, m] of TABLA) if (r < p) return { reels: [s, s, s], mult: m };
  return perdida();
}
export function perdida() { let r; do r = [0, 1, 2].map(() => Math.floor(Math.random() * SIMBOLOS.length)); while (r[0] === r[1] && r[1] === r[2]); return { reels: r, mult: 0 }; }
