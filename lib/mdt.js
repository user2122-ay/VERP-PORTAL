// Rangos de la MDT (de menor a mayor). Desde "Comisario" en adelante se aprueban los allanamientos.
export const RANGOS_MDT = ["Agente", "Oficial", "Sargento", "Inspector", "Comisario", "Comisario Jefe", "Director", "Ministro del Interior"];
export const DEPTOS = ["Ministro del Interior", "Policía Nacional Bolivariana", "SEBIN", "CICPC"];
// Solo el Ministro del Interior (o el Developer, para pruebas) ve la Tesorería y libera los sueldos.
export const esMinistro = (ag) => !!ag && (ag.rango === "Ministro del Interior" || ag.rango === "Developer");
export const SEMANA = 7 * 864e5; // los sueldos se pagan cada 7 días
export const aprobador = (ag) => !!ag && (ag.rango === "Developer" || RANGOS_MDT.indexOf(ag.rango) >= RANGOS_MDT.indexOf("Comisario"));
// Agente de la MDT: el que Administración asignó. El Developer entra siempre (placa DEV-001).
export const agenteDe = (u) => u?.agente || (u?.dev ? { rango: "Developer", placa: "DEV-001", depto: "Desarrollo" } : null);
export const casaRef = (name, at) => `${name}|${new Date(at).toISOString()}`;
