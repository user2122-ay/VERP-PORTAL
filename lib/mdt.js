// Rangos de la MDT. Los allanamientos los aprueba SOLO el Ministro del Interior (o el Developer, para pruebas).
// Rangos por departamento (en el orden de la lista que dio Fundación).
export const RANGOS_POR_DEPTO = {
  "Ministro del Interior": ["Ministro del Interior"],
  "Policía Nacional Bolivariana": ["Oficial", "Primer Oficial", "Oficial Jefe", "Inspector", "Primer Inspector", "Inspector Jefe", "Comisario", "Primer Comisario", "Comisario Jefe", "Comisario General", "Comisario Mayor", "Comisario Superior"],
  CICPC: ["Detective", "Detective Agregado", "Detective Jefe", "Inspector", "Inspector Agregado", "Inspector Jefe", "Comisario", "Comisario Jefe", "Comisario General", "Comisario General Superior"],
  SEBIN: ["Comisario Superior", "Comisario General", "Comisario Jefe", "Primer Comisario", "Comisario", "Inspector Jefe", "Primer Inspector", "Inspector", "Detective"],
};
export const DEPTOS = Object.keys(RANGOS_POR_DEPTO);
export const RANGOS_MDT = [...new Set(Object.values(RANGOS_POR_DEPTO).flat())];
// El sueldo ya no se asigna en Administración: el Ministro lo fija por departamento y rango en la Tesorería (config "sueldos").
export const claveSueldo = (depto, rango) => `${depto}|${rango}`;
// Solo el Ministro del Interior (o el Developer, para pruebas) ve la Tesorería y libera los sueldos.
export const esMinistro = (ag) => !!ag && (ag.rango === "Ministro del Interior" || ag.rango === "Developer");
export const SEMANA = 7 * 864e5; // los sueldos se pagan cada 7 días
export const aprobador = (ag) => !!ag && (ag.rango === "Developer" || ag.rango === "Ministro del Interior");
// Agente de la MDT: el que Administración asignó. El Developer entra siempre (placa DEV-001).
export const agenteDe = (u) => u?.agente || (u?.dev ? { rango: "Developer", placa: "DEV-001", depto: "Desarrollo" } : null);
export const casaRef = (name, at) => `${name}|${new Date(at).toISOString()}`;
