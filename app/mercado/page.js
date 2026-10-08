import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Buy from "./Buy";
import BuyCard from "./BuyCard";
import { metodosDe } from "@/lib/pago";
import { CARD } from "../banco/Cards";
import { sembrar, COLORES_CASA, esUnico, yaTiene } from "@/lib/catalogo";
import { coloresDisponibles, proximoCambio, DETALLES } from "@/lib/colores";
import { BANCOS } from "@/lib/bancos";
import { CHIP_PRECIO } from "@/lib/redes";
import { licTipo, tieneLic, tieneLicEntrada } from "@/lib/licencia";
import { estaRetenido } from "@/lib/decomiso";
import { MAX_CASAS } from "@/lib/casa";
import { MessageCircle, Lock } from "lucide-react";
import Link from "next/link";
import Negocios from "./Negocios";
import Usados from "./Usados";
import { iva, tasaITBMS } from "@/lib/tesoreria";
export const dynamic = "force-dynamic";
// Botones de arriba: cada categoría tiene su propio lugar. "Todo" muestra todo junto.
const CHIPS = ["Todo", "Tarjetas", "Licencias", "Concesionario", "Propiedades", "Armas", "Herramientas", "Telefonía", "Tecnología", "Segunda mano", "Negocios"];
const G = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 };
export default async function P({ searchParams }) {
  const u = await needUser(), metodos = metodosDe(u), q = searchParams?.c || (searchParams?.s === "negocios" ? "Negocios" : "Todo"), cat = CHIPS.includes(q) ? q : "Todo";
  const tasa = await tasaITBMS(await db()), pct = Math.round(tasa * 1000) / 10;
  const chips = <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "4px 0 10px", scrollbarWidth: "none" }}>{CHIPS.map((x) => <Link key={x} href={x === "Todo" ? "/mercado" : `/mercado?c=${encodeURIComponent(x)}`} className={"btn " + (cat === x ? "" : "g")} style={{ whiteSpace: "nowrap", padding: "8px 14px" }}>{x}</Link>)}</div>;
  if (cat === "Segunda mano") return <Shell user={u}><h2>Mercado</h2>{chips}<Usados u={u} /></Shell>;
  if (cat === "Negocios") return <Shell user={u}><h2>Mercado</h2>{chips}<Negocios u={u} /></Shell>;
  const d = await db(); await sembrar(d);
  const items = cat === "Tarjetas" ? [] : await d.collection("items").find({ stock: { $ne: 0 }, ...(cat === "Todo" ? {} : { category: cat }) }).sort({ category: 1, _id: -1 }).toArray();
  // Candados: sin licencia de conducir no se compran autos; sin licencia de armas no se compran armas; las licencias ya compradas salen bloqueadas.
  const bloqueo = (i) => { const t = licTipo(i); return i.category === "Concesionario" && !tieneLic(u, "conducir") ? "Requiere licencia de conducir" : i.category === "Armas" && !tieneLic(u, "armas") ? "Requiere licencia de armas" : t && tieneLicEntrada(u, t) ? ((u.inventory || []).some((x) => licTipo(x) === t && estaRetenido(x)) ? "Retenida por la policía" : "Ya la tienes") : i.category === "Propiedades" && (u.inventory || []).filter((x) => x.category === "Propiedades").length >= MAX_CASAS ? `Límite: ${MAX_CASAS} casas` : esUnico(i) && yaTiene(u, i) ? "Ya lo tienes" : null; };
  const verTarjetas = cat === "Todo" || cat === "Tarjetas", verChip = cat === "Todo" || cat === "Telefonía";
  return (<Shell user={u}><h2>Mercado</h2><p className="mut">{items.length} artículos{cat === "Todo" ? " disponibles" : ` en ${cat}`}</p>{chips}
    {verTarjetas && <><h3 style={{ marginTop: 6 }}>Tarjetas bancarias</h3><div style={G}>{Object.entries(BANCOS).map(([k, b]) => <div className="card" key={k}>
      {(() => { const C = CARD[k]; return <C promo />; })()}
      <span className="tag" style={{ marginTop: 10, display: "inline-block" }}>Banco</span><div><b>Tarjeta {b.nombre}</b></div><div className="mut">{k === "bvc" ? "Tu banca en línea de Venezuela Community." : k === "mer" ? "Transfiere a cualquier banco del servidor." : k === "pro" ? "Tarjeta internacional prepagada. Membresía de $2 semanales." : k === "ven" ? "Tarjeta de débito VERNESCO con el logo VE y VERP." : k === "vca" ? "Tarjeta VERCARIBE Platinum, acabado plata." : "Necesaria para comprar negocios. Membresía de $5 semanales."}</div><div className="big" style={{ fontSize: 22 }}>${b.precio}</div><BuyCard metodos={metodos} k={k} owned={!!u.cuentas?.[k]} /></div>)}</div></>}
    {verChip && <div style={{ ...G, marginTop: 14 }}><div className="card"><div className="bk" style={{ background: "linear-gradient(135deg,#0f8f6a,#0a5f4a)", display: "grid", placeItems: "center", color: "#fff", textAlign: "center" }}><div><MessageCircle size={44} /><div style={{ fontWeight: 800, fontSize: 24 }}>VE WhatsApp</div><div style={{ opacity: 0.85 }}>+58 4XX ••• ••••</div></div></div>
      <span className="tag" style={{ marginTop: 10, display: "inline-block" }}>Telefonía</span><div><b>Chip VE WhatsApp</b></div><div className="mut">Te asignan un número +58 aleatorio para chatear.</div><div className="big" style={{ fontSize: 22 }}>${CHIP_PRECIO}</div><BuyCard metodos={metodos} k="chip" url="/api/chip" msg="¡Listo! Tu chip ha sido entregado. Ya puedes usar VE WhatsApp." owned={!!u.chip} /></div></div>}
    {items.length > 0 && <>{cat === "Todo" && <h3 style={{ marginTop: 16 }}>Artículos</h3>}
      <div className="grid" style={{ marginTop: cat === "Todo" ? 0 : 6 }}>{items.map((i) => { const b = bloqueo(i); return (<div className="card" key={String(i._id)} style={b ? { opacity: 0.6 } : undefined}><div className="mi">{i.img ? <img src={i.img} alt="" /> : <span className="mut">Sin foto</span>}</div>
        <span className="tag">{i.category}</span><div><b>{i.name}</b></div><div className="mut">{i.brand} {i.year}{i.clase ? ` · Clase ${i.clase}` : ""}</div>{i.ubicacion && <div className="mut">Ubicación: {i.ubicacion}</div>}{i.impuesto ? <div className="mut">Impuesto mensual: ${Number(i.impuesto).toLocaleString("es")}</div> : null}{i.desc && <div className="mut">{i.desc}</div>}
        <div className="big" style={{ fontSize: 22 }}>${i.price.toLocaleString("es")}</div><div className="mut" style={{ fontSize: 12 }}>+ ITBMS {pct}%: ${iva(i.price, tasa).toLocaleString("es")} · Total ${(i.price + iva(i.price, tasa)).toLocaleString("es")}</div>{b && b !== "Ya la tienes" && b !== "Ya lo tienes" && b !== "Retenida por la policía" && <div style={{ color: "var(--bad)", fontSize: 13, display: "flex", gap: 4, alignItems: "center" }}><Lock size={14} />{b}</div>}
        <Buy total={i.price + iva(i.price, tasa)} metodos={metodos} id={String(i._id)} colores={i.category === "Propiedades" ? COLORES_CASA : null} auto={i.category === "Concesionario" ? { colores: coloresDisponibles(String(i._id)), detalles: DETALLES, hasta: proximoCambio() } : null} bloqueo={b} label={i.dias && yaTiene(u, i) ? `Renovar (+${i.dias} días)` : undefined} /></div>); })}</div></>}
    {!items.length && cat !== "Tarjetas" && <div className="card mut">No hay artículos en esta categoría todavía.</div>}</Shell>);
}
