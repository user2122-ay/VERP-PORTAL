// Catálogo en código: para agregar objetos nuevos solo añade una línea y vuelve a desplegar (se crean solos en el Mercado).
// Los precios se editan después desde el Mercado (dueño del negocio o Administración).
// Si cambias nombres, precios o fotos aquí, SUBE CATALOGO_V en 1: así se aplican una sola vez sin pisar los precios que ya editaron los dueños después.
import { NEGOCIO_DE } from "./negocios";
import { PRODUCTOS, MENUS, FOTO, NEVERAS } from "./comida";
export const CATALOGO_V = 4;
// Objetos del Mercado (herramientas, armas, teléfonos, tecnología): solo se puede tener 1. Los que tienen duración (ej. acceso a la Dark Web) se pueden renovar cada vez.
// Autos, casas y licencias tienen sus propias reglas.
export const esUnico = (i) => !["Concesionario", "Propiedades", "Licencias"].includes(i.category) && !i.dias;
export const mismo = (x, i) => (i.sku ? x.sku === i.sku : x.name === i.name);
export const yaTiene = (u, i) => (u.inventory || []).some((x) => mismo(x, i) && (!x.vence || +new Date(x.vence) > Date.now()));
export const COLORES_CASA = ["Blanco", "Beige", "Gris", "Negro", "Azul", "Verde", "Rojo", "Amarillo"];
const mk = (category, negocio) => (sku, name, price, img, desc = "", extra = {}) => ({ sku, name, price, desc, img: `/items/${img}.jpg`, category, negocio, ...extra });
const LC = mk("Licencias", null), H = mk("Herramientas", "toolstore"), T = mk("Telefonía", "movil"), X = mk("Tecnología", "movil"), F = mk("Comida y bebida", null);
export const CATALOGO = [
  LC("licencia-conducir", "Licencia de Conducir", 600, "licencia-conducir", "Obligatoria para comprar vehículos."), LC("licencia-armas", "Licencia de Armas", 2500, "licencia-armas", "Obligatoria para comprar armas."),
  LC("licencia-embarcaciones", "Licencia de Embarcaciones", 10000, "licencia-embarcaciones", "Para embarcaciones (próximamente)."),
  H("palanca", "Palanca", 800, "palanca", "Se requiere para robar."), H("taladro", "Taladro", 500, "taladro", "Se requiere para robar."),
  H("martillo", "Martillo", 900, "martillo"), H("bate", "Bate de béisbol", 800, "bate"),
  H("guantes-cuero", "Guantes de cuero", 3500, "guantes-cuero"), H("guantes-quirurgicos", "Guantes quirúrgicos", 1500, "guantes-quirurgicos"),
  H("placa-deshabilitadora", "Placa debilitadora", 1000, "placa-deshabilitadora"),
  T("cel-iphone", "Ipone P Max 28", 1800, "iphone-nuevo", "Necesario para WhatsApp e Instagram.", { tipo: "telefono" }),
  T("cel-samsun", "Samsun Galaxy S78 Ultra", 1790, "samsung", "Necesario para WhatsApp e Instagram.", { tipo: "telefono" }),
  T("cel-desechable", "Celular Desechable", 900, "iphone-viejo", "Necesario para WhatsApp e Instagram. Permite cambiar de cuenta y usar una cuenta ANÓNIMA (número +58 412 0000000, sesiones de 15 minutos y 5 usos). Aguanta 5 sesiones anónimas: después el celular se destruye y hay que comprar otro.", { tipo: "telefono" }),
  X("computadora", "Computadora", 2500, "laptop-b"), X("laptop-hacker", "Laptop Hacker", 6500, "laptop-a"), X("dron", "Dron S45", 4500, "dron"),
  X("radio-scaner", "Radio / Scaner", 1500, "scaner"), X("desactivador", "Desactivador de aparatos eléctricos", 5500, "desactivador"),
  X("vpn", "Acceso a la Dark Web · 5 días", 5000, "usb", "Necesario para entrar a la Dark Web. Dura 5 días desde la compra.", { dias: 5 }),
  // Neveras (Tool Store): una por usuario y hay que tener casa. Capacidad = objetos de comida que caben.
  ...NEVERAS.map(([sku, name, price, cap, img]) => H(sku, name, price, img, `Capacidad: ${cap} objetos de comida. Solo 1 por usuario y necesitas una casa. La comida guardada dura más.`, { tipo: "nevera", capacidad: cap })),
  // Comida y bebida: cada negocio de comida vende su menú (sku "tienda:producto"). Se guardan en Inventario → Comida. Sin impuestos, máximo $500.
  ...Object.entries(MENUS).flatMap(([neg, lista]) => lista.map((k) => { const [name, sub, tipo, pct, price, horas, calif] = PRODUCTOS[k]; return F(`${neg}:${k}`, name, price, FOTO[k] || k, `+${pct}% de ${tipo}.`, { negocio: neg, sub, consumo: { tipo, pct }, horas, calif, sinImpuesto: true }); })),
];
const VIEJOS = ["agua-botella", "agua-grande", "jugo", "refresco", "empanada", "arepa", "hamburguesa", "pabellon", "pendrive", "radio-comunicacion", "radio-comunicaciones", "scaner", "cel-basico", "cel-estandar", "cel-pro", "cel-max"];
let hecho = false;
export async function sembrar(d) {
  if (hecho) return; hecho = true; const c = d.collection("items");
  await c.deleteMany({ sku: { $in: VIEJOS } });
  const base = { stock: -1, brand: "", year: "", ubicacion: "", impuesto: 0, clase: "" };
  await c.bulkWrite(CATALOGO.flatMap((x) => [
    { updateOne: { filter: { sku: x.sku }, update: { $setOnInsert: { ...base, ...x, v: CATALOGO_V } }, upsert: true } },
    { updateOne: { filter: { sku: x.sku, $or: [{ v: { $exists: false } }, { v: { $lt: CATALOGO_V } }] }, update: { $set: { ...x, v: CATALOGO_V } } } },
  ]));
  for (const [cat, neg] of Object.entries(NEGOCIO_DE)) await c.updateMany({ category: cat, negocio: { $in: [null, ""] } }, { $set: { negocio: neg } }); // artículos creados a mano desde Administración
}
