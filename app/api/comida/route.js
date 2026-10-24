import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { nivelDe, HORAS, refCuerpo } from "@/lib/cuerpo";
import { estaRetenido } from "@/lib/decomiso";
import { esComida, neveras, nidDe, enNeveraId, capNev, vencido, venceMs, FACTOR_NEVERA, HORAS_ENFERMO, PROB_ENFERMAR, racionesDe, plan, unidadDe, plural } from "@/lib/comida";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const al = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
// Comer, botar, guardar en la nevera y sacar de la nevera. Cada comida del inventario tiene un id (fid).
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  if (u.muerte) return bad("Tu personaje murió", 403);
  const b = await req.json().catch(() => ({})), fid = String(b.fid || ""), it = (u.inventory || []).find((i) => esComida(i) && i.fid === fid);
  if (!it) return bad("Esa comida ya no está en tu inventario", 404);
  if (estaRetenido(it)) return bad("Está retenida por la policía", 403);
  const d = await db(), us = d.collection("users"), ahora = new Date(), venc = vencido(it);
  if (b.accion === "botar") { const r = await us.updateOne({ id: u.id }, { $pull: { inventory: { fid } } }); return r.modifiedCount ? NextResponse.json({ ok: true, msg: `Botaste: ${it.name}` }) : bad("No se pudo botar"); }
  if (b.accion === "guardar") {
    const ns = neveras(u); if (!ns.length) return bad("No tienes nevera. Compra una en la Tool Store (Mercado → Herramientas)");
    if (it.enNevera) return bad("Ya está en la nevera");
    if (venc) return bad("Eso ya está vencido: no lo guardes, bótalo o cómelo bajo tu riesgo");
    let n = null; if (b.nev) { n = ns.find((x) => nidDe(x) === String(b.nev)); if (!n) return bad("Esa nevera no existe"); } else n = ns.find((x) => enNeveraId(u, nidDe(x)).length < capNev(x));
    if (!n || enNeveraId(u, nidDe(n)).length >= capNev(n)) return bad("No hay espacio en esa nevera");
    const resto = venceMs(it) - +ahora, vence = new Date(+ahora + resto * FACTOR_NEVERA);
    const r = await us.updateOne({ id: u.id, inventory: { $elemMatch: { fid, enNevera: { $ne: true } } } }, { $set: { "inventory.$.enNevera": true, "inventory.$.vence": vence, "inventory.$.nev": nidDe(n) } });
    return r.modifiedCount ? NextResponse.json({ ok: true, msg: `${it.name} guardado en la nevera: dura más` }) : bad("No se pudo guardar");
  }
  if (b.accion === "sacar") {
    if (!it.enNevera) return bad("No está en la nevera");
    const resto = Math.max(0, venceMs(it) - +ahora) / FACTOR_NEVERA, vence = new Date(+ahora + resto);
    const r = await us.updateOne({ id: u.id, inventory: { $elemMatch: { fid, enNevera: true } } }, { $set: { "inventory.$.enNevera": false, "inventory.$.vence": vence }, $unset: { "inventory.$.nev": "" } });
    return r.modifiedCount ? NextResponse.json({ ok: true, msg: `${it.name} fuera de la nevera` }) : bad("No se pudo sacar");
  }
  if (b.accion === "comer") { // se puede comer por raciones: 1 bocado, la mitad o todo (el % que sube se reparte entre las raciones)
    const { tipo, pct } = it.consumo || {}; if (!tipo) return bad("No se puede consumir");
    const ref = await refCuerpo(d, u), actual = nivelDe(u.cuerpo?.[tipo], HORAS[tipo], ref), R = racionesDe(it); if (actual >= (R > 1 ? 99.5 : 95)) return bad(tipo === "agua" ? "Todavía no tienes sed" : "Todavía no tienes hambre");
    const pl = plan(it, b, actual), gana = R > 1 ? pl.gana : pct;
    const set = { [`cuerpo.${tipo}`]: { n: Math.min(100, actual + gana), t: ahora } }; let enfermo = false, perdida = null;
    if (venc && Math.random() < PROB_ENFERMAR) { // comida vencida: te enfermas y pierdes un pequeño % de comida y agua
      enfermo = true; const c = nivelDe(u.cuerpo?.comida, HORAS.comida, ref), a = nivelDe(u.cuerpo?.agua, HORAS.agua, ref), pc = al(4, 12), pa = al(4, 12);
      const baseC = tipo === "comida" ? Math.min(100, c + gana) : c, baseA = tipo === "agua" ? Math.min(100, a + gana) : a;
      set["cuerpo.comida"] = { n: Math.max(1, baseC - pc), t: ahora }; set["cuerpo.agua"] = { n: Math.max(1, baseA - pa), t: ahora }; perdida = { comida: pc, agua: pa };
      set["cuerpo.enfermo"] = { hasta: new Date(+ahora + HORAS_ENFERMO * 36e5), causa: it.name };
    }
    const q = R > 1 && pl.resta > 0, upd = q ? { $set: { ...set, "inventory.$.quedan": pl.resta } } : { $set: set, $pull: { inventory: { fid } } };
    const r = await us.updateOne({ id: u.id, inventory: { $elemMatch: { fid } } }, upd);
    if (!r.modifiedCount) return bad("No se pudo consumir");
    const u1 = unidadDe(it), cuanto = R > 1 ? `${pl.n} ${plural(pl.n, u1)} de ` : "";
    return NextResponse.json({ ok: true, enfermo, msg: enfermo ? `Estaba vencido y te enfermaste: -${perdida.comida}% comida, -${perdida.agua}% agua` : `${tipo === "agua" ? "Bebiste" : "Comiste"} ${cuanto}${it.name}: +${gana}% de ${tipo}${q ? ` · te quedan ${pl.resta}` : ""}${pl.limitado ? " (con eso ya estás al 100%)" : ""}${venc ? " (estaba vencido, tuviste suerte)" : ""}` });
  }
  return bad("Acción inválida");
}
