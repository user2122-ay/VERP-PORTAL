import crypto from "crypto";
// Fotos de casas, autos, armas, etc. Los links de Discord VENCEN (a las ~24 h dejan de cargar), así que al guardar un artículo
// el servidor DESCARGA la imagen y la guarda en la base de datos (colección "imgs"); el artículo queda con /api/img/<id>, que no vence.
// También acepta una foto subida desde el dispositivo (data:image/...;base64,...).
const MAX = 3.5e6, OK = /^image\/(jpeg|png|webp|gif)$/;
export const esDiscord = (u) => /^https:\/\/(cdn\.discordapp\.com|media\.discordapp\.net|images-ext-\d\.discordapp\.net)\//i.test(String(u || ""));
export async function importarImagen(d, v) {
  v = String(v || "").trim(); if (!v) return { url: "" }; if (v.startsWith("/")) return { url: v };
  let buf, mime; const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (m) { mime = m[1]; buf = Buffer.from(m[2], "base64"); }
  else {
    let h; try { h = new URL(v); } catch { return { error: "Link de imagen inválido" }; }
    if (h.protocol !== "https:" || /^(localhost|\d+\.\d+\.\d+\.\d+|\[)/i.test(h.hostname) || !h.hostname.includes(".")) return { error: "La imagen debe ser un link https público (Discord o Imgur)" };
    try {
      const r = await fetch(h.href, { headers: { "User-Agent": "Mozilla/5.0 (compatible; VERP-Portal/1.0)", Accept: "image/*" }, signal: AbortSignal.timeout(12000), redirect: "follow" });
      if (!r.ok) return { error: `No se pudo bajar la imagen (error ${r.status}). Si es de Discord, el link ya venció: vuelve a copiar el enlace de la imagen o súbela desde tu dispositivo` };
      mime = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase(); if (!OK.test(mime)) return { error: "Ese link no es una imagen directa. En Discord usa clic derecho → “Copiar enlace de imagen”, o sube la foto desde tu dispositivo" };
      buf = Buffer.from(await r.arrayBuffer());
    } catch { return { error: "No se pudo bajar la imagen. Intenta con otro link o sube la foto desde tu dispositivo" }; }
  }
  if (buf.length < 100) return { error: "La imagen está vacía o dañada" }; if (buf.length > MAX) return { error: "La imagen pesa más de 3.5 MB: usa una más pequeña" };
  const id = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 20);
  await d.collection("imgs").updateOne({ _id: id }, { $setOnInsert: { mime, data: buf, at: new Date() } }, { upsert: true });
  return { url: `/api/img/${id}` };
}
