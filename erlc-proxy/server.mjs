import http from "node:http";
const SECRET = process.env.PROXY_SECRET, PORT = process.env.PORT || 3000;
const API = "https://api.erlc.gg/v1";
http.createServer(async (req, res) => {
  const fin = (s, o) => { res.writeHead(s, { "Content-Type": "application/json" }); res.end(JSON.stringify(o)); };
  // GET /ip: muestra la IP real con la que este servidor sale a internet (esa es la que hay que agregar en ER:LC)
  if (req.method === "GET" && req.url === "/ip") { try { return fin(200, { ip: (await (await fetch("https://api.ipify.org?format=json")).json()).ip }); } catch { return fin(502, { message: "No se pudo averiguar la IP" }); } }
  if (req.method !== "POST" || req.url !== "/command") return fin(404, { message: "No existe" });
  if (req.headers["x-proxy-secret"] !== SECRET) return fin(401, { message: "Clave incorrecta" });
  let body = ""; for await (const c of req) body += c;
  try {
    const r = await fetch(API + "/server/command", { method: "POST", headers: { "server-key": String(req.headers["server-key"] || ""), "Content-Type": "application/json" }, body });
    res.writeHead(r.status, { "Content-Type": "application/json" }); res.end(await r.text());
  } catch { fin(502, { message: "No conectó con ER:LC" }); }
}).listen(PORT);
