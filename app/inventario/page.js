import Shell from "@/components/Shell";
import { CARD } from "../banco/Cards";
import { needUser } from "@/lib/auth";
import { BANCOS } from "@/lib/bancos";
import { fmtTel } from "@/lib/redes";
import { db } from "@/lib/db";
import LicenciaCard from "@/components/LicenciaCard";
import { licTipo } from "@/lib/licencia";
import Link from "next/link";
import { metodosDe } from "@/lib/pago";
import { estaRetenido } from "@/lib/decomiso";
import { estadoMulta } from "@/lib/multas";
import { revendible } from "@/lib/usados";
import Revender from "./Revender";
import PagarMulta from "./PagarMulta";
import { Receipt } from "lucide-react";
import { Guardar, Sacar } from "./Guardar";
import { guardable, esAuto, ESPERA_GUARDAR, MAX_CASAS } from "@/lib/casa";
import Gestion from "../negocios/Gestion";
import { NEGOCIOS, ensureNegocios, planesDe, finanzasDe } from "@/lib/negocios";
import Finanzas from "../negocios/Finanzas";
import { casaRef } from "@/lib/mdt";
import Comida from "./Comida";
import { esNevera, esComida, neveraDe } from "@/lib/comida";
import { tasaITBMS } from "@/lib/tesoreria";
export const dynamic = "force-dynamic";
const G = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 };
export default async function P({ searchParams }) {
  const u = await needUser(), cu = u.cuentas || {}, own = Object.keys(BANCOS).filter((k) => cu[k]), items = u.inventory || [], nombres = [...new Set(items.filter((i) => !i.img).map((i) => i.name))];
  const dd = await db(); await ensureNegocios(dd);
  const multas = (await dd.collection("multas").find({ sujeto: u.id }).sort({ at: -1 }).limit(50).toArray()).map((m) => ({ ...m, id: String(m._id), est: estadoMulta(m) })), debe = multas.filter((m) => m.est !== "pagada"), hayVencida = multas.some((m) => m.est === "vencida"), metodos = metodosDe(u);
  const misNeg = (await dd.collection("negocios").find({ owner: u.id }).toArray()).filter((n) => NEGOCIOS[n._id]), planes = await planesDe(dd), itemsNeg = {}, recientes = {};
  for (const n of misNeg) recientes[n._id] = (await dd.collection("tx").find({ user: u.id, type: "venta", neg: n._id }).sort({ at: -1 }).limit(6).toArray()).map((t) => ({ item: t.item, amount: t.amount, at: t.at }));
  for (const n of misNeg) itemsNeg[n._id] = (await dd.collection("items").find({ negocio: n._id }).sort({ name: 1 }).limit(300).toArray()).map((i) => ({ id: String(i._id), name: i.name, price: i.price, impuesto: i.impuesto || 0 }));
  const cfg = (await dd.collection("config").findOne({ _id: "tesoreria" })) || {}, cambioTasa = cfg.itbmsCambio ? { de: Math.round((cfg.itbmsPrev ?? 0.07) * 1000) / 10, a: Math.round((cfg.itbms ?? 0.07) * 1000) / 10, sube: (cfg.itbms ?? 0.07) > (cfg.itbmsPrev ?? 0.07), at: cfg.itbmsCambio } : null;
  const v = searchParams?.v === "casa" ? "casa" : searchParams?.v === "multas" ? "multas" : searchParams?.v === "comida" ? "comida" : searchParams?.v === "negocios" && misNeg.length ? "negocios" : "personal", personal = items.filter((i) => i.loc !== "casa" && !esComida(i) && !esNevera(i)), enCasa = items.filter((i) => i.loc === "casa");
  const casas = items.filter((i) => i.category === "Propiedades"), opcCasas = casas.map((c) => ({ ref: casaRef(c.name, c.at), label: `${c.name}${c.ubicacion ? " · " + c.ubicacion : ""}` })), espera = u.guardarAt ? Math.max(0, ESPERA_GUARDAR - (Date.now() - +new Date(u.guardarAt))) : 0;
  const lics = personal.filter((i) => licTipo(i)), otros = personal.filter((i) => !licTipo(i));
  const fotos = nombres.length ? Object.fromEntries((await (await db()).collection("items").find({ name: { $in: nombres } }, { projection: { name: 1, img: 1 } }).toArray()).map((x) => [x.name, x.img])) : {};
  return (<Shell user={u}><div style={{ maxWidth: 1100, margin: "0 auto" }}><h2>Inventario</h2>
    <div style={{ display: "flex", gap: 8, margin: "8px 0 12px" }}><Link className={"btn " + (v === "personal" ? "" : "g")} href="/inventario">Personal</Link><Link className={"btn " + (v === "casa" ? "" : "g")} href="/inventario?v=casa">Casa{enCasa.length ? ` (${enCasa.length})` : ""}</Link><Link className={"btn " + (v === "comida" ? "" : "g")} href="/inventario?v=comida">Comida{items.filter(esComida).length ? ` (${items.filter(esComida).length})` : ""}</Link><Link className={"btn " + (v === "multas" ? "" : "g")} href="/inventario?v=multas" style={hayVencida ? { borderColor: "var(--bad)", color: v === "multas" ? undefined : "var(--bad)" } : undefined}><Receipt size={16} />Multas{debe.length ? ` (${debe.length})` : ""}</Link>{misNeg.length > 0 && <Link className={"btn " + (v === "negocios" ? "" : "g")} href="/inventario?v=negocios">Negocios ({misNeg.length})</Link>}</div>
    {v === "negocios" ? (<>
      <p className="mut">Aquí administras tus negocios: cambia los precios de lo que vendes y decide si pagas el ITBMS. Lo que vendes llega a tu Tarjeta de Comerciante.</p>
      {misNeg.map((n) => { const x = NEGOCIOS[n._id]; return (<div key={n._id} style={{ marginBottom: 14 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, alignItems: "start" }}><div className="card" style={{ margin: 0 }}><img src={x.img} alt={x.nombre} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: 12 }} /><div style={{ marginTop: 8 }}><b>{x.nombre}</b> <span className="tag">Eres el dueño</span>{n.estado === "moroso" && <span className="tag" style={{ color: "#ff9f1a", marginLeft: 6 }}>MOROSO</span>}{n.estado === "clausurado" && <span className="tag" style={{ color: "var(--bad)", marginLeft: 6 }}>CLAUSURADO</span>}</div><div className="mut">{x.edita}</div></div>
          <Finanzas f={finanzasDe(n)} recientes={recientes[n._id] || []} nombre={x.nombre} /></div>
        <Gestion k={n._id} items={itemsNeg[n._id] || []} planes={planes} paga={n.pagaImpuesto !== false} estado={n.estado || "normal"} comida={!!x.comida} multaOk={!!n.multaPagadaAt && +new Date(n.multaPagadaAt) >= +new Date(n.clausuradoAt || 0)} aviso={!x.comida && n._id !== "taller" && cambioTasa ? cambioTasa : null} /></div>); })}
    </>) : null}
    {v === "multas" && (<>
      <p className="mut">Las multas de la Policía Nacional Bolivariana no se cobran solas: las pagas tú cuando quieras, pero tienes mínimo 10 días. Si una vence sin pagar es <b>desacato</b> y el oficial puede detenerte o retenerte la licencia.</p>
      {multas.map((m) => { const col = m.est === "vencida" ? "var(--bad)" : m.est === "pagada" ? "var(--ok)" : "#ff9f1a", dias = Math.ceil((new Date(m.vence) - Date.now()) / 864e5); return (<div key={m.id} className="card" style={{ borderColor: col }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}><span className="big" style={{ fontSize: 26, color: col }}>${m.monto.toLocaleString("es")}</span><span className="tag" style={{ color: col, border: `1px solid ${col}` }}>{m.est === "pagada" ? "Pagada" : m.est === "vencida" ? "VENCIDA · desacato" : `Pendiente · ${dias} día(s)`}</span></div>
        <div style={{ marginTop: 6 }}><b>Artículos:</b> {(m.articulos || []).join(" · ")}</div>{m.negocio && <div style={{ color: "#ff9f1a" }}>Multa de tu negocio: {NEGOCIOS[m.negocio]?.nombre || m.negocio}</div>}{m.motivo && <div className="mut">{m.motivo}</div>}<div className="mut">Multó: {m.porName} · {new Date(m.at).toLocaleDateString("es")} · plazo hasta {new Date(m.vence).toLocaleDateString("es")}</div>
        {m.desacato && <div style={{ color: "var(--bad)", marginTop: 4 }}>Desacato: {m.desacato.tipo} ({m.desacato.detalle})</div>}{m.pagadaAt && <div className="mut">Pagada el {new Date(m.pagadaAt).toLocaleDateString("es")}</div>}
        {m.est !== "pagada" && <PagarMulta id={m.id} monto={m.monto} metodos={metodos} />}</div>); })}
      {!multas.length && <div className="card mut">No tienes multas. ¡Sigue así!</div>}</>)}
    {v === "comida" && <Comida comida={items.filter(esComida).map((i) => ({ fid: i.fid, name: i.name, img: i.img, sub: i.sub, consumo: i.consumo, calif: i.calif, enNevera: !!i.enNevera, vence: +new Date(i.vence) }))} nevera={(() => { const n = neveraDe(u); return n ? { name: n.name, img: n.img || fotos[n.name] || null, capacidad: n.capacidad || ({ "nevera-normal": 10, refrigerador: 15, "nevera-lujo": 20 })[n.sku] || 10 } : null; })()} />}
    {v === "negocios" || v === "multas" || v === "comida" ? null : v === "casa" ? (<>
      <p className="mut">Lo que guardas en casa no se puede robar en un asalto: solo te pueden robar lo que llevas encima. Para guardar otro objeto hay que esperar 10 minutos.</p>
      {!casas.length && <div className="card mut">Necesitas una casa para guardar cosas. Compra una en el Mercado → Propiedades.</div>}
      {casas.map((c) => { const ref = casaRef(c.name, c.at), its = enCasa.filter((i) => i.casa === ref), por = its.reduce((g, i) => ((g[i.lugar || "Sin especificar"] = g[i.lugar || "Sin especificar"] || []).push(i), g), {});
        return (<div key={ref} className="card" style={{ marginBottom: 12 }}>{c.img && <img src={c.img} alt={c.name} style={{ width: "100%", maxWidth: 420, aspectRatio: "16/10", objectFit: "cover", borderRadius: 12, marginBottom: 8 }} />}<b>{c.name}</b><div className="mut">{c.ubicacion}{c.color ? ` · Color ${c.color}` : ""} · {its.length} objeto(s) guardado(s)</div><div className="mut" style={{ fontSize: 12 }}>Casa {casas.findIndex((x) => casaRef(x.name, x.at) === ref) + 1} de {MAX_CASAS} permitidas</div>
          {Object.entries(por).map(([lugar, l]) => <div key={lugar} style={{ marginTop: 10 }}><b>{lugar}</b>{l.map((i, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--bd)" }}><span style={{ display: "flex", gap: 8, alignItems: "center" }}>{(i.img || fotos[i.name]) && <img src={i.img || fotos[i.name]} alt="" style={{ width: 56, height: 38, objectFit: "cover", borderRadius: 6 }} />}<span>{i.name} <span className="tag">{i.category}</span>{i.placa && <span className="mut"> · {i.placa}</span>}{i.color && !i.placa ? <span className="mut"> · {i.color}</span> : null}{i.robado && <span className="rob-t" style={{ fontSize: 11, marginLeft: 6 }}>ROBADO</span>}</span></span><Sacar name={i.name} at={new Date(i.at).toISOString()} /></div>)}</div>)}
          {!its.length && <p className="mut">Aún no has escondido nada aquí.</p>}</div>); })}
      {enCasa.filter((i) => !casas.some((c) => casaRef(c.name, c.at) === i.casa)).length > 0 && <div className="card" style={{ borderColor: "var(--bad)" }}><b>Objetos de una casa que ya no es tuya</b>{enCasa.filter((i) => !casas.some((c) => casaRef(c.name, c.at) === i.casa)).map((i, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>{i.name}</span><Sacar name={i.name} at={new Date(i.at).toISOString()} /></div>)}</div>}
    </>) : (<>
    {own.length > 0 && <><h3>Tarjetas bancarias</h3><div style={G}>{own.map((k) => <div key={k}>{(() => { const C = CARD[k]; return <C c={u.cedula} cuenta={cu[k]} />; })()}</div>)}</div></>}
    {u.chip && <div className="card" style={{ marginTop: 14 }}><span className="tag">Línea telefónica</span><div><b>{fmtTel(u.chip.num)}</b></div><div className="mut">Chip de VE WhatsApp{u.plan ? ` · Plan $${u.plan.monto}/semana` : ""}</div></div>}
    {lics.length > 0 && <><h3 style={{ marginTop: 18 }}>Licencias</h3><div style={G}>{lics.map((i, k) => <div key={k}><LicenciaCard tipo={licTipo(i)} c={u.cedula} num={i.licNum} emision={i.at} />{estaRetenido(i) && <div className="card" style={{ borderColor: "#ff9f1a", color: "#ff9f1a", fontWeight: 700, marginTop: 6 }}>RETENIDA por la policía hasta {new Date(i.retenido.hasta).toLocaleDateString("es")} · {i.retenido.porName}<div className="mut" style={{ fontWeight: 400 }}>{i.retenido.motivo}</div></div>}</div>)}</div></>}
    <h3 style={{ marginTop: 18 }}>Lo que llevas encima</h3>
    {otros.length ? <div className="grid">{otros.map((i, k) => { const img = i.img || fotos[i.name]; return (<div className={"card" + (i.robado ? " rob" : "")} key={k} style={estaRetenido(i) ? { borderColor: "#ff9f1a" } : undefined}><div className="mi">{img ? <img src={img} alt="" /> : <span className="mut">Sin foto</span>}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><span className="tag">{i.category}</span>{i.robado && <span className="rob-t">ROBADO</span>}</div><div><b>{i.name}</b></div>
      {i.placa && <div className="mut">Placa: <b>{i.placa}</b>{i.color ? ` · ${i.color}` : ""}</div>}{i.detalles?.length > 0 && <div className="mut">Detalles: {i.detalles.join(", ")}</div>}{i.ubicacion && <div className="mut">Ubicación: {i.ubicacion}</div>}{i.color && !i.placa && <div className="mut">Color: {i.color}</div>}{i.vence && <div className="mut">{new Date(i.vence) > new Date() ? "Vence" : "Expiró"}: {new Date(i.vence).toLocaleDateString("es")}</div>}
      <div className="mut">{i.robado ? "Robado" : "Pagado"}: ${Number(i.price).toLocaleString("es")} · {new Date(i.at).toLocaleDateString("es")}</div>
      {estaRetenido(i) && <div style={{ color: "#ff9f1a", fontWeight: 700 }}>RETENIDO por la policía hasta {new Date(i.retenido.hasta).toLocaleDateString("es")}<div className="mut" style={{ fontWeight: 400 }}>{i.retenido.porName} · {i.retenido.motivo}</div></div>}{i.usado && <span className="tag">Segunda mano</span>}
      {guardable(i) && casas.length > 0 && <Guardar name={i.name} at={new Date(i.at).toISOString()} casas={opcCasas} espera={espera} auto={esAuto(i)} />}{revendible(i) && <Revender name={i.name} at={new Date(i.at).toISOString()} pagado={i.price} metodos={metodos} />}</div>); })}</div> : <div className="card mut">No llevas nada encima. Visita el Mercado.</div>}
    </>)}</div></Shell>);
}
