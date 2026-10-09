// Proxy de ER:LC con IP fija. Sin dependencias (Node 18 o más nuevo).
// Variables: PROXY_SECRET (una clave larga que tú inventas; la misma va en Vercel como ERLC_PROXY_SECRET) y PORT.
import http from "node:http";
const SECRET = process.env.PROXY_SECRET, PORT = process.env.PORT || 3000, API = process.env.ERLC_API_URL || "https://api.erlc.gg/v1";
if (!SECRET) { console.error("Falta PROXY_SECRET"); process.exit(1); }
http.createServer(async (req, res) => {
  const fin = (s, o) => { res.writeHead(s, { "Content-Type": "application/json" }); res.end(JSON.stringify(o)); };
  if (req.method !== "POST" || req.url !== "/command") return fin(404, { message: "No existe" });
  if (req.headers["x-proxy-secret"] !== SECRET) return fin(401, { message: "Clave del proxy incorrecta" });
  let body = ""; for await (const c of req) { body += c; if (body.length > 5000) return fin(413, { message: "Muy grande" }); }
  try { const r = await fetch(`${API}/server/command`, { method: "POST", headers: { "server-key": String(req.headers["server-key"] || ""), "Content-Type": "application/json" }, body });
    res.writeHead(r.status, { "Content-Type": "application/json" }); res.end(await r.text());
  } catch { fin(502, { message: "El proxy no pudo conectar con ER:LC" }); }
}).listen(PORT, () => console.log("Proxy ER:LC listo en el puerto " + PORT));
