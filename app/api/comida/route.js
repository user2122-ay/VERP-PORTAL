import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { nivelDe, HORAS } from "@/lib/cuerpo";
import { estaRetenido } from "@/lib/decomiso";
import { esComida, neveraDe, enNevera, vencido, venceMs, FACTOR_NEVERA, HORAS_ENFERMO, PROB_ENFERMAR } from "@/lib/comida";
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
    const n = neveraDe(u); if (!n) return bad("No tienes nevera. Compra una en la Tool Store (Mercado → Herramientas)");
    if (it.enNevera) return bad("Ya está en la nevera");
    if (venc) return bad("Eso ya está vencido: no lo guardes, bótalo o cómelo bajo tu riesgo");
    if (enNevera(u).length >= (n.capacidad || 10)) return bad("No hay espacio en tu nevera");
    const resto = venceMs(it) - +ahora, vence = new Date(+ahora + resto * FACTOR_NEVERA);
    const r = await us.updateOne({ id: u.id, inventory: { $elemMatch: { fid, enNevera: { $ne: true } } } }, { $set: { "inventory.$.enNevera": true, "inventory.$.vence": vence } });
    return r.modifiedCount ? NextResponse.json({ ok: true, msg: `${it.name} guardado en la nevera: dura más` }) : bad("No se pudo guardar");
  }
  if (b.accion === "sacar") {
    if (!it.enNevera) return bad("No está en la nevera");
    const resto = Math.max(0, venceMs(it) - +ahora) / FACTOR_NEVERA, vence = new Date(+ahora + resto);
    const r = await us.updateOne({ id: u.id, inventory: { $elemMatch: { fid, enNevera: true } } }, { $set: { "inventory.$.enNevera": false, "inventory.$.vence": vence } });
    return r.modifiedCount ? NextResponse.json({ ok: true, msg: `${it.name} fuera de la nevera` }) : bad("No se pudo sacar");
  }
  if (b.accion === "comer") {
    const { tipo, pct } = it.consumo || {}; if (!tipo) return bad("No se puede consumir");
    const actual = nivelDe(u.cuerpo?.[tipo], HORAS[tipo]); if (actual >= 95) return bad(tipo === "agua" ? "Todavía no tienes sed" : "Todavía no tienes hambre");
    const set = { [`cuerpo.${tipo}`]: { n: Math.min(100, actual + pct), t: ahora } }; let enfermo = false, perdida = null;
    if (venc && Math.random() < PROB_ENFERMAR) { // comida vencida: te enfermas y pierdes un pequeño % de comida y agua
      enfermo = true; const c = nivelDe(u.cuerpo?.comida, HORAS.comida), a = nivelDe(u.cuerpo?.agua, HORAS.agua), pc = al(4, 12), pa = al(4, 12);
      const baseC = tipo === "comida" ? Math.min(100, c + pct) : c, baseA = tipo === "agua" ? Math.min(100, a + pct) : a;
      set["cuerpo.comida"] = { n: Math.max(1, baseC - pc), t: ahora }; set["cuerpo.agua"] = { n: Math.max(1, baseA - pa), t: ahora }; perdida = { comida: pc, agua: pa };
      set["cuerpo.enfermo"] = { hasta: new Date(+ahora + HORAS_ENFERMO * 36e5), causa: it.name };
    }
    const r = await us.updateOne({ id: u.id, inventory: { $elemMatch: { fid } } }, { $set: set, $pull: { inventory: { fid } } });
    if (!r.modifiedCount) return bad("No se pudo consumir");
    return NextResponse.json({ ok: true, enfermo, msg: enfermo ? `Estaba vencido y te enfermaste: -${perdida.comida}% comida, -${perdida.agua}% agua` : `${tipo === "agua" ? "Bebiste" : "Comiste"} ${it.name}: +${pct}% de ${tipo}${venc ? " (estaba vencido, tuviste suerte)" : ""}` });
  }
  return bad("Acción inválida");
}
