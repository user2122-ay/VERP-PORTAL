// Bancos del servidor. Precio = lo que cuesta la tarjeta en el Mercado.
export const BANCOS = {
  bvc: { nombre: "Banco de Venezuela Community", corto: "BVC", precio: 10, pref: "7700" },
  mer: { nombre: "Mercantil VERP", corto: "Mercantil VERP", precio: 30, pref: "7800" },
};
export const ESPERA_MIN = 3; // minutos que tarda una transferencia entre bancos distintos
export const feeInterbancario = (fee) => fee * 3; // impuesto de banco a banco = 3 veces el normal
