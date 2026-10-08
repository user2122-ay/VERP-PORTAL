// Rangos del staff. Los DB (asignados desde Administración → Staff) y los de Discord (variables *_ROLE_IDS / *_IDS) se combinan.
// DEVELOPER, FUNDACION, ASUNTOS_INTERNOS y JUNTA_DIRECTIVA pueden hacer todo en Administración.
// MODERACION (Moderador) solo revisa solicitudes.
export const ADMIN_RANKS = ["DEVELOPER", "FUNDACION", "ASUNTOS_INTERNOS", "JUNTA_DIRECTIVA"];
export const FUND_ONLY = ["DEVELOPER", "FUNDACION"];
export const canAdmin = (rank) => ADMIN_RANKS.includes(rank);
export const canReview = (rank) => canAdmin(rank) || rank === "MODERACION";
export const RANK_LABEL = { DEVELOPER: "Developer", FUNDACION: "Fundación", ASUNTOS_INTERNOS: "Asuntos Internos", JUNTA_DIRECTIVA: "Junta Directiva", MODERACION: "Moderador" };
// Rango según los roles de Discord del miembro. Variables (IDs de ROL separados por coma):
// FUNDACION_ROLE_IDS, ASUNTOS_INTERNOS_ROLE_IDS, JUNTA_DIRECTIVA_ROLE_IDS, MODERACION_ROLE_IDS
export const RANGOS = ["FUNDACION", "ASUNTOS_INTERNOS", "JUNTA_DIRECTIVA", "MODERACION"];
export const rankFromRoles = (roles = []) => RANGOS.find((r) => (process.env[r + "_ROLE_IDS"] || "").split(",").map((x) => x.trim()).filter(Boolean).some((id) => roles.includes(id))) || null;
// Roles de las próximas fases (IDs de rol de Discord; se pueden cambiar con variables de entorno).
export const POLICIA_ROLE_IDS = process.env.POLICIA_ROLE_IDS || "1373344936812085280";
export const DELICTIVO_ROLE_IDS = process.env.DELICTIVO_ROLE_IDS || "1373359377217487060";
