// Comida, bebida y neveras.
// - Cada comida/bebida se vende en un negocio (frutería, Taco Bout, Three Guys, cafetería...). Los precios los edita el dueño (máximo $500) y NO llevan impuestos.
// - Al comprarla va al Inventario → Comida: se puede comer, botar o guardar en la nevera. Todo vence; en la nevera dura más.
// - Comer algo vencido puede enfermarte y te quita un pequeño % de comida y agua.
// Para agregar productos: añade una línea en PRODUCTOS y ponla en el menú (MENUS) de la tienda que la vende, luego sube CATALOGO_V.
export const PRECIO_MAX = 500, FACTOR_NEVERA = 3, SUBS = ["Comida rápida", "Helados", "Frutas", "Bebidas"];
export const HORAS_ENFERMO = 2, PROB_ENFERMAR = 0.7;
// clave: [nombre, subcategoría, qué sube (comida|agua), % que sube, precio inicial, horas que dura fuera de la nevera, calificación 1-5, descripción]
export const PRODUCTOS = {
  agua: ["Agua Font d'Or", "Bebidas", "agua", 5, 3, 1440, 3.5], botellon: ["Botellón de agua", "Bebidas", "agua", 26, 12, 720, 4],
  coca: ["Coca-Cola 1.5 L", "Bebidas", "agua", 20, 6, 1440, 4], malta: ["Maltín (botella)", "Bebidas", "agua", 10, 3, 2160, 4.5], maltalitro: ["Maltín 1 litro", "Bebidas", "agua", 20, 6, 2160, 4.5],
  naranjada: ["Naranjada Yukery 1.5 L", "Bebidas", "agua", 22, 7, 480, 4], cafe: ["Café", "Bebidas", "agua", 12, 2, 5, 4], capuchino: ["Capuchino", "Bebidas", "agua", 14, 4, 4, 4.5],
  hamburguesa: ["Hamburguesa", "Comida rápida", "comida", 15, 9, 30, 4.5], perro: ["Perro caliente", "Comida rápida", "comida", 12, 6, 30, 4], cachapa: ["Cachapa", "Comida rápida", "comida", 17, 8, 36, 4.5],
  hayaca: ["Hayaca", "Comida rápida", "comida", 23, 12, 120, 5], empanada: ["Empanada", "Comida rápida", "comida", 9, 4, 30, 4], tequenos: ["Tequeños", "Comida rápida", "comida", 9, 5, 36, 4.5],
  pollo: ["Pollo al horno", "Comida rápida", "comida", 15, 22, 48, 4.5], harina: ["Harina P.A.N.", "Comida rápida", "comida", 12, 6, 2160, 3], cocosette: ["Cocosette", "Comida rápida", "comida", 9, 2, 1440, 4], pepito: ["Pepito (snack)", "Comida rápida", "comida", 12, 3, 1080, 3.5],
  cono: ["Helado de cono", "Helados", "comida", 8, 4, 12, 4], pote: ["Pote de helado", "Helados", "comida", 14, 10, 24, 4.5], paleta: ["Paleta", "Helados", "comida", 5, 3, 12, 3.5], bandeja: ["Bandeja de helado", "Helados", "comida", 18, 14, 24, 4.5], bananasplit: ["Banana Kami (banana split)", "Helados", "comida", 23, 12, 10, 5],
  mango: ["Mango", "Frutas", "comida", 12, 3, 96, 4], manzana: ["Manzana", "Frutas", "comida", 12, 2, 168, 4], cambur: ["Cambur", "Frutas", "comida", 12, 2, 96, 4], pera: ["Pera", "Frutas", "comida", 12, 3, 120, 4], melon: ["Melón", "Frutas", "comida", 13, 6, 144, 4], patilla: ["Patilla", "Frutas", "comida", 15, 8, 120, 4.5],
};
// Foto de cada producto en /public/items (la clave es el nombre del archivo, salvo las que se indican).
export const FOTO = { agua: "agua-botella", coca: "coca-cola", malta: "malta", maltalitro: "malta-litro", perro: "perro-caliente", tequenos: "tequenos", harina: "harina-pan", cono: "helado-cono", pote: "pote-helado", bandeja: "bandeja-helado", bananasplit: "banana-split" };
// Qué vende cada negocio de comida. Los productos que no están aquí (helados, pollo, harina, Cocosette, Pepito...) esperan su tienda.
export const MENUS = {
  fruteria: ["mango", "manzana", "cambur", "pera", "melon", "patilla", "agua", "botellon"],
  tacobout: ["cachapa", "coca", "naranjada", "hayaca", "agua"],
  threeguys: ["hamburguesa", "perro", "coca", "naranjada", "agua"],
  cafeteria: ["cafe", "capuchino", "empanada", "tequenos", "malta", "cachapa", "coca", "naranjada", "agua"],
};
export const NEVERAS = [["nevera-normal", "Nevera Normal", 5000, 10, "nevera-normal"], ["refrigerador", "Refrigerador", 7890, 15, "nevera-lujo"], ["nevera-lujo", "Nevera de Lujo", 10000, 20, "refrigerador"]];
export const esNevera = (i) => i?.tipo === "nevera";
export const esComida = (i) => i?.category === "Comida y bebida" && !!i.fid;
export const venceMs = (i) => (i?.vence ? +new Date(i.vence) : 0);
export const vencido = (i) => venceMs(i) > 0 && venceMs(i) <= Date.now();
export const tieneCasa = (u) => (u?.inventory || []).some((i) => i.category === "Propiedades");
export const neveraDe = (u) => (u?.inventory || []).find(esNevera) || null;
export const enNevera = (u) => (u?.inventory || []).filter((i) => esComida(i) && i.enNevera);
export const ids = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
// "2 d 4 h", "35 min"...
export function dura(ms) { if (ms <= 0) return "vencido"; const m = Math.floor(ms / 6e4); if (m < 60) return `${Math.max(1, m)} min`; const h = Math.floor(m / 60); if (h < 48) return `${h} h ${m % 60} min`; return `${Math.floor(h / 24)} d ${h % 24} h`; }
export const estrellas = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
