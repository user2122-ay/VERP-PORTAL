// Licencias: Conducir, Armas y Embarcaciones. Cada licencia es personal y lleva un número inventado (LC-K7QD-3MX9),
// con un formato que no se parece a los documentos reales de Venezuela.
export const LIC = { conducir: { sku: "licencia-conducir", nombre: "Licencia de Conducir", pref: "LC" }, armas: { sku: "licencia-armas", nombre: "Licencia de Armas", pref: "LA" }, embarcaciones: { sku: "licencia-embarcaciones", nombre: "Licencia de Embarcaciones", pref: "LE" } };
// Tipo de licencia de un artículo del inventario o del mercado (por sku, o por nombre si lo creó el staff a mano).
export const licTipo = (i) => {
  if (!i || i.category !== "Licencias") return null;
  const k = Object.keys(LIC).find((t) => LIC[t].sku === i.sku); if (k) return k;
  return /conducir/i.test(i.name) ? "conducir" : /arma/i.test(i.name) ? "armas" : /embarc/i.test(i.name) ? "embarcaciones" : null;
};
export const tieneLic = (u, tipo) => (u?.inventory || []).some((i) => licTipo(i) === tipo);
const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = (n) => Array.from({ length: n }, () => A[Math.floor(Math.random() * A.length)]).join("");
export const numeroLicencia = (tipo) => `${LIC[tipo]?.pref || "LV"}-${r(4)}-${r(4)}`;
