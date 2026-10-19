// Trabajos secundarios: pago por hora. Se envía una solicitud con evidencias y el staff (Moderación hasta Junta Directiva) la revisa.
// [clave, nombre, pago por hora]
export const TRABAJOS = [
  ["cafeterias", "Cafeterías", 1000], ["bar", "Bar", 1000], ["talleres", "Talleres", 1000], ["comida-rapida", "Comida rápida", 1000],
  ["transporte-publico", "Transporte público", 1000], ["transporte-privado", "Transporte privado", 1000], ["correos", "Correos", 1000],
  ["basurero", "Basurero", 1000], ["gasolineras", "Gasolineras", 1000],
];
export const trabajoDe = (k) => TRABAJOS.find((t) => t[0] === k) || null;
export const MAX_HORAS = 24, MAX_PENDIENTES = 5;
