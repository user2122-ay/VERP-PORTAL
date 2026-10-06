// Permisos del staff. Los IDs vienen de las variables FUNDACION_IDS, ASUNTOS_INTERNOS_IDS, MODERACION_IDS.
// MODERACION no puede tocar nada por ahora. ASUNTOS_INTERNOS y FUNDACION pueden todo.
// Para algo exclusivo de Fundación más adelante: FUND_ONLY.includes(rank)
export const ADMIN_RANKS = ["FUNDACION", "ASUNTOS_INTERNOS"];
export const FUND_ONLY = ["FUNDACION"];
export const canAdmin = (rank) => ADMIN_RANKS.includes(rank);
