// Rangos de la MDT. Los allanamientos los aprueba SOLO el Ministro del Interior (o el Developer, para pruebas).
// Rangos por departamento (en el orden de la lista que dio Fundación).
export const RANGOS_POR_DEPTO = {
  "Ministro del Interior": ["Ministro del Interior"],
  "Policía Nacional Bolivariana": ["Oficial", "Primer Oficial", "Oficial Jefe", "Inspector", "Primer Inspector", "Inspector Jefe", "Comisario", "Primer Comisario", "Comisario Jefe", "Comisario General", "Comisario Mayor", "Comisario Superior"],
  CICPC: ["Detective", "Detective Agregado", "Detective Jefe", "Inspector", "Inspector Agregado", "Inspector Jefe", "Comisario", "Comisario Jefe", "Comisario General", "Comisario General Superior"],
  SEBIN: ["Comisario Superior", "Comisario General", "Comisario Jefe", "Primer Comisario", "Comisario", "Inspector Jefe", "Primer Inspector", "Inspector", "Detective"],
  Bomberos: ["Distinguido", "Cabo Segundo", "Cabo Primero", "Sargento Segundo", "Sargento Primero", "Sargento Mayor", "Teniente", "Primer Teniente", "Capitán", "Mayor", "Teniente Coronel", "Coronel", "General de Bomberos", "Primer General o Primera Generala"],
  "Protección Civil": ["Oficial de Protección Civil I", "Oficial de Protección Civil II", "Oficial de Protección Civil III", "Oficial Supervisor de Protección Civil I", "Oficial Supervisor de Protección Civil II", "Oficial Supervisor de Protección Civil III", "Coordinador de Protección Civil I", "Coordinador de Protección Civil II", "Coordinador General de Protección Civil"],
};
// Nombre completo de cada cuerpo (la clave corta es la que se guarda en la base de datos).
export const DEPTO_NOMBRE = { "Policía Nacional Bolivariana": "Cuerpo de la Policía Nacional Bolivariana", CICPC: "Cuerpo de Investigaciones Científicas, Penales y Criminalísticas", SEBIN: "Servicio Bolivariano de Inteligencia Nacional", Bomberos: "Dirección General Nacional de Bomberos", "Protección Civil": "Dirección Nacional de Protección Civil y Administración de Desastres" };
export const nombreDepto = (d) => DEPTO_NOMBRE[d] || d;
// Bomberos y Protección Civil solo ven los reportes 911 y su sueldo en la MDT.
export const DEPTOS_911 = ["Bomberos", "Protección Civil"];
export const solo911 = (ag) => !!ag && DEPTOS_911.includes(ag.depto);
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
