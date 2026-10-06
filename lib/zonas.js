// Zonas según las líneas negras del mapa (imagen 1049x1024). x,y en porcentaje.
export function zona(px, py) {
  const x = (px / 100) * 1049, y = (py / 100) * 1024;
  const top = x < 545 ? 182 + (x - 100) * 0.6404 : 467 - (x - 545) * 0.252;
  if (y < top) return "Caracas";
  return x > 710 ? "El Ávila" : "La Guaira";
}
