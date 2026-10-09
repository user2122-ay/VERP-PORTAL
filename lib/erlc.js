// Conexión con la API de ER:LC (PRC). Requiere la variable de entorno ERLC_SERVER_KEY (la "Server Key" del servidor privado).
// El dominio viejo (api.policeroleplay.community) ya no funciona: ahora es api.erlc.gg. Se puede cambiar con ERLC_API_URL.
const BASE = (process.env.ERLC_API_URL || "https://api.erlc.gg/v1").replace(/\/$/, "");
export const erlcListo = () => !!process.env.ERLC_SERVER_KEY;
const H = () => ({ "server-key": process.env.ERLC_SERVER_KEY, "Content-Type": "application/json" });
// Convierte los errores de la API en un mensaje claro.
function traducir(status, j) {
  const m = String(j?.message || "");
  if (status === 429) return "ER:LC pidió esperar (límite de uso). Intenta de nuevo en unos segundos";
  if (/offline|no players|empty/i.test(m)) return "El servidor de ER:LC está vacío o apagado: necesita al menos un jugador dentro";
  if ((status === 401 || status === 403) && /key/i.test(m)) return `La Server Key no sirve (revisa ERLC_SERVER_KEY en Vercel): ${m}`;
  return m || `Error ${status}`;
}
export async function erlcComando(command) {
  if (!erlcListo()) return { ok: false, error: "Falta la variable ERLC_SERVER_KEY en Vercel" };
  try {
    const r = await fetch(`${BASE}/server/command`, { method: "POST", headers: H(), body: JSON.stringify({ command }), cache: "no-store" }); let j = null; try { j = await r.json(); } catch {}
    return r.ok ? { ok: true } : { ok: false, status: r.status, error: traducir(r.status, j) };
  } catch { return { ok: false, error: "No se pudo conectar con la API de ER:LC" }; }
}
export async function erlcJugadores() {
  if (!erlcListo()) return null;
  try { const r = await fetch(`${BASE}/server/players`, { headers: H(), cache: "no-store" }); if (!r.ok) return null; const j = await r.json(); return Array.isArray(j) ? j : null; } catch { return null; }
}
