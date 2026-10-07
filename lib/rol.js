import { DELICTIVO_ROLE_IDS, POLICIA_ROLE_IDS } from "./roles";
const ids = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
// Roles actuales del miembro en el Discord (consulta en vivo con el bot). null si Discord no responde.
export async function rolesDe(uid) {
  try { const r = await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${uid}`, { headers: { Authorization: "Bot " + process.env.DISCORD_BOT_TOKEN }, cache: "no-store" }); if (r.ok) return (await r.json()).roles || []; } catch {}
  return null;
}
export const flagsDe = (r) => ({ delictivo: !!r && ids(DELICTIVO_ROLE_IDS).some((x) => r.includes(x)), policia: !!r && ids(POLICIA_ROLE_IDS).some((x) => r.includes(x)) });
// Verificación en vivo para entrar a paneles sensibles (k = "delictivo" | "policia"). Si Discord falla, se niega.
export async function esRol(u, k) { return !!flagsDe(await rolesDe(u.id))[k]; }
export const nombreDe = (u) => (u.cedula ? `${u.cedula.nombres.split(" ")[0]} ${u.cedula.apellidos.split(" ")[0]}` : u.name);
