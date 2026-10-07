// Catálogo en código: para agregar objetos nuevos solo añade una línea y vuelve a desplegar (se crean solos en el Mercado).
// Los precios se editan después desde el Mercado (dueño del negocio o Administración).
// Si cambias nombres, precios o fotos aquí, SUBE CATALOGO_V en 1: así se aplican una sola vez sin pisar los precios que ya editaron los dueños después.
import { NEGOCIO_DE } from "./negocios";
export const CATALOGO_V = 2;
export const COLORES_CASA = ["Blanco", "Beige", "Gris", "Negro", "Azul", "Verde", "Rojo", "Amarillo"];
const mk = (category, negocio) => (sku, name, price, img, desc = "", extra = {}) => ({ sku, name, price, desc, img: `/items/${img}.jpg`, category, negocio, ...extra });
const LC = mk("Licencias", null), H = mk("Herramientas", "toolstore"), T = mk("Telefonía", "movil"), X = mk("Tecnología", "movil");
export const CATALOGO = [
  LC("licencia-conducir", "Licencia de Conducir", 600, "licencia-conducir", "Obligatoria para comprar vehículos."), LC("licencia-armas", "Licencia de Armas", 2500, "licencia-armas", "Obligatoria para comprar armas."),
  LC("licencia-embarcaciones", "Licencia de Embarcaciones", 10000, "licencia-embarcaciones", "Para embarcaciones (próximamente)."),
  H("palanca", "Palanca", 800, "palanca", "Se requiere para robar."), H("taladro", "Taladro", 500, "taladro", "Se requiere para robar."),
  H("martillo", "Martillo", 900, "martillo"), H("bate", "Bate de béisbol", 800, "bate"),
  H("guantes-cuero", "Guantes de cuero", 3500, "guantes-cuero"), H("guantes-quirurgicos", "Guantes quirúrgicos", 1500, "guantes-quirurgicos"),
  H("placa-deshabilitadora", "Placa debilitadora", 1000, "placa-deshabilitadora"),
  T("cel-iphone", "Ipone P Max 28", 1800, "iphone-nuevo", "Necesario para WhatsApp e Instagram.", { tipo: "telefono" }),
  T("cel-samsun", "Samsun Galaxy S78 Ultra", 1790, "samsung", "Necesario para WhatsApp e Instagram.", { tipo: "telefono" }),
  T("cel-desechable", "Celular Desechable", 900, "iphone-viejo", "Necesario para WhatsApp e Instagram.", { tipo: "telefono" }),
  X("computadora", "Computadora", 2500, "laptop-b"), X("laptop-hacker", "Laptop Hacker", 6500, "laptop-a"), X("dron", "Dron S45", 4500, "dron"),
  X("radio-scaner", "Radio / Scaner", 1500, "scaner"), X("desactivador", "Desactivador de aparatos eléctricos", 5500, "desactivador"),
  X("vpn", "Acceso a la Dark Web · 5 días", 5000, "usb", "Necesario para entrar a la Dark Web. Dura 5 días desde la compra.", { dias: 5 }),
];
const VIEJOS = ["pendrive", "radio-comunicacion", "radio-comunicaciones", "scaner", "cel-basico", "cel-estandar", "cel-pro", "cel-max"];
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
