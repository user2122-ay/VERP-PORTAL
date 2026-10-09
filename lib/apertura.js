// Apertura del servidor: votación, abrir y cerrar. Se envía por un webhook de Discord (variable DISCORD_WEBHOOK_APERTURA).
export const ROL_PING = "1472420048197910771"; // @〢Civil Venezolano
export const GIF_VOTACION = "https://i.imgur.com/aF3Tt4M.gif";
export const GIF_ABIERTO = "https://cdn.discordapp.com/attachments/1514411169102827611/1521952118834073890/Server_Abierto_2.gif";
export const GIF_CERRADO = "https://static2.klipy.com/ii/d6b0ce929193df3c242ac34b5654d2ce/1e/34/L49kBITj.gif";
const LOGO = "<:LogoOficialVERP:1436117451120312401>";
const url = () => process.env.DISCORD_WEBHOOK_APERTURA || "";
export const aperturaListo = () => /^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\//.test(url());
const nota = (n) => (n ? `\n📌 ${n}\n` : "");
// Sin encuesta: otro bot externo pone las reacciones. El ping va FUERA del embed.
function armar(tipo, n) {
  const base = { username: "VE:RP", allowed_mentions: { parse: [] } }, ping = { content: `<@&${ROL_PING}>`, allowed_mentions: { roles: [ROL_PING] } };
  if (tipo === "votacion") return { ...base, ...ping,
    embeds: [{ color: 0x2563eb, image: { url: GIF_VOTACION },
      description: `# ${LOGO}  | VOTACIONES\n-# Decisión para abrir nuestro servidor\n\n 🟢  - Si vas a entrar\n 🟡  - Entrare mas tarde\n${nota(n)}\n***La decision la tomas tu... Te esperamos.*** <@&${ROL_PING}>` }] };
  if (tipo === "abrir") return { ...base, ...ping,
    embeds: [{ color: 0x16a34a, image: { url: GIF_ABIERTO },
      description: `# ${LOGO} | Apertura\n-# Inicio de todo rol valido en el juego y en canales (IC)\n“Mas que una comunidad... una familia.” 🌴✨\n\nAquí no se entra, ¡se aterriza como en Margarita con brisa en la cara y música en el alma! Este servidor es tu pasaporte directo a una comunidad llena de ritmo, respeto y buena vibra... <@&${ROL_PING}>\n${nota(n)}\n**(Servidor en Listado)**\n**Codigo:** VNZRP` }] };
  return { ...base, embeds: [{ color: 0xdc2626, image: { url: GIF_CERRADO },
    description: `# ${LOGO} | Servidor Cerrado\n-# Se termina todo rol en el juego y en canales (IC)\n“Mas que una comunidad... una familia.” 🌴✨\n${nota(n)}\n**Los esperamos en la siguiente apertura...**` }] };
}
export async function enviarApertura(tipo, n) {
  if (!aperturaListo()) return { ok: false, error: "Falta DISCORD_WEBHOOK_APERTURA en Vercel (o la URL no es de un webhook de Discord)" };
  const mandar = async (p) => { const r = await fetch(url() + (url().includes("?") ? "&" : "?") + "wait=true", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p), cache: "no-store" }); let j = null; try { j = await r.json(); } catch {} return { r, j }; };
  try {
    const { r, j } = await mandar(armar(tipo, n));
    return r.ok ? { ok: true } : { ok: false, error: j?.message || `Discord respondió ${r.status}` };
  } catch { return { ok: false, error: "No se pudo conectar con Discord" }; }
}
