export const WA = "VE WhatsApp";
export const CHIP_PRECIO = 2;
const OPS = ["412", "414", "424", "416", "426"];
export const nuevoNumero = () => "+58" + OPS[Math.floor(Math.random() * OPS.length)] + String(Math.floor(Math.random() * 1e7)).padStart(7, "0");
export const fmtTel = (n) => String(n).replace(/^\+58(\d{3})(\d{7})$/, "+58 $1 $2");
// Acepta "0412 1234567", "+58 412 1234567", "4121234567"... y devuelve "+584121234567" (o null).
export function normNum(s) { let d = String(s || "").replace(/\D/g, ""); if (d.startsWith("58")) d = d.slice(2); if (d.startsWith("0")) d = d.slice(1); return d.length === 10 ? "+58" + d : null; }
