import Shell from "@/components/Shell";
import { CARD } from "../banco/Cards";
import { needUser } from "@/lib/auth";
import { BANCOS } from "@/lib/bancos";
import { fmtTel } from "@/lib/redes";
import { db } from "@/lib/db";
import LicenciaCard from "@/components/LicenciaCard";
import { licTipo } from "@/lib/licencia";
import Link from "next/link";
import { Guardar, Sacar } from "./Guardar";
import { guardable, esAuto, ESPERA_GUARDAR } from "@/lib/casa";
import Gestion from "../negocios/Gestion";
import { NEGOCIOS, ensureNegocios, planesDe } from "@/lib/negocios";
import { casaRef } from "@/lib/mdt";
export const dynamic = "force-dynamic";
const G = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 };
export default async function P({ searchParams }) {
  const u = await needUser(), cu = u.cuentas || {}, own = Object.keys(BANCOS).filter((k) => cu[k]), items = u.inventory || [], nombres = [...new Set(items.filter((i) => !i.img).map((i) => i.name))];
  const dd = await db(); await ensureNegocios(dd);
  const misNeg = (await dd.collection("negocios").find({ owner: u.id }).toArray()).filter((n) => NEGOCIOS[n._id]), planes = await planesDe(dd), itemsNeg = {};
  for (const n of misNeg) itemsNeg[n._id] = (await dd.collection("items").find({ negocio: n._id }).sort({ name: 1 }).limit(300).toArray()).map((i) => ({ id: String(i._id), name: i.name, price: i.price, impuesto: i.impuesto || 0 }));
  const v = searchParams?.v === "casa" ? "casa" : searchParams?.v === "negocios" && misNeg.length ? "negocios" : "personal", personal = items.filter((i) => i.loc !== "casa"), enCasa = items.filter((i) => i.loc === "casa");
  const casas = items.filter((i) => i.category === "Propiedades"), opcCasas = casas.map((c) => ({ ref: casaRef(c.name, c.at), label: `${c.name}${c.ubicacion ? " · " + c.ubicacion : ""}` })), espera = u.guardarAt ? Math.max(0, ESPERA_GUARDAR - (Date.now() - +new Date(u.guardarAt))) : 0;
  const lics = personal.filter((i) => licTipo(i)), otros = personal.filter((i) => !licTipo(i));
  const fotos = nombres.length ? Object.fromEntries((await (await db()).collection("items").find({ name: { $in: nombres } }, { projection: { name: 1, img: 1 } }).toArray()).map((x) => [x.name, x.img])) : {};
  return (<Shell user={u}><div style={{ maxWidth: 1100, margin: "0 auto" }}><h2>Inventario</h2>
    <div style={{ display: "flex", gap: 8, margin: "8px 0 12px" }}><Link className={"btn " + (v === "personal" ? "" : "g")} href="/inventario">Personal</Link><Link className={"btn " + (v === "casa" ? "" : "g")} href="/inventario?v=casa">Casa{enCasa.length ? ` (${enCasa.length})` : ""}</Link>{misNeg.length > 0 && <Link className={"btn " + (v === "negocios" ? "" : "g")} href="/inventario?v=negocios">Negocios ({misNeg.length})</Link>}</div>
    {v === "negocios" ? (<>
      <p className="mut">Aquí administras tus negocios: cambia los precios de lo que vendes y decide si pagas el ITBMS. Lo que vendes llega a tu Tarjeta de Comerciante.</p>
      {misNeg.map((n) => { const x = NEGOCIOS[n._id]; return (<div key={n._id} style={{ marginBottom: 14 }}><div className="card"><img src={x.img} alt={x.nombre} style={{ width: "100%", maxWidth: 420, aspectRatio: "16/10", objectFit: "cover", borderRadius: 12 }} /><div style={{ marginTop: 8 }}><b>{x.nombre}</b> <span className="tag">Eres el dueño</span></div><div className="mut">{x.edita}</div></div>
        <Gestion k={n._id} items={itemsNeg[n._id] || []} planes={planes} paga={n.pagaImpuesto !== false} /></div>); })}
    </>) : null}
    {v === "negocios" ? null : v === "casa" ? (<>
      <p className="mut">Lo que guardas en casa no se puede robar en un asalto: solo te pueden robar lo que llevas encima. Para guardar otro objeto hay que esperar 10 minutos.</p>
      {!casas.length && <div className="card mut">Necesitas una casa para guardar cosas. Compra una en el Mercado → Propiedades.</div>}
      {casas.map((c) => { const ref = casaRef(c.name, c.at), its = enCasa.filter((i) => i.casa === ref), por = its.reduce((g, i) => ((g[i.lugar || "Sin especificar"] = g[i.lugar || "Sin especificar"] || []).push(i), g), {});
        return (<div key={ref} className="card" style={{ marginBottom: 12 }}><b>{c.name}</b><div className="mut">{c.ubicacion}{c.color ? ` · Color ${c.color}` : ""} · {its.length} objeto(s) guardado(s)</div>
          {Object.entries(por).map(([lugar, l]) => <div key={lugar} style={{ marginTop: 10 }}><b>{lugar}</b>{l.map((i, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--bd)" }}><span>{i.name} <span className="tag">{i.category}</span>{i.robado && <span className="rob-t" style={{ fontSize: 11, marginLeft: 6 }}>ROBADO</span>}</span><Sacar name={i.name} at={new Date(i.at).toISOString()} /></div>)}</div>)}
          {!its.length && <p className="mut">Aún no has escondido nada aquí.</p>}</div>); })}
      {enCasa.filter((i) => !casas.some((c) => casaRef(c.name, c.at) === i.casa)).length > 0 && <div className="card" style={{ borderColor: "var(--bad)" }}><b>Objetos de una casa que ya no es tuya</b>{enCasa.filter((i) => !casas.some((c) => casaRef(c.name, c.at) === i.casa)).map((i, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>{i.name}</span><Sacar name={i.name} at={new Date(i.at).toISOString()} /></div>)}</div>}
    </>) : (<>
    {own.length > 0 && <><h3>Tarjetas bancarias</h3><div style={G}>{own.map((k) => <div key={k}>{(() => { const C = CARD[k]; return <C c={u.cedula} cuenta={cu[k]} />; })()}</div>)}</div></>}
    {u.chip && <div className="card" style={{ marginTop: 14 }}><span className="tag">Línea telefónica</span><div><b>{fmtTel(u.chip.num)}</b></div><div className="mut">Chip de VE WhatsApp{u.plan ? ` · Plan $${u.plan.monto}/semana` : ""}</div></div>}
    {lics.length > 0 && <><h3 style={{ marginTop: 18 }}>Licencias</h3><div style={G}>{lics.map((i, k) => <LicenciaCard key={k} tipo={licTipo(i)} c={u.cedula} num={i.licNum} emision={i.at} />)}</div></>}
    <h3 style={{ marginTop: 18 }}>Lo que llevas encima</h3>
    {otros.length ? <div className="grid">{otros.map((i, k) => { const img = i.img || fotos[i.name]; return (<div className={"card" + (i.robado ? " rob" : "")} key={k}><div className="mi">{img ? <img src={img} alt="" /> : <span className="mut">Sin foto</span>}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><span className="tag">{i.category}</span>{i.robado && <span className="rob-t">ROBADO</span>}</div><div><b>{i.name}</b></div>
      {i.placa && <div className="mut">Placa: <b>{i.placa}</b>{i.color ? ` · ${i.color}` : ""}</div>}{i.ubicacion && <div className="mut">Ubicación: {i.ubicacion}</div>}{i.color && !i.placa && <div className="mut">Color: {i.color}</div>}{i.vence && <div className="mut">{new Date(i.vence) > new Date() ? "Vence" : "Expiró"}: {new Date(i.vence).toLocaleDateString("es")}</div>}
      <div className="mut">{i.robado ? "Robado" : "Pagado"}: ${Number(i.price).toLocaleString("es")} · {new Date(i.at).toLocaleDateString("es")}</div>
      {guardable(i) && casas.length > 0 && <Guardar name={i.name} at={new Date(i.at).toISOString()} casas={opcCasas} espera={espera} auto={esAuto(i)} />}</div>); })}</div> : <div className="card mut">No llevas nada encima. Visita el Mercado.</div>}
    </>)}</div></Shell>);
}
