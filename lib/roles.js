// Rangos del staff. Se asignan SOLO desde Administración → Staff (ya no se leen roles ni IDs de Discord).
// DEVELOPER, FUNDACION, ASUNTOS_INTERNOS y JUNTA_DIRECTIVA pueden hacer todo en Administración.
// MODERACION (Moderador) solo revisa solicitudes.
export const ADMIN_RANKS = ["DEVELOPER", "FUNDACION", "ASUNTOS_INTERNOS", "JUNTA_DIRECTIVA"];
export const FUND_ONLY = ["DEVELOPER", "FUNDACION"];
export const canAdmin = (rank) => ADMIN_RANKS.includes(rank);
// Apertura del servidor: solo Developer, Fundación, Junta Directiva y el Auxiliar Apertura (Auxiliar Apertura es una responsabilidad que SOLO dan Fundación y el Developer: se suma al rango que ya tenga la persona; si no tiene otro rango solo ve el panel de Apertura).
export const APERTURA_RANKS = ["DEVELOPER", "FUNDACION", "JUNTA_DIRECTIVA", "AUXILIAR_APERTURA"];
export const canApertura = (rank, u) => APERTURA_RANKS.includes(rank) || !!u?.auxApertura; // u.auxApertura: responsabilidad que se le da a cualquier staff (Asuntos Internos, Moderador...)
export const canReview = (rank) => canAdmin(rank) || rank === "MODERACION";
// Quién puede añadir o quitar staff: Developer, Fundación y Asuntos Internos.
export const canStaff = (rank) => ["DEVELOPER", "FUNDACION", "ASUNTOS_INTERNOS"].includes(rank);
export const RANK_LABEL = { DEVELOPER: "Developer", FUNDACION: "Fundación", ASUNTOS_INTERNOS: "Asuntos Internos", JUNTA_DIRECTIVA: "Junta Directiva", MODERACION: "Moderador", AUXILIAR_APERTURA: "Auxiliar Apertura" };
// Roles de las próximas fases (IDs de rol de Discord; se pueden cambiar con variables de entorno).
export const POLICIA_ROLE_IDS = process.env.POLICIA_ROLE_IDS || "1373344936812085280";
export const DELICTIVO_ROLE_IDS = process.env.DELICTIVO_ROLE_IDS || "1373359377217487060";
