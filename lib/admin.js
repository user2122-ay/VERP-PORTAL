import { apiUser, rankOf } from "./auth";
import { canAdmin, canReview, rankFromRoles } from "./roles";
// El bot consulta en vivo los roles del miembro en el Discord. Se combinan con el rango asignado desde Administración → Staff.
export async function staffRank(u) {
  if (u.dev) return "DEVELOPER";
  let live; // undefined = Discord no respondió
  try {
    const r = await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${u.id}`, { headers: { Authorization: "Bot " + process.env.DISCORD_BOT_TOKEN }, cache: "no-store" });
    live = r.ok ? rankFromRoles((await r.json()).roles) : r.status === 404 ? null : undefined;
  } catch { live = undefined; }
  return live || rankOf(u.id) || u.staff || (live === undefined ? u.rank : null) || null;
}
export async function adminUser() { const u = await apiUser(); if (!u) return null; const rank = await staffRank(u); return canAdmin(rank) ? { ...u, rank } : null; }
// Admin completo o Moderador (el Moderador solo revisa solicitudes).
export async function reviewUser() { const u = await apiUser(); if (!u) return null; const rank = await staffRank(u); return canReview(rank) ? { ...u, rank } : null; }
