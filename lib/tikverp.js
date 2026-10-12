// VE TikTok: la red social de la comunidad. Perfiles, videos y fotos (por link de Discord o Imgur), música, likes, comentarios, seguidores y compartir.
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
// Insignias: azul (verificado) con 17 o más seguidores; dorada y distinta para Fundación y el Developer (que además moderan VE TikTok).
export const SEGUIDORES_VERIFICADO = 17;
export const esFund = (u) => !!u && (u.dev === true || u.rank === "DEVELOPER" || u.rank === "FUNDACION" || u.staff === "FUNDACION");
export const insignia = (u, seguidores = 0) => (u?.dev ? "Developer" : u?.staff === "FUNDACION" || u?.rank === "FUNDACION" ? "Fundador" : seguidores >= SEGUIDORES_VERIFICADO ? "Verificado" : null);
// ---- Chat y rachas ----
// Día de juego en hora de Panamá (UTC-5). Racha 🔥: cada día los DOS deben enviarse un mensaje o un video; si un día falta alguno, la racha se pierde.
export const dia = (ms = Date.now()) => new Date(ms - 5 * 36e5).toISOString().slice(0, 10);
export const parId = (a, b) => [a, b].sort().join(":");
export function tickRacha(ch, me, ms = Date.now()) {
  const hoy = dia(ms), ayer = dia(ms - 864e5), h = ch.rd === hoy ? { ...(ch.hoy || {}) } : {}; h[me] = true; const set = { rd: hoy, hoy: h };
  if (ch.uids.every((x) => h[x]) && ch.rc !== hoy) { set.rn = ch.rc === ayer ? (ch.rn || 0) + 1 : 1; set.rc = hoy; }
  return set;
}
// { n, riesgo (ya pasó el día y falta completar hoy), yoListo, otroListo }
export function rachaVista(ch, me, ms = Date.now()) {
  const hoy = dia(ms), ayer = dia(ms - 864e5), h = ch.rd === hoy ? ch.hoy || {} : {}, otro = ch.uids.find((x) => x !== me);
  const vivo = ch.rc === hoy || ch.rc === ayer; return { n: vivo ? ch.rn || 0 : 0, riesgo: vivo && ch.rc === ayer, yoListo: !!h[me], otroListo: !!h[otro] };
}
