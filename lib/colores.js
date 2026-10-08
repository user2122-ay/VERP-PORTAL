// Colores y detalles de los autos del Concesionario.
// Cada cierto tiempo (ROTACION_H horas) "llegan" otros colores: cada auto muestra un grupo distinto de la paleta, elegido con una semilla fija por auto y por periodo.
// Para agregar colores o detalles solo añade una línea aquí.
export const ROTACION_H = 3, CUANTOS = 5;
export const PALETA = [
  { n: "Negro", hex: "#111418" }, { n: "Blanco", hex: "#f4f4f2" }, { n: "Plata", hex: "#c0c4cc" }, { n: "Gris grafito", hex: "#4a4f58" },
  { n: "Rojo", hex: "#c8102e" }, { n: "Azul", hex: "#1f4fd8" }, { n: "Azul marino", hex: "#14285a" }, { n: "Verde", hex: "#1e7a4d" },
  { n: "Amarillo", hex: "#f2c200" }, { n: "Naranja", hex: "#f07a1a" }, { n: "Dorado", hex: "#c9a227" }, { n: "Vino", hex: "#6d1230" },
  { n: "Celeste", hex: "#5cb8ff" }, { n: "Morado", hex: "#6a3fb5" }, { n: "Marrón", hex: "#5b3a29" },
];
// Detalles opcionales (gratis por ahora; quedan guardados en el auto y se ven en el Inventario y en la MDT).
export const DETALLES = ["Tintes dorados", "Rines dorados", "Vidrios polarizados", "Franjas de carrera", "Luces neón", "Spoiler deportivo", "Detalles cromados"];
const hash = (str) => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const periodo = (ahora = Date.now()) => Math.floor(ahora / (ROTACION_H * 36e5));
export function coloresDisponibles(id, ahora = Date.now(), p = periodo(ahora)) {
  const r = rng(hash(`${id}:${p}`)), a = [...PALETA];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, CUANTOS);
}
export const proximoCambio = (ahora = Date.now()) => (periodo(ahora) + 1) * ROTACION_H * 36e5;
// Acepta los colores del periodo actual y del anterior (por si el cambio ocurre mientras el usuario está pagando).
export const colorValido = (id, nombre) => [0, 1].some((k) => coloresDisponibles(id, Date.now(), periodo() - k).some((c) => c.n === nombre));
export const hexDe = (nombre) => PALETA.find((c) => c.n === nombre)?.hex || "#888";
export const limpiarDetalles = (l) => (Array.isArray(l) ? [...new Set(l.filter((x) => DETALLES.includes(x)))] : []);
