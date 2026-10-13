import crypto from "crypto";
// Fotos de casas, autos, armas, etc. Los links de Discord VENCEN (a las ~24 h dejan de cargar), así que al guardar un artículo
// el servidor DESCARGA la imagen y la guarda en la base de datos (colección "imgs"); el artículo queda con /api/img/<id>, que no vence.
// También acepta una foto subida desde el dispositivo (data:image/...;base64,...).
const MAX = 3.5e6, OK = /^image\/(jpeg|png|webp|gif)$/;
export const esExterna = (u) => /^https?:\/\//i.test(String(u || ""));
export const esDiscord = (u) => /^https:\/\/(cdn\.discordapp\.com|media\.discordapp\.net|images-ext-\d\.discordapp\.net)\//i.test(String(u || ""));
export async function importarImagen(d, v) {
  v = String(v || "").trim(); if (!v) return { url: "" }; if (v.startsWith("/")) return { url: v };
  let buf, mime, origen = null; const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (m) { mime = m[1]; buf = Buffer.from(m[2], "base64"); }
  else {
    let h; try { h = new URL(v); if (h.protocol === "http:") h.protocol = "https:"; } catch { return { error: "Link de imagen inválido" }; }
    const ya = await d.collection("imgs").findOne({ srcs: h.href }, { projection: { _id: 1 } }); if (ya) return { url: `/api/img/${ya._id}` }; // ya se había guardado desde este mismo link
    if (h.protocol !== "https:" || /^(localhost|\d+\.\d+\.\d+\.\d+|\[)/i.test(h.hostname) || !h.hostname.includes(".")) return { error: "La imagen debe ser un link https público (Discord, Google, Imgur…)" };
    try {
      const r = await fetch(h.href, { headers: { "User-Agent": "Mozilla/5.0 (compatible; VERP-Portal/1.0)", Accept: "image/*" }, signal: AbortSignal.timeout(12000), redirect: "follow" });
      if (!r.ok) return { error: `No se pudo bajar la imagen (error ${r.status}). Si es de Discord, el link ya venció: vuelve a copiar el enlace de la imagen o súbela desde tu dispositivo` };
      mime = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase(); if (!OK.test(mime)) return { error: "Ese link no es una imagen directa. En Discord usa clic derecho → “Copiar enlace de imagen”, o sube la foto desde tu dispositivo" };
      buf = Buffer.from(await r.arrayBuffer()); origen = h.href;
    } catch { return { error: "No se pudo bajar la imagen. Intenta con otro link o sube la foto desde tu dispositivo" }; }
  }
  if (buf.length < 100) return { error: "La imagen está vacía o dañada" }; if (buf.length > MAX) return { error: "La imagen pesa más de 3.5 MB: usa una más pequeña" };
  const id = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 20);
  await d.collection("imgs").updateOne({ _id: id }, { $setOnInsert: { mime, data: buf, at: new Date() }, ...(origen ? { $addToSet: { srcs: origen } } : {}) }, { upsert: true });
  return { url: `/api/img/${id}` };
}

// ---- Conversión automática de los links de Discord que ya estaban guardados ----
// Detecta de dónde es cada foto (links de cdn.discordapp.com / media.discordapp.net), la guarda en el sitio y cambia el link en TODOS lados
// (catálogo, inventarios de los usuarios, placas). Se ejecuta sola cuando alguien abre el Mercado, el Inventario o Administración.
export async function migrarUrl(d, viejo) {
  const f = await importarImagen(d, viejo); if (!f.url) return false;
  await d.collection("items").updateMany({ img: viejo }, { $set: { img: f.url }, $unset: { imgVencida: "" } });
  await d.collection("placas").updateMany({ img: viejo }, { $set: { img: f.url } });
  await d.collection("robos").updateMany({ img: viejo }, { $set: { img: f.url } });
  await d.collection("users").updateMany({ "inventory.img": viejo }, { $set: { "inventory.$[e].img": f.url } }, { arrayFilters: [{ "e.img": viejo }] });
  return true;
}
const RXD = "^https?://", sha = (x) => crypto.createHash("sha1").update(x).digest("hex");
export async function autoMigrar(d, extra = []) {
  try {
    const c = d.collection("config"), t = await c.findOne({ _id: "imgRun" }); if (t && Date.now() - t.at < 15000) return; await c.updateOne({ _id: "imgRun" }, { $set: { at: Date.now() } }, { upsert: true });
    const urls = new Set(extra.filter(esExterna)); for (const k of ["items"]) for (const x of await d.collection(k).find({ img: { $regex: RXD } }, { projection: { img: 1 } }).limit(6).toArray()) urls.add(x.img);
    const fl = d.collection("img_fallos"), hace = new Date(Date.now() - 6 * 36e5), lista = [];
    for (const u of urls) { if (lista.length >= 5) break; if (!(await fl.findOne({ _id: sha(u), at: { $gt: hace } }))) lista.push(u); } // las que ya fallaron (vencidas) se reintentan cada 6 h
    await Promise.race([Promise.all(lista.map(async (u) => { if (await migrarUrl(d, u)) await fl.deleteOne({ _id: sha(u) }); else { await fl.updateOne({ _id: sha(u) }, { $set: { at: new Date() } }, { upsert: true }); await d.collection("items").updateMany({ img: u }, { $set: { imgVencida: true } }); } })), new Promise((r) => setTimeout(r, 6000))]);
  } catch {}
}
