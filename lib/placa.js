// Placa venezolana: 2 letras + 3 números + 2 letras (ej: AB123CD)
const L = "ABCDEFGHJKLMNPRSTUVXYZ", l = () => L[Math.floor(Math.random() * L.length)], n = () => Math.floor(Math.random() * 10);
export const placa = () => l() + l() + n() + n() + n() + l() + l();
