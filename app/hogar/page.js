import Shell from "@/components/Shell";
import Hogar from "./Hogar";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { casaRef } from "@/lib/mdt";
import { guardable, esAuto } from "@/lib/casa";
import { esComida, neveraDe, enNevera, vencido, venceMs } from "@/lib/comida";
import { tipoDe, cupo, plazas, HAB, etiquetaCasa, DIAS_INVITACION, CUOTA_MAX } from "@/lib/hogar";
export const dynamic = "force-dynamic";
export const metadata = { title: "Hogar · VE:RP" };
const iso = (x) => new Date(x).toISOString();
export default async function P() {
  const u = await needUser(), d = await db(), col = d.collection("hogares"), items = u.inventory || [];
  // Como dueño
  const casas = items.filter((i) => i.category === "Propiedades"), docs = Object.fromEntries((await col.find({ _id: { $in: casas.map((c) => casaRef(c.name, c.at)) } }).toArray()).map((h) => [h._id, h]));
  const mias = casas.map((c) => { const ref = casaRef(c.name, c.at), h = docs[ref], t = tipoDe(c), hb = HAB[t]; return { ref, label: etiquetaCasa(c), tipo: t, hab: `${hb.ind} individual(es) y ${hb.mat} matrimonial(es)${hb.garaje ? " · garaje" : ""}`, cupo: cupo(t), plazas: plazas(t),
    ocup: (h?.ocup || []).map((o) => ({ id: o.id, name: o.name, modo: o.modo, cuota: o.cuota, prox: o.prox ? iso(o.prox) : null })), inv: (h?.inv || []).filter((x) => +new Date(x.at) > Date.now() - DIAS_INVITACION * 864e5).map((x) => ({ id: x.id, name: x.name, modo: x.modo, cuota: x.cuota })) }; });
  // Como invitado
  const invs = (await col.find({ "inv.id": u.id }).toArray()).map((h) => { const x = h.inv.find((y) => y.id === u.id); return { ref: h._id, label: h.etiqueta, dueno: h.ownerName, modo: x.modo, cuota: x.cuota, vence: iso(+new Date(x.at) + DIAS_INVITACION * 864e5), vencida: +new Date(x.at) < Date.now() - DIAS_INVITACION * 864e5 }; }).filter((x) => !x.vencida);
  // Como ocupante
  const h = await col.findOne({ "ocup.id": u.id }); let vivo = null;
  if (h) {
    const yo = h.ocup.find((x) => x.id === u.id), dueno = await d.collection("users").findOne({ id: h.owner }, { projection: { inventory: 1, name: 1 } }), inv = dueno?.inventory || [], nev = neveraDe(dueno), nombres = Object.fromEntries(h.ocup.map((o) => [o.id, o.name])); nombres[h.owner] = h.ownerName; const familia = yo.modo === "familia";
    const guard = inv.filter((i) => i.loc === "casa" && i.casa === h._id), vis = guard.filter((i) => i.por === u.id || (familia && i.lugar !== "Caja fuerte"));
    vivo = { ref: h._id, label: h.etiqueta, dueno: h.ownerName, modo: yo.modo, cuota: yo.cuota, prox: yo.prox ? iso(yo.prox) : null, companeros: h.ocup.filter((o) => o.id !== u.id).map((o) => ({ name: o.name, modo: o.modo })), ocultos: guard.length - vis.length,
      objetos: vis.map((i) => ({ name: i.name, at: iso(i.at), img: i.img || "", lugar: i.lugar, por: i.por ? nombres[i.por] || "" : "Dueño", puede: i.por === u.id || (familia && !esAuto(i) && i.lugar !== "Caja fuerte" && !i.plantada) })),
      tieneNevera: !!nev, cap: nev?.capacidad || 10, nevera: enNevera(dueno).filter((i) => !i.casa || i.casa === h._id).map((i) => ({ fid: i.fid, name: i.name, img: i.img || "", resta: Math.max(0, venceMs(i) - Date.now()), por: i.por ? nombres[i.por] || "" : "Dueño", puede: familia || i.por === u.id })),
      mios: items.filter((i) => guardable(i) && i.loc !== "casa").map((i) => ({ name: i.name, at: iso(i.at), auto: esAuto(i) })), comida: items.filter((i) => esComida(i) && !i.enNevera && !vencido(i)).map((i) => ({ fid: i.fid, name: i.name })) };
  }
  return <Shell user={u}><Hogar mias={mias} invs={invs} vivo={vivo} cuotaMax={CUOTA_MAX} /></Shell>;
}
