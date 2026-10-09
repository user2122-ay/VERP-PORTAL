export const WA = "VE WhatsApp";
export const CHIP_PRECIO = 2;
// Número = +58 + (414 | 424 | 412 al azar) + número de cédula de 7 dígitos. Ej: cédula V-00.000.002 -> +58 414 0000002
export const OPS = ["414", "424", "412"];
export const numeroDe = (cedNum, op) => "+58" + op + String(cedNum).padStart(7, "0").slice(-7);
export const fmtTel = (n) => String(n).replace(/^\+58(\d{3})(\d{7})$/, "+58 $1 $2");
// Acepta "0412 1234567", "+58 412 1234567", "4121234567"... y devuelve "+584121234567" (o null).
export function normNum(s) { let d = String(s || "").replace(/\D/g, ""); if (d.startsWith("58")) d = d.slice(2); if (d.startsWith("0")) d = d.slice(1); return d.length === 10 ? "+58" + d : null; }
// WhatsApp (e Instagram) necesitan teléfono comprado + chip + plan activo.
export const tieneTelefono = (u) => (u?.inventory || []).some((i) => i.tipo === "telefono");
// Celular Desechable: puede cambiar de cuenta y usar una cuenta ANÓNIMA con número falso. Cada sesión dura 15 minutos y sirve para 5 mensajes; tras 5 sesiones el celular se destruye.
export const ANON_MIN = 15, ANON_USOS = 5;
export const esDesechable = (u) => (u?.inventory || []).some((i) => i.sku === "cel-desechable");
export const anonActiva = (u) => { const a = u?.wa?.anon; return !!a && +new Date(a.exp) > Date.now() && (a.usos || 0) < (a.max || ANON_USOS); };
// Las cuentas anónimas siempre muestran el MISMO número falso: +58 412 0000000 (así nunca coincide con un número real). No se les puede responder.
export const ANON_NUM = "+584120000000", ANON_SESIONES = 5; // cada Celular Desechable aguanta 5 sesiones anónimas y luego se destruye
export const telDesechable = (u) => (u?.inventory || []).find((i) => i.sku === "cel-desechable") || null;
export const waListo = (u) => tieneTelefono(u) && !!(u?.chip || esDesechable(u)); // el plan de datos ya no es obligatorio
