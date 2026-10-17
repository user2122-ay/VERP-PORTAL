// Auditoría: toda acción de Administración (y de moderación de VE TikTok) se guarda en la colección "audit" Y se manda a un canal de Discord
// con un mensaje de COMPONENTES V2 (cajones/contenedores con un logo a la derecha que cambia según la situación; no es un embed).
// Webhook: variable de entorno DISCORD_WEBHOOK_AUDITORIA (recomendado ponerla en Vercel). Si no existe se usa el de abajo.
const WEBHOOK = process.env.DISCORD_WEBHOOK_AUDITORIA || "https://discord.com/api/webhooks/1559625216936640677/aziBhHMCVjIW6THBp1gLIZSvZeiVmmPmjJ--w9wA-F-fPj6sPVJqOjjEYAbqTwpZLvR2";
const ROJO = 0xef4444, VERDE = 0x22c55e, AZUL = 0x3b82f6, NARANJA = 0xf59e0b, MORADO = 0x8b5cf6, ROSA = 0xff2d55, GRIS = 0x64748b;
// act → [emoji, título, color]
const A = {
  darDinero: ["💰", "Dinero agregado", VERDE], quitarDinero: ["💸", "Dinero quitado", ROJO], CK: ["☠️", "CK aplicado", ROJO], editCedula: ["🪪", "Cédula editada", AZUL],
  invAgregar: ["🎁", "Artículo agregado a un usuario", NARANJA], invQuitar: ["🗑️", "Artículo quitado a un usuario", ROJO], addItem: ["🛒", "Artículo nuevo en el Mercado", NARANJA], addCasas: ["🏠", "Lote de casas creado", NARANJA],
  setPrice: ["🏷️", "Precio / impuesto cambiado", NARANJA], delItem: ["❌", "Artículo eliminado del Mercado", ROJO], imgMigrar: ["🖼️", "Fotos guardadas en el sitio", GRIS], auxApSet: ["🔑", "Responsabilidad Auxiliar Apertura asignada", AZUL], auxApDel: ["🔑", "Responsabilidad Auxiliar Apertura quitada", ROJO], setImg: ["🖼️", "Foto de artículo cambiada", NARANJA],
  cuentaDar: ["💳", "Tarjeta entregada", VERDE], cuentaQuitar: ["💳", "Tarjeta quitada", ROJO], chipDar: ["📱", "Chip entregado", VERDE], chipQuitar: ["📱", "Chip quitado", ROJO], planQuitar: ["📶", "Plan quitado", ROJO],
  staffSet: ["🛡️", "Staff asignado", AZUL], staffDel: ["🛡️", "Staff quitado", ROJO], agenteSet: ["👮", "Agente MDT asignado", AZUL], agenteDel: ["👮", "Agente MDT quitado", ROJO],
  trabajoOk: ["✅", "Trabajo secundario pagado", VERDE], trabajoNo: ["⛔", "Trabajo secundario rechazado", ROJO], roboOk: ["🚗", "Robo de auto aprobado", NARANJA], roboNo: ["🚗", "Robo de auto rechazado", ROJO], apelOk: ["⚖️", "Apelación aprobada", VERDE], apelNo: ["⚖️", "Apelación denegada", ROJO],
  apertura: ["📢", "Aviso de apertura del servidor", MORADO], erlcCmd: ["🎮", "Comando de ER:LC", MORADO], erlcTest: ["🎮", "Prueba de ER:LC", MORADO], erlcAuto: ["🤖", "Mensajes automáticos de ER:LC", MORADO],
  ecoSet: ["📊", "Ajustes de economía", AZUL], ecoMover: ["🏦", "Traspaso de fondos", AZUL], reporte911: ["🚨", "Reporte 911 resuelto", GRIS], reiniciarBD: ["🔥", "REINICIO DE LA BASE DE DATOS", ROJO],
  liberarSueldos: ["💵", "Sueldos liberados", VERDE], mejoraMinisterio: ["🏛️", "Mejora del Ministerio", AZUL], tasaITBMS: ["🧾", "Tasa de ITBMS cambiada", AZUL],
  tiktokBorrarVideo: ["🎬", "Video eliminado por moderación (VE TikTok)", ROSA], tiktokBorrarComentario: ["💬", "Comentario eliminado por moderación (VE TikTok)", ROSA], tiktokEliminarCuenta: ["🚫", "Cuenta de VE TikTok eliminada por moderación", ROSA],
};
const info = (act) => A[act] || (String(act).startsWith("negocio_") ? ["🏪", "Decisión sobre un negocio", NARANJA] : ["📝", String(act), GRIS]);
const corto = (s, n) => { s = String(s ?? ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
function lineas(det) {
  if (!det || typeof det !== "object") return det ? corto(det, 900) : "";
  return Object.entries(det).slice(0, 12).map(([k, v]) => `• **${corto(k, 30)}:** ${corto(typeof v === "object" ? JSON.stringify(v) : v, 220)}`).join("\n");
}
const abs = (u, origen) => (!u ? null : /^https:\/\//.test(u) ? u : String(u).startsWith("/") && origen ? origen + u : null);
// Mensaje de Componentes V2: dos cajones (contenedores). El primero lleva el logo a la derecha (Thumbnail): la foto del usuario afectado,
// la del artículo, o el logo de VE:RP según la situación.
export function armar(doc, ctx = {}) {
  const [em, titulo, color] = info(doc.act), origen = ctx.origen || process.env.SITE_URL || "";
  const img = abs(ctx.imagen, origen) || abs(ctx.t?.cedula?.avatar, origen) || abs(ctx.item?.img, origen) || abs("/logo.png", origen);
  const unix = Math.floor(+new Date(doc.at || Date.now()) / 1000), det = lineas(doc.detalle);
  const cab = { type: 9, components: [{ type: 10, content: `## ${em} ${corto(titulo, 80)}\n**Objetivo:** ${corto(doc.objetivo || "—", 200)}\n**Hecho por:** ${corto(doc.byName || "—", 60)} · \`${corto(String(doc.rank || "").replace("_", " "), 30)}\`` }] };
  if (img) cab.accessory = { type: 11, media: { url: img } }; else cab.components.push();
  const caja1 = { type: 17, accent_color: color, components: [img ? cab : cab.components[0], { type: 14, divider: true, spacing: 1 }, { type: 10, content: `**Razón**\n${corto(doc.razon || "Sin razón", 600)}` }] };
  const comps = [caja1];
  if (det) comps.push({ type: 17, accent_color: color, components: [{ type: 10, content: `**Detalles**\n${det}` }, { type: 14, divider: false, spacing: 1 }, { type: 10, content: `-# VE:RP · Auditoría · <t:${unix}:F> (<t:${unix}:R>)` }] });
  else caja1.components.push({ type: 14, divider: false, spacing: 1 }, { type: 10, content: `-# VE:RP · Auditoría · <t:${unix}:F> (<t:${unix}:R>)` });
  return { flags: 1 << 15, allowed_mentions: { parse: [] }, components: comps };
}
export async function enviarAuditoria(doc, ctx = {}) {
  if (!/^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\//.test(WEBHOOK)) return;
  try { await fetch(WEBHOOK + "?wait=true&with_components=true", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(armar(doc, ctx)), cache: "no-store", signal: AbortSignal.timeout(5000) }); } catch {}
}
// Guarda en la base de datos y avisa a Discord. Nunca rompe la acción si Discord falla.
export async function auditar(d, doc, ctx = {}) {
  const x = { at: new Date(), ...doc }; await d.collection("audit").insertOne({ ...x }); await enviarAuditoria(x, ctx);
}
