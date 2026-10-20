// Equipo del staff que Li'l Monkey conoce. Vive en la base de datos (colección "equipo"); se agrega con /añadir desde el chat del asistente.
// Cada persona: { _id: usuario de Roblox en minúsculas, roblox, nombre, alias: [], cargos: [] }
export const SEMILLA = [
  ["eduartbriggs", "Eduart", "Padre Fundador, Encargado Administrativo, Encargado Ilegal"],
  ["32boscnjxs", "Mono", "Padre Fundador, Manager Administrativo, Encargado Departamental"],
  ["joyromero0248", "Vivacristo", "Fundador, Manager Administrativo, Asuntos Internos"],
  ["omar_alejfc", "Omar Fonseca", "Asuntos Internos, Encargado de Orientación, Desarrollador"],
  ["Itsanthony_21", "Anthony o Infloinsano", "Asuntos Internos, Manager Administrativo, Encargado Administrativo, Desarrollador"],
  ["vookbrown2000", "Brown", "Head Staff, Encargado Ilegal"],
  ["derek_frotsh", "Dereck", "Asuntos Sociales, Head Staff"],
  ["ces4r_over", "Cesar", "Asuntos Sociales, Head Staff"],
  ["el_abuelo9000", "López", "Asuntos Disciplinarios"],
];
const sin = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
export const persona = (roblox, nombre, cargos) => {
  const alias = String(nombre).split(/\s+o\s+|\/|,/i).map((x) => x.trim()).filter(Boolean);
  return { _id: String(roblox).toLowerCase(), roblox: String(roblox), nombre: alias[0] || String(nombre), alias: alias.slice(1), cargos: Array.isArray(cargos) ? cargos : String(cargos).split(/,|\sy\s/i).map((x) => x.trim()).filter(Boolean) };
};
export const semilla = () => SEMILLA.map(([r, n, c]) => persona(r, n, c));
export const fila = (p) => `${p.nombre}${p.alias?.length ? " (o " + p.alias.join(", ") + ")" : ""} — usuario de Roblox ${p.roblox}: ${p.cargos.join(", ")}.`;
const nombres = (p) => [p.roblox, p.nombre, ...(p.alias || []), ...String(p.nombre).split(" ")].map(sin).filter((x) => x.length >= 3);
const PREG = /(qui[eé]n|quienes|qu[eé] hace|que funci|funci[oó]n|cargo|puesto|\brol\b|encargad|manager|fundador|head|asuntos|desarrollador|staff|equipo|conoces|h[aá]blame|info|dime)/i;
// Responde con SOLO lo que se preguntó: una persona, un cargo (todos los que lo tienen) o el equipo completo. Devuelve null si no es una pregunta del equipo.
export function respEquipo(msg, lista) {
  if (!lista?.length) return null; const m = " " + sin(msg) + " ", corto = m.trim().split(" ").length <= 3;
  if (!PREG.test(msg) && !corto) return null;
  const ps = lista.filter((p) => nombres(p).some((n) => m.includes(" " + n + " ")));
  if (ps.length) return { r: ps.map(fila).join("\n") };
  const raiz = (w) => w.replace(/(es|s)$/, ""), frases = [...new Set(lista.flatMap((p) => p.cargos.map(sin)))].filter((c) => c.includes(" ") && m.includes(" " + c + " ")), vocab = new Set(lista.flatMap((p) => p.cargos.flatMap((c) => sin(c).split(" "))).filter((w) => w.length >= 5 && !["staff", "encargado"].includes(w)).map(raiz)),
    ws = m.trim().split(" ").filter((w) => w.length >= 5).map(raiz).filter((w) => vocab.has(w)), enc = /encargad/.test(m) ? ["encargad"] : [];
  const claves = [...frases, ...ws, ...enc]; if (claves.length) { const g = lista.filter((p) => p.cargos.some((c) => claves.some((k) => sin(c).includes(k)))); if (g.length) return { r: `${(frases[0] || claves[0])[0].toUpperCase() + (frases[0] || claves[0]).slice(1)}:\n` + g.map((p) => `- ${p.nombre} (${p.roblox}): ${p.cargos.join(", ")}`).join("\n") }; }
  if (/(todo el (staff|equipo)|qui[eé]nes son|el (staff|equipo)|lista del (staff|equipo))/i.test(msg) && /(staff|equipo)/i.test(msg)) return { r: "Equipo de VE:RP:\n" + lista.map((p) => `- ${p.nombre} (${p.roblox}): ${p.cargos.join(", ")}`).join("\n") };
  return null;
}
// /añadir usuario (Nombre) Cargo1, Cargo2   ·   /quitar usuario   ·   /equipo
export function comando(msg) {
  const t = String(msg).trim(), q = /^\/(quitar|borrar|eliminar)\s+(\S+)/i.exec(t); if (q) return { acc: "quitar", id: q[2].toLowerCase() };
  if (/^\/equipo\b/i.test(t)) return { acc: "lista" };
  const a = /^\/(a[ñn]adir|agregar|editar)\s+(\S+)\s*\(([^)]{1,60})\)\s*(.{0,300})$/i.exec(t); if (a) return a[4].trim() ? { acc: "poner", p: persona(a[2], a[3], a[4]) } : { error: "Faltan los cargos. Ejemplo: /añadir usuario_roblox (Nombre) Head Staff, Asuntos Sociales" };
  if (/^\/(a[ñn]adir|agregar|editar|quitar)/i.test(t)) return { error: "Formato: /añadir usuario_roblox (Nombre) Cargo 1, Cargo 2 · /quitar usuario_roblox · /equipo" };
  return null;
}
