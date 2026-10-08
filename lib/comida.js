// Comida, bebida y neveras. Precios: 8 veces el % que sube (tope $500). Duración (vidaH) en horas FUERA de la nevera; dentro dura FRIO veces más.
// Para agregar comida nueva: una línea en COMIDAS + su foto en public/items/c-<sku>.jpg y subir CATALOGO_V en lib/catalogo.js.
export const MAX_PRECIO = 500, HORA = 36e5, FRIO = 4;
export const DECAE = { h: 100 / 24, s: 100 / 14 }; // % que bajan por hora: el hambre dura ~24 h y la sed ~14 h
const C = (sku, name, tipo, sube, vidaH, file) => ({ sku, name, tipo, sube, vidaH, file, price: Math.min(MAX_PRECIO, sube * 8) });
export const COMIDAS = [
  C("harina-pan", "Harina P.A.N.", "comida", 12, 720, "518"), C("pollo", "Pollo asado", "comida", 15, 36, "520"), C("tequenos", "Tequeños", "comida", 9, 24, "524"),
  C("empanada", "Empanada", "comida", 9, 24, "535"), C("hallaca", "Hallaca", "comida", 23, 72, "553"), C("cachapa", "Cachapa", "comida", 17, 24, "549"),
  C("helado-cono", "Cono de helado", "comida", 8, 4, "555"), C("helado-pote", "Pote de helado", "comida", 14, 12, "557"), C("helado-paleta", "Paleta", "comida", 5, 6, "559"),
  C("helado-bandeja", "Bandeja de helado", "comida", 18, 12, "561"), C("banana-kami", "Banana Kami", "comida", 23, 6, "563"), C("hamburguesa", "Hamburguesa", "comida", 15, 18, "565"),
  C("perro-caliente", "Perro caliente", "comida", 12, 18, "567"), C("pepito", "Pepito", "comida", 12, 480, "569"), C("cocosette", "Cocosette", "comida", 9, 480, "571"),
  C("manzana", "Manzana", "comida", 12, 168, "585"), C("mango", "Mango", "comida", 12, 120, "583"), C("cambur", "Cambur", "comida", 12, 96, "587"),
  C("pera", "Pera", "comida", 12, 120, "589"), C("melon", "Melón", "comida", 13, 120, "591"), C("patilla", "Patilla", "comida", 15, 96, "593"),
  C("malta", "Malta (botella)", "bebida", 10, 480, "537"), C("malta-1l", "Malta 1 litro", "bebida", 20, 480, "539"), C("coca-cola", "Coca-Cola 1 litro", "bebida", 20, 480, "541"),
  C("botellon", "Botellón de agua", "bebida", 26, 240, "543"), C("agua", "Agua", "bebida", 5, 480, "545"), C("jugo-naranja", "Jugo de naranja", "bebida", 22, 72, "580"),
  C("cafe", "Café", "bebida", 12, 4, "623"), C("capuchino", "Capuchino", "bebida", 14, 4, "625"),
];
export const NEVERAS = [
  { sku: "nevera-normal", name: "Nevera Normal", price: 5000, cap: 10, file: "466" }, { sku: "refrigerador", name: "Refrigerador", price: 7890, cap: 15, file: "464" }, { sku: "nevera-lujo", name: "Nevera de Lujo", price: 10000, cap: 20, file: "462" },
];
export const esComida = (i) => i?.category === "Comida" || i?.category === "Bebidas";
export const needsDe = (u, ahora = Date.now()) => { const n = u?.needs || { h: 70, s: 70, t: ahora }, hrs = Math.max(0, (ahora - +n.t) / HORA); return { h: Math.max(0, n.h - hrs * DECAE.h), s: Math.max(0, n.s - hrs * DECAE.s) }; };
export const durac = (ms) => { const m = Math.floor(ms / 6e4); return m < 60 ? `${Math.max(m, 1)} min` : m < 2880 ? `${Math.floor(m / 60)} h` : `${Math.floor(m / 1440)} días`; };
