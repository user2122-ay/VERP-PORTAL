// Tienda Ministerio: mejoras que solo el Ministro del Interior puede comprar con el dinero de la Tesorería.
export const MEJORAS = [
  { key: "armas", nombre: "Mejoras de Armas Generales", precio: 260000 },
  { key: "vehiculos", nombre: "Mejoras para Vehículos", precio: 450000 },
  { key: "tacticas-pol", nombre: "Mejoras Tácticas Policiales", precio: 230000 },
  { key: "tacticas-esp", nombre: "Mejoras Tácticas Especiales", precio: 340000 },
];
export const DURACION = 7 * 864e5, MAX_SEMANA = 3; // duran 7 días; máximo 3 compras por semana de cada una
export const AVISO = "No se ha hecho mantenimiento del Ministerio. Por favor, invierte el dinero de la Tesorería en las mejoras para tener un personal estable que pueda mantener la paz. — Ministro J. Boscan";
