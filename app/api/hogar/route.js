import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { nombreDe } from "@/lib/rol";
import { casaRef } from "@/lib/mdt";
import { LUGARES_CASA, ESPERA_GUARDAR, guardable, esAuto } from "@/lib/casa";
import { esComida, neveraDeCasa, nidDe, nevDe, enNeveraId, capNev, vencido, venceMs, FACTOR_NEVERA, HORAS_ENFERMO, PROB_ENFERMAR, racionesDe, plan, unidadDe, plural } from "@/lib/comida";
import { nivelDe, HORAS, refCuerpo } from "@/lib/cuerpo";
import { estaRetenido } from "@/lib/decomiso";
import { tipoDe, cupo, etiquetaCasa, limpiar, cobrarCuota, quitarOcupante, devolverCosas, CUOTA_MAX, DIAS_INVITACION, MAX_DEPOSITOS, SEM } from "@/lib/hogar";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s }), ok = (x = {}) => NextResponse.json({ ok: true, ...x }), al = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Acciones del dueño: invitar, cancelar, expulsar. Del ocupante: aceptar, rechazar, salir, guardar/sacar objetos y usar la nevera.
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401); if (u.muerte) return bad("Tu personaje murió", 403);
  const b = await req.json().catch(() => ({})), d = await db(), us = d.collection("users"), col = d.collection("hogares"), ref = String(b.casa || ""), ahora = new Date(), A = b.accion;
  const miCasa = (u.inventory || []).find((i) => i.category === "Propiedades" && casaRef(i.name, i.at) === ref);
  // ---------- DUEÑO ----------
  if (A === "invitar") {
    if (!miCasa) return bad("Elige una de tus casas"); const modo = b.modo === "alquiler" ? "alquiler" : "familia", cuota = modo === "alquiler" ? Math.floor(Number(b.cuota)) : 0;
    if (modo === "alquiler" && !(cuota >= 1 && cuota <= CUOTA_MAX)) return bad(`La cuota semanal va de $1 a $${CUOTA_MAX.toLocaleString("es")}`);
    const rx = String(b.quien || "").trim(); if (!rx) return bad("Escribe el usuario de Roblox o la cédula de la persona");
    const t = await us.findOne({ cedula: { $exists: true }, $or: [{ "cedula.roblox": { $regex: `^${esc(rx)}$`, $options: "i" } }, { "cedula.num": rx }] }); if (!t) return bad("No encontré a ese jugador (usa su usuario de Roblox o su cédula)"); if (t.id === u.id) return bad("No puedes invitarte a ti mismo");
    if (await col.findOne({ "ocup.id": t.id })) return bad("Esa persona ya vive en otra casa compartida");
    const h = (await col.findOne({ _id: ref })) || { ocup: [], inv: [] }, vivos = (h.inv || []).filter((x) => +new Date(x.at) > Date.now() - DIAS_INVITACION * 864e5);
    if (h.ocup.some((x) => x.id === t.id) || vivos.some((x) => x.id === t.id)) return bad("Esa persona ya vive aquí o ya tiene una invitación pendiente");
    if (h.ocup.length + vivos.length >= cupo(tipoDe(miCasa))) return bad(`Esta casa solo tiene lugar para ${cupo(tipoDe(miCasa))} ocupante(s) además de ti`);
    await col.updateOne({ _id: ref }, { $setOnInsert: { owner: u.id, ownerName: nombreDe(u), etiqueta: etiquetaCasa(miCasa), tipo: tipoDe(miCasa), ocup: [] }, $set: { inv: [...vivos, { id: t.id, name: nombreDe(t), modo, cuota, at: ahora }] } }, { upsert: true });
    await d.collection("notifs").insertOne({ uid: t.id, title: "Invitación a vivir en una casa", body: `${nombreDe(u)} te invita a vivir en ${etiquetaCasa(miCasa)} como ${modo === "familia" ? "familia (gratis)" : `alquilino ($${cuota.toLocaleString("es")} por semana)`}. Respóndela en Hogar.`, at: ahora, read: false });
    return ok();
  }
  if (A === "cancelarInv") { if (!miCasa) return bad("Elige una de tus casas"); await col.updateOne({ _id: ref, owner: u.id }, { $pull: { inv: { id: String(b.id) } } }); return ok(); }
  if (A === "expulsar") {
    const h = await col.findOne({ _id: ref, owner: u.id }); if (!h || !miCasa) return bad("No es tu casa", 403); if (!h.ocup.some((x) => x.id === String(b.id))) return bad("Esa persona no vive aquí");
    await quitarOcupante(d, h, String(b.id), "el dueño te sacó de la casa. Recuperaste lo que tenías guardado allí"); return ok();
  }
  // ---------- INVITADO ----------
  if (A === "aceptar" || A === "rechazar") {
    const h = await col.findOne({ _id: ref, "inv.id": u.id }); if (!h) return bad("Esa invitación ya no existe", 404); const inv = h.inv.find((x) => x.id === u.id);
    if (A === "rechazar" || +new Date(inv.at) < Date.now() - DIAS_INVITACION * 864e5) { await col.updateOne({ _id: ref }, { $pull: { inv: { id: u.id } } }); return A === "rechazar" ? ok() : bad("La invitación venció"); }
    if (await col.findOne({ "ocup.id": u.id })) return bad("Ya vives en una casa compartida: sal primero"); if (h.ocup.length >= cupo(h.tipo)) return bad("La casa ya está llena");
    const dueno = await us.findOne({ id: h.owner, inventory: { $elemMatch: { category: "Propiedades" } } }); if (!dueno || !(dueno.inventory || []).some((i) => casaRef(i.name, i.at) === ref)) { await col.deleteOne({ _id: ref }); return bad("Esa casa ya no existe", 404); }
    if (inv.cuota > 0 && !(await cobrarCuota(d, u, h.owner, inv.cuota, `Alquiler de ${h.etiqueta} (primera semana)`))) return bad(`Necesitas $${inv.cuota.toLocaleString("es")} para pagar la primera semana`);
    const r = await col.updateOne({ _id: ref, "inv.id": u.id }, { $pull: { inv: { id: u.id } }, $push: { ocup: { id: u.id, name: nombreDe(u), modo: inv.modo, cuota: inv.cuota, desde: ahora, prox: new Date(+ahora + SEM) } } });
    if (!r.modifiedCount) return bad("No se pudo aceptar"); await d.collection("notifs").insertOne({ uid: h.owner, title: "Vivienda compartida", body: `${nombreDe(u)} aceptó vivir en ${h.etiqueta}.`, at: ahora, read: false }); return ok();
  }
  // ---------- OCUPANTE ----------
  const h = ref ? await col.findOne({ _id: ref }) : null, yo = h?.ocup?.find((x) => x.id === u.id); if (!h || !yo) return bad("No vives en esa casa", 403);
  if (A === "salir") { await quitarOcupante(d, h, u.id, "saliste de la casa. Recuperaste lo que tenías guardado allí"); await d.collection("notifs").insertOne({ uid: h.owner, title: "Vivienda compartida", body: `${yo.name} se fue de ${h.etiqueta}.`, at: ahora, read: false }); return ok(); }
  const dueno = await us.findOne({ id: h.owner }); if (!dueno) return bad("Dueño no encontrado", 404);
  const falta = u.guardarAt ? ESPERA_GUARDAR - (Date.now() - +new Date(u.guardarAt)) : 0, familia = yo.modo === "familia";
  const sel = (n) => n.casa === ref && n.loc === "casa";
  if (A === "guardar") {
    const it = (u.inventory || []).find((i) => i.name === b.name && +new Date(i.at) === +new Date(b.at)); if (!it) return bad("Ese objeto no está en tu inventario");
    if (it.loc === "casa") return bad("Ya está guardado en una casa"); if (!guardable(it)) return bad("Ese objeto no se puede guardar en una casa"); if (falta > 0) return bad(`Espera ${Math.ceil(falta / 60000)} min para pasar otro objeto`);
    const auto = esAuto(it), lugar = auto ? "Garaje" : b.lugar; if (!LUGARES_CASA.includes(lugar)) return bad("Elige en qué parte de la casa lo escondes");
    const ya = (dueno.inventory || []).filter((i) => sel(i)); if (auto && ya.some(esAuto)) return bad("El garaje de esa casa ya tiene un auto. Solo cabe uno por garaje"); if (ya.filter((i) => i.por === u.id).length >= MAX_DEPOSITOS) return bad(`Solo puedes tener ${MAX_DEPOSITOS} objetos tuyos guardados en esta casa`);
    if (!(await us.updateOne({ id: u.id, inventory: { $elemMatch: { name: it.name, at: it.at, loc: { $ne: "casa" } } } }, { $pull: { inventory: { name: it.name, at: it.at } }, $set: { guardarAt: ahora } })).modifiedCount) return bad("No se pudo guardar");
    await us.updateOne({ id: h.owner }, { $push: { inventory: { ...it, loc: "casa", casa: ref, lugar, por: u.id } } }); return ok();
  }
  if (A === "sacar") {
    const it = (dueno.inventory || []).find((i) => sel(i) && i.name === b.name && +new Date(i.at) === +new Date(b.at)); if (!it) return bad("Ese objeto ya no está en la casa", 404); const mio = it.por === u.id;
    if (!mio && (!familia || esAuto(it) || it.lugar === "Caja fuerte")) return bad(familia ? "Los autos y lo de la caja fuerte solo los saca el dueño" : "Como alquilino solo puedes sacar lo que tú guardaste");
    if (it.plantada) return bad("Una planta sembrada no se puede sacar: espera a cosecharla"); if (falta > 0) return bad(`Espera ${Math.ceil(falta / 60000)} min para pasar otro objeto`);
    if (!(await us.updateOne({ id: h.owner, inventory: { $elemMatch: { name: it.name, at: it.at, loc: "casa", casa: ref, plantada: { $ne: true } } } }, { $pull: { inventory: { name: it.name, at: it.at, loc: "casa", casa: ref } } })).modifiedCount) return bad("No se pudo sacar");
    await us.updateOne({ id: u.id }, { $push: { inventory: limpiar(it) }, $set: { guardarAt: ahora } }); return ok();
  }
  // ---------- NEVERA COMPARTIDA (la del dueño) ----------
  const nev = neveraDeCasa(dueno, ref), nid = nidDe(nev), fid = String(b.fid || ""); if (!nev) return bad("El dueño de la casa no tiene nevera");
  if (A === "nev_guardar") {
    const it = (u.inventory || []).find((i) => esComida(i) && i.fid === fid); if (!it) return bad("Esa comida ya no está en tu inventario", 404); if (estaRetenido(it)) return bad("Está retenida por la policía", 403); if (it.enNevera) return bad("Ya está en una nevera"); if (vencido(it)) return bad("Eso ya está vencido: no lo guardes");
    if (enNeveraId(dueno, nid).length >= capNev(nev)) return bad("La nevera de la casa está llena");
    const vence = new Date(+ahora + (venceMs(it) - +ahora) * FACTOR_NEVERA);
    if (!(await us.updateOne({ id: u.id }, { $pull: { inventory: { fid } } })).modifiedCount) return bad("No se pudo guardar");
    await us.updateOne({ id: h.owner }, { $push: { inventory: { ...it, enNevera: true, vence, casa: ref, nev: nid, por: u.id } } }); return ok({ msg: `${it.name} guardado en la nevera de la casa` });
  }
  const it = (dueno.inventory || []).find((i) => esComida(i) && i.fid === fid && i.enNevera && nevDe(dueno, i) === nid); if (!it) return bad("Esa comida ya no está en la nevera", 404);
  if (A === "nev_sacar") {
    if (!familia && it.por !== u.id) return bad("Como alquilino solo puedes sacar lo que tú guardaste");
    if (!(await us.updateOne({ id: h.owner }, { $pull: { inventory: { fid, enNevera: true } } })).modifiedCount) return bad("No se pudo sacar");
    const y = limpiar(it); y.enNevera = false; y.vence = new Date(+ahora + Math.max(0, venceMs(it) - +ahora) / FACTOR_NEVERA); await us.updateOne({ id: u.id }, { $push: { inventory: y } }); return ok({ msg: `${it.name} fuera de la nevera` });
  }
  if (A === "nev_comer") { // se puede comer lo que haya en la nevera de la casa (lo de otros también): es una casa compartida. Por raciones: n, "mitad" o "todo"
    const { tipo, pct } = it.consumo || {}; if (!tipo) return bad("No se puede consumir"); const rc = await refCuerpo(d, u), actual = nivelDe(u.cuerpo?.[tipo], HORAS[tipo], rc), R = racionesDe(it); if (actual >= (R > 1 ? 99.5 : 95)) return bad(tipo === "agua" ? "Todavía no tienes sed" : "Todavía no tienes hambre");
    const pl = plan(it, b, actual), gana = R > 1 ? pl.gana : pct, venc = vencido(it), set = { [`cuerpo.${tipo}`]: { n: Math.min(100, actual + gana), t: ahora } }; let enfermo = false, perdida = null;
    if (venc && Math.random() < PROB_ENFERMAR) { enfermo = true; const c = nivelDe(u.cuerpo?.comida, HORAS.comida, rc), a = nivelDe(u.cuerpo?.agua, HORAS.agua, rc), pc = al(4, 12), pa = al(4, 12), bc = tipo === "comida" ? Math.min(100, c + gana) : c, ba = tipo === "agua" ? Math.min(100, a + gana) : a; set["cuerpo.comida"] = { n: Math.max(1, bc - pc), t: ahora }; set["cuerpo.agua"] = { n: Math.max(1, ba - pa), t: ahora }; perdida = { comida: pc, agua: pa }; set["cuerpo.enfermo"] = { hasta: new Date(+ahora + HORAS_ENFERMO * 36e5), causa: it.name }; }
    const q = R > 1 && pl.resta > 0;
    if (!(await us.updateOne({ id: h.owner, inventory: { $elemMatch: { fid, enNevera: true } } }, q ? { $set: { "inventory.$.quedan": pl.resta } } : { $pull: { inventory: { fid, enNevera: true } } })).modifiedCount) return bad("Otra persona ya se lo comió");
    await us.updateOne({ id: u.id }, { $set: set }); const cuanto = R > 1 ? `${pl.n} ${plural(pl.n, unidadDe(it))} de ` : "";
    return ok({ enfermo, msg: enfermo ? `Estaba vencido y te enfermaste: -${perdida.comida}% comida, -${perdida.agua}% agua` : `${tipo === "agua" ? "Bebiste" : "Comiste"} ${cuanto}${it.name}: +${gana}% de ${tipo}${q ? ` · quedan ${pl.resta}` : ""}${pl.limitado ? " (con eso ya estás al 100%)" : ""}` });
  }
  return bad("Acción inválida");
}
