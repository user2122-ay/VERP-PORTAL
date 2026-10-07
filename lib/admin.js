import { apiUser, rankOf } from "./auth";
import { canAdmin, rankFromRoles } from "./roles";
// El bot consulta en vivo los roles del miembro en el Discord; si Discord no responde se usa el último rango guardado.
export async function staffRank(u) {
  try {
    const r = await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${u.id}`, { headers: { Authorization: "Bot " + process.env.DISCORD_BOT_TOKEN }, cache: "no-store" });
    if (r.ok) return rankFromRoles((await r.json()).roles) || rankOf(u.id);
    if (r.status === 404) return rankOf(u.id);
  } catch {}
  return rankOf(u.id) || u.rank || null;
}
export async function adminUser() { const u = await apiUser(); if (!u) return null; const rank = await staffRank(u); return canAdmin(rank) ? { ...u, rank } : null; }
