import { NEGOCIOS } from "./negocios";
// Catálogo en código: para agregar objetos nuevos solo añade una línea y vuelve a desplegar (se crean solos en el Mercado).
// Después los precios se editan desde el Mercado, por el dueño del negocio o por Administración.
const H = (sku, name, price, desc) => ({ sku, name, price, desc, category: "Herramientas", negocio: "toolstore" });
const T = (sku, name, price, desc, extra = {}) => ({ sku, name, price, desc, category: "Telefonía", negocio: "movil", ...extra });
export const CATALOGO = [
  H("taladro", "Taladro", 8000, "Se requiere para robar."), H("palanca", "Palanca", 6000, "Se requiere para robar."), H("pendrive", "Pendrive", 12000, "Necesario para acceder al mercado negro."),
  H("guantes-cuero", "Guantes de cuero", 2500, ""), H("guantes-quirurgicos", "Guantes quirúrgicos", 2500, ""), H("radio-comunicacion", "Radio de comunicación", 4500, ""),
  H("scaner", "Scanner", 7000, ""), H("placa-deshabilitadora", "Placa deshabilitadora", 15000, ""), H("martillo", "Martillo", 3000, ""), H("bate", "Bate", 3500, ""),
  // Celulares de ejemplo: reemplázalos por los de la tienda del servidor (nombre y precio).
  T("cel-basico", "Celular Básico", 1500, "Necesario para WhatsApp e Instagram.", { tipo: "telefono" }), T("cel-estandar", "Celular Estándar", 3000, "Necesario para WhatsApp e Instagram.", { tipo: "telefono" }),
  T("cel-pro", "Celular Pro", 5500, "Necesario para WhatsApp e Instagram.", { tipo: "telefono" }), T("cel-max", "Celular Max", 9000, "Necesario para WhatsApp e Instagram.", { tipo: "telefono" }),
  T("dron", "Dron", 9000, ""), T("radio-comunicaciones", "Radio de comunicaciones", 4500, ""), T("vpn", "VPN", 2500, "Necesaria para acceder a la Dark Web."),
];
let hecho = false;
export async function sembrar(d) {
  if (hecho) return; hecho = true; const c = d.collection("items");
  await c.bulkWrite(CATALOGO.map((x) => ({ updateOne: { filter: { sku: x.sku }, update: { $setOnInsert: { ...x, stock: -1, brand: "", year: "", img: "", ubicacion: "", impuesto: 0, clase: "" } }, upsert: true } })));
  await c.updateMany({ category: "Concesionario", negocio: { $exists: false } }, { $set: { negocio: "concesionario" } });
}
