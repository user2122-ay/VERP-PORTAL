// Conexión con la API de ER:LC (PRC). Requiere la variable de entorno ERLC_SERVER_KEY (la "Server Key" del servidor privado).
// El dominio viejo (api.policeroleplay.community) ya no funciona: ahora es api.erlc.gg. Se puede cambiar con ERLC_API_URL.
const BASE = (process.env.ERLC_API_URL || "https://api.erlc.gg/v1").replace(/\/$/, "");
const PROXY = (process.env.ERLC_PROXY_URL || "").replace(/\/$/, "");
export const erlcListo = () => !!process.env.ERLC_SERVER_KEY;
const H = () => ({ "server-key": process.env.ERLC_SERVER_KEY, "Content-Type": "application/json" });
// Convierte los errores de la API en un mensaje claro.
function traducir(status, j) {
  const m = String(j?.message || "");
  if (j?.code === 4000 || /not authorized to perform|allowlist/i.test(m)) return "ER:LC rechazó la IP del portal (error 4000): los comandos solo se aceptan desde IPs de confianza. Vercel cambia de IP, así que hay que usar el proxy con IP fija (variable ERLC_PROXY_URL). Mira la carpeta erlc-proxy.";
  if (status === 429) return "ER:LC pidió esperar (límite de uso). Intenta de nuevo en unos segundos";
  if (/offline|no players|empty/i.test(m)) return "El servidor de ER:LC está vacío o apagado: necesita al menos un jugador dentro";
  if ((status === 401 || status === 403) && /key/i.test(m)) return `La Server Key no sirve (revisa ERLC_SERVER_KEY en Vercel): ${m}`;
  return m || `Error ${status}`;
}
export async function erlcComando(command) {
  if (!erlcListo()) return { ok: false, error: "Falta la variable ERLC_SERVER_KEY en Vercel" };
  // Con ERLC_PROXY_URL el comando sale por el proxy (IP fija registrada en api.erlc.gg/server-owners → Settings).
  // Si el proxy está dormido (Render gratis), el primer intento puede fallar: se reintenta una vez esperando que despierte.
  const una = () => PROXY
    ? fetch(`${PROXY}/command`, { method: "POST", headers: { ...H(), "x-proxy-secret": process.env.ERLC_PROXY_SECRET || "" }, body: JSON.stringify({ command }), cache: "no-store", signal: AbortSignal.timeout(50000) })
    : fetch(`${BASE}/server/command`, { method: "POST", headers: H(), body: JSON.stringify({ command }), cache: "no-store" });
  let r = null, fallo = false;
  for (let i = 0; i < (PROXY ? 2 : 1); i++) {
    try { r = await una(); fallo = [502, 503, 504].includes(r.status); } catch { r = null; fallo = true; }
    if (!fallo) break; if (i === 0 && PROXY) await new Promise((x) => setTimeout(x, 6000));
  }
  if (!r) return { ok: false, error: PROXY ? "No se pudo conectar con el proxy de ER:LC. Si está dormido, intenta otra vez en un minuto; revisa también ERLC_PROXY_URL" : "No se pudo conectar con la API de ER:LC" };
  let j = null; try { j = await r.json(); } catch {}
  if (PROXY && r.status === 401 && /clave del proxy|clave incorrecta/i.test(String(j?.message || ""))) return { ok: false, status: 401, error: "El proxy rechazó la clave: ERLC_PROXY_SECRET en Vercel debe ser igual a PROXY_SECRET en Render" };
  return r.ok ? { ok: true } : { ok: false, status: r.status, error: traducir(r.status, j) };
}
export async function erlcJugadores() {
  if (!erlcListo()) return null;
  try { const r = await fetch(`${BASE}/server/players`, { headers: H(), cache: "no-store" }); if (!r.ok) return null; const j = await r.json(); return Array.isArray(j) ? j : null; } catch { return null; }
}
