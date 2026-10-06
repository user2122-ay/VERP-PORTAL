// Zonas según las líneas negras del mapa (imagen 1049x1024). x,y en porcentaje.
export function zona(px, py) {
  const x = (px / 100) * 1049, y = (py / 100) * 1024;
  const top = x < 545 ? 182 + (x - 100) * 0.6404 : 467 - (x - 545) * 0.252;
  if (y < top) return "Caracas";
  return x > 710 ? "El Ávila" : "La Guaira";
}
// Lugares de nacimiento permitidos (el número de cédula ahora es correlativo, ya no depende del lugar).
export const LUGARES = {
  "Caracas": [20000000, 29999999],
  "La Guaira": [10000000, 19999999],
  "El Ávila": [30000000, 39999999],
};
export const ESTADOS_CIVILES = ["Soltero", "Casado", "Divorciado", "Viudo"];
