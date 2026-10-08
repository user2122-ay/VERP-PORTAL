// TikVerp: la red social de la comunidad. Perfiles, videos y fotos (por link de Discord o Imgur), música, likes, comentarios, seguidores y compartir.
// Colecciones de Mongo (se crean solas): tv_perfiles, tv_posts, tv_likes, tv_com, tv_follows, tv_sonidos.
export const HOSTS = ["cdn.discordapp.com", "media.discordapp.net", "i.imgur.com"], HOSTS_AUDIO = ["cdn.discordapp.com", "media.discordapp.net"];
export const FOTO = /\.(jpe?g|png|gif|webp)$/i, VIDEO = /\.(mp4|webm|mov)$/i, AUDIO = /\.(mp3|ogg|wav|m4a|opus|aac)$/i;
export const HANDLE = /^[a-z0-9_.]{3,20}$/;
// Valida un link y devuelve { href, media } o { error }. tipo: "media" (foto/video), "foto" (solo foto) o "audio".
export function validarLink(raw, tipo = "media") {
  let h; try { h = new URL(String(raw || "").trim()); } catch { return { error: "Pega un link válido" }; }
  const hosts = tipo === "audio" ? HOSTS_AUDIO : HOSTS;
  if (h.protocol !== "https:" || !hosts.includes(h.hostname)) return { error: tipo === "audio" ? "El audio debe ser un link de Discord (cdn.discordapp.com)" : "El link debe ser de Discord (cdn.discordapp.com) o Imgur (i.imgur.com)" };
  if (tipo === "audio") return AUDIO.test(h.pathname) ? { href: h.href } : { error: "El link debe terminar en un audio (mp3, ogg, wav, m4a)" };
  if (tipo === "foto") return FOTO.test(h.pathname) ? { href: h.href } : { error: "El link debe terminar en una foto (jpg, png, gif, webp)" };
  const media = VIDEO.test(h.pathname) ? "video" : FOTO.test(h.pathname) ? "foto" : null;
  return media ? { href: h.href, media } : { error: "El link debe terminar en una foto (jpg, png, gif, webp) o un video (mp4, webm, mov)" };
}
export const etiquetas = (t) => [...new Set([...String(t || "").matchAll(/#([\p{L}\p{N}_]{2,30})/gu)].map((m) => m[1].toLowerCase()))].slice(0, 8);
