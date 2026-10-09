// Apertura del servidor: votación, abrir y cerrar. Se envía por un webhook de Discord (variable DISCORD_WEBHOOK_APERTURA).
export const ROL_PING = "1472420048197910771"; // @〢Civil Venezolano
export const GIF = "https://i.imgur.com/aF3Tt4M.gif";
const LOGO = "<:LogoOficialVERP:1436117451120312401>";
const url = () => process.env.DISCORD_WEBHOOK_APERTURA || "";
export const aperturaListo = () => /^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\//.test(url());
const nota = (n) => (n ? `\n📌 ${n}\n` : "");
function armar(tipo, n, quien) {
  const base = { username: "VE:RP", allowed_mentions: { parse: [] } };
  if (tipo === "votacion") return { ...base, content: `<@&${ROL_PING}>`, allowed_mentions: { roles: [ROL_PING] },
    embeds: [{ color: 0x2563eb, image: { url: GIF }, footer: { text: `Convoca: ${quien}` }, timestamp: new Date().toISOString(),
      description: `# ${LOGO}  | VOTACIONES\n-# Decisión para abrir nuestro servidor\n\n 🟢  - Si vas a entrar\n 🟡  - Entrare mas tarde\n${nota(n)}\n***La decision la tomas tu... Te esperamos.*** <@&${ROL_PING}>` }],
    poll: { question: { text: "¿Vas a entrar al servidor?" }, answers: [{ poll_media: { text: "Si vas a entrar", emoji: { name: "🟢" } } }, { poll_media: { text: "Entraré más tarde", emoji: { name: "🟡" } } }], duration: 24, allow_multiselect: false } };
  if (tipo === "abrir") return { ...base, content: `<@&${ROL_PING}>`, allowed_mentions: { roles: [ROL_PING] },
    embeds: [{ color: 0x16a34a, footer: { text: `Abre: ${quien}` }, timestamp: new Date().toISOString(),
      description: `# ${LOGO}  | SERVIDOR ABIERTO\n-# ¡Ya puedes entrar!\n\n 🟢  - El servidor está abierto, entra ya\n${nota(n)}\n***Te esperamos en las calles de Venezuela.*** <@&${ROL_PING}>` }] };
  return { ...base, embeds: [{ color: 0xdc2626, footer: { text: `Cierra: ${quien}` }, timestamp: new Date().toISOString(),
    description: `# ${LOGO}  | SERVIDOR CERRADO\n-# Gracias por jugar con nosotros\n\n 🔴  - El servidor se encuentra cerrado\n${nota(n)}\n***Nos vemos en la próxima apertura.***` }] };
}
export async function enviarApertura(tipo, n, quien) {
  if (!aperturaListo()) return { ok: false, error: "Falta DISCORD_WEBHOOK_APERTURA en Vercel (o la URL no es de un webhook de Discord)" };
  const mandar = async (p) => { const r = await fetch(url() + (url().includes("?") ? "&" : "?") + "wait=true", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p), cache: "no-store" }); let j = null; try { j = await r.json(); } catch {} return { r, j }; };
  try {
    const p = armar(tipo, n, quien); let { r, j } = await mandar(p);
    if (!r.ok && p.poll) { const { poll, ...sin } = p; ({ r, j } = await mandar(sin)); } // si el webhook no acepta encuestas, se manda sin la encuesta
    return r.ok ? { ok: true } : { ok: false, error: j?.message || `Discord respondió ${r.status}` };
  } catch { return { ok: false, error: "No se pudo conectar con Discord" }; }
}
