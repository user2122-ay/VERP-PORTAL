// Bancos del servidor. Precio = lo que cuesta la tarjeta en el Mercado.
export const BANCOS = {
  bvc: { nombre: "Banco de Venezuela Community", corto: "BVC", precio: 10, pref: "7700" },
  mer: { nombre: "Mercantil VERP", corto: "Mercantil VERP", precio: 30, pref: "7800" },
  pro: { nombre: "VE:RP Provincial", corto: "Provincial", precio: 35, pref: "7600", semanal: 2 },
  com: { nombre: "Tarjeta de Comerciante", corto: "Comerciante", precio: 50, pref: "7900", comercial: true, semanal: 5 },
};
export const ESPERA_MIN = 3; // minutos que tarda una transferencia entre bancos distintos
export const feeInterbancario = (fee) => fee * 3; // impuesto de banco a banco = 3 veces el normal
