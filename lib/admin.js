import { apiUser } from "./auth";
import { canAdmin, canReview } from "./roles";
// Staff = solo quienes fueron asignados en Administración → Staff (o el Developer). Para entrar piden su placa (sesión de 8 horas).
export const adminFresca = (u) => !!(u.adminSesion && Date.now() - +new Date(u.adminSesion) < 35 * 6e4);
export const placaStaff = (u) => (u.dev ? u.staffPlaca || "DEV-001" : u.staffPlaca || null);
export async function staffRank(u) { return u.dev ? "DEVELOPER" : u.staff || null; }
export async function adminUser() { const u = await apiUser(); if (!u || !adminFresca(u)) return null; const rank = await staffRank(u); return canAdmin(rank) ? { ...u, rank } : null; }
// Admin completo o Moderador (el Moderador solo revisa solicitudes).
export async function reviewUser() { const u = await apiUser(); if (!u || !adminFresca(u)) return null; const rank = await staffRank(u); return canReview(rank) ? { ...u, rank } : null; }
