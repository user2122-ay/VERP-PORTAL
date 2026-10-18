// Normativa de Venezuela Community: búsqueda y referencias. Los datos salen de lib/normativaData.js (generado por normativa/construir.py).
import { ARTS, SECCIONES, BLOQUES } from "./normativaData";
export { ARTS, SECCIONES, BLOQUES };
const sin = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
const raiz = (w) => (w.length > 4 ? w.replace(/(es|s)$/, "") : w);
const STOP = new Set("que de del en el la los las un una unos unas y o a al se es son por para con sin sobre habla hablan dice dicen donde cual cuales cuanto como esta estan hay articulo articulos art normativa norma normas regla reglas puedo puede pueden podemos mi me te lo le si no mas muy ya hay tiene tienen sea ser".split(" "));
const SEC_ALIAS = { gen: ["general", "generales", "roleplay"], ciu: ["ciudadana", "ciudadano", "ciudadanos", "civil", "civiles"], dep: ["departamental", "departamentos", "departamento", "departamentales", "policia", "ejercito", "ems", "bomberos", "dot", "funcionarios"], del: ["delictiva", "delictivo", "delictivos", "criminal", "criminales", "delincuente", "banda", "bandas", "mafia", "pandilla", "organizacion", "organizaciones"], fin: ["final", "finales", "disposiciones"] };
// Abreviaturas y sinónimos frecuentes → palabras que aparecen en la normativa
const SINON = { pg: "powergaming", mg: "metagaming", rdm: "random deathmatch", vdm: "vehicle deathmatch", failrp: "fail roleplay", fearrp: "fearrp valorar vida", ck: "character kill", nre: "no rolear entorno", nrh: "no rolear heridas", bj: "bunnyjump", zza: "zigzag abuse", ba: "bug abuse", la: "lag abuse", aa: "admin abuse", kad: "kill admin duty", khd: "kill helper duty", tk: "team kill", mk: "meta kill", bd: "bad driving", pi: "provocacion innecesaria", ooc: "out of character", ic: "in character", dni: "documento nacional identidad", ems: "ems paramedico", pit: "pit persecuciones", taser: "taser equipo no letal", rp: "roleplay", sancion: "sanciones", castigo: "sanciones", ban: "expulsion", kick: "expulsion", "+18": "roles +17 +18 sexual", "18": "roles +18", soborno: "corrupcion", sobornos: "corrupcion", droga: "narcotrafico", drogas: "narcotrafico", narco: "narcotrafico", banco: "entidades financieras atracos", furgon: "furgones blindados convoyes", gobierno: "gobierno", respawn: "tiempo de respawn", muerte: "respawn character kill", entrar: "ingreso departamentos", ingresar: "ingreso departamentos", unirme: "ingreso departamentos", unir: "ingreso departamentos", postular: "ingreso departamentos", postularme: "ingreso departamentos", corrupcion: "corruccion", placa: "placas formato", placas: "placas formato", multar: "multas sanciones", robo: "robos", robar: "robos", robos: "robos", secuestro: "secuestros", arma: "armas", armas: "armas", pistola: "armas fuego", cuchillo: "armas blancas", moto: "vehiculos", carro: "vehiculos", auto: "vehiculos", casa: "viviendas", ascenso: "ascensos rangos", ascensos: "ascensos rangos", rango: "ascensos rangos", renunciar: "renuncien removidos departamento", expulsion: "expulsion sanciones" };
const IDX = ARTS.map((a) => {
  const titulo = sin(a.titulo + " " + a.tag), subs = a.subs.map((s) => ({ s, h: sin(s.t), x: sin(s.l.join(" ")) })), intro = sin(a.intro.join(" ")), todo = intro + " " + subs.map((s) => s.h + " " + s.x).join(" ");
  return { a, titulo, tt: new Set(titulo.split(" ").map(raiz)), subs, todo, secTxt: sin(SECCIONES.find((s) => s.id === a.sec)?.n + " " + (BLOQUES[a.bloque] || "")) };
});
export const refDe = (a) => { const S = SECCIONES.find((s) => s.id === a.sec)?.n || ""; return a.sec === "fin" ? "Disposiciones finales" : `Normativa ${S}${a.bloque ? ` · Bloque ${a.bloque}` : ""} · ${a.num === "Anexo" ? "Art. Anexo" : "Art. " + a.num}`; };
export function tokens(q) {
  const base = sin(q).split(" ").filter(Boolean), out = [];
  for (const w of base) { if (SINON[w]) for (const x of sin(SINON[w]).split(" ")) out.push(raiz(x)); if (!STOP.has(w) && (w.length > 2 || SINON[w])) out.push(raiz(w)); }
  return [...new Set(out)];
}
const frase = (q) => sin(q).replace(/\b(que|en|el|la|los|las|de|del|habla|sobre|articulo|normativa)\b/g, " ").replace(/\s+/g, " ").trim();
// Devuelve los artículos que mejor responden a la pregunta: [{ a, ref, sub, score }]
export function buscar(q, n = 3) {
  const t = tokens(q); if (!t.length) return [];
  const qs = new Set(sin(q).split(" ")), secs = Object.entries(SEC_ALIAS).filter(([, ws]) => ws.some((w) => qs.has(w))).map(([k]) => k), fr = frase(q), res = [];
  for (const x of IDX) {
    let sc = 0; const titHit = t.filter((w) => x.tt.has(w)).length; sc += titHit * 12;
    if (fr.length > 4 && x.titulo.includes(fr)) sc += 25;
    let sub = null, best = 0;
    for (const s of x.subs) { let h = 0; for (const w of t) { if (s.h.split(" ").map(raiz).includes(w)) h += 4; if (s.x.includes(w)) h += 1; } if (h > best) { best = h; sub = s.s; } }
    let tx = 0; for (const w of t) { const c = x.todo.split(w).length - 1; tx += Math.min(3, c); } sc += tx * 2 + best;
    if (!sc) continue;
    if (secs.length) sc += secs.includes(x.a.sec) ? 12 : -6;
    if (x.a.sec === "fin") sc -= 4;
    res.push({ a: x.a, ref: refDe(x.a), sub: sub && best >= 4 ? `${sub.n ? sub.n + " " : ""}${sub.t}`.trim() : null, score: sc, titHit });
  }
  res.sort((p, q2) => q2.score - p.score);
  const top = res[0]?.score || 0; return res.filter((r, i) => i < n && r.score >= Math.max(5, top * 0.45));
}
export const resumen = (a, max = 260) => { const s = a.subs.find((x) => /definici/i.test(x.t)); const txt = (s?.l[0] || a.intro[0] || a.subs[0]?.l[0] || "").trim(); return txt.length > max ? txt.slice(0, max - 1) + "…" : txt; };
