// Permisos del staff. Los IDs vienen de las variables FUNDACION_IDS, ASUNTOS_INTERNOS_IDS, MODERACION_IDS.
// MODERACION no puede tocar nada por ahora. ASUNTOS_INTERNOS y FUNDACION pueden todo.
// Para algo exclusivo de Fundación más adelante: FUND_ONLY.includes(rank)
export const ADMIN_RANKS = ["FUNDACION", "ASUNTOS_INTERNOS"];
export const FUND_ONLY = ["FUNDACION"];
export const canAdmin = (rank) => ADMIN_RANKS.includes(rank);
// Rango según los roles de Discord del miembro. Variables (IDs de ROL separados por coma):
// FUNDACION_ROLE_IDS, ASUNTOS_INTERNOS_ROLE_IDS, MODERACION_ROLE_IDS
export const RANGOS = ["FUNDACION", "ASUNTOS_INTERNOS", "MODERACION"];
export const rankFromRoles = (roles = []) => RANGOS.find((r) => (process.env[r + "_ROLE_IDS"] || "").split(",").map((x) => x.trim()).filter(Boolean).some((id) => roles.includes(id))) || null;
