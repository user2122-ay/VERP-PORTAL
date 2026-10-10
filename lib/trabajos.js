// Trabajos secundarios: pago por hora. Se envía una solicitud con evidencias y el staff (Moderación hasta Junta Directiva) la revisa.
// [clave, nombre, pago por hora]
export const TRABAJOS = [
  ["cafeterias", "Cafeterías", 2300], ["bar", "Bar", 1980], ["talleres", "Talleres", 2000], ["comida-rapida", "Comida rápida", 1560],
  ["transporte-publico", "Transporte público", 2500], ["transporte-privado", "Transporte privado", 3000], ["correos", "Correos", 1500],
  ["basurero", "Basurero", 2100], ["gasolineras", "Gasolineras", 2100],
];
export const trabajoDe = (k) => TRABAJOS.find((t) => t[0] === k) || null;
export const MAX_HORAS = 24, MAX_PENDIENTES = 5;
