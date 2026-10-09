// Conexión con la API de ER:LC (PRC). Requiere la variable de entorno ERLC_SERVER_KEY (la "Server Key" del servidor privado).
const BASE = "https://api.policeroleplay.community/v1";
export const erlcListo = () => !!process.env.ERLC_SERVER_KEY;
const H = () => ({ "server-key": process.env.ERLC_SERVER_KEY, "Content-Type": "application/json" });
export async function erlcComando(command) {
  if (!erlcListo()) return { ok: false, error: "Falta la variable ERLC_SERVER_KEY en Vercel" };
  try {
    const r = await fetch(`${BASE}/server/command`, { method: "POST", headers: H(), body: JSON.stringify({ command }), cache: "no-store" }); let j = null; try { j = await r.json(); } catch {}
    return r.ok ? { ok: true } : { ok: false, status: r.status, error: j?.message || `Error ${r.status}` };
  } catch { return { ok: false, error: "No se pudo conectar con la API de ER:LC" }; }
}
export async function erlcJugadores() {
  if (!erlcListo()) return null;
  try { const r = await fetch(`${BASE}/server/players`, { headers: H(), cache: "no-store" }); if (!r.ok) return null; const j = await r.json(); return Array.isArray(j) ? j : null; } catch { return null; }
}
