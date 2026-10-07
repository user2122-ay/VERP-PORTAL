import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Buy from "./Buy";
import BuyCard from "./BuyCard";
import { metodosDe } from "@/lib/pago";
import { BvcCard, MerCard, ComCard } from "../banco/Cards";
import { sembrar, COLORES_CASA } from "@/lib/catalogo";
import { BANCOS } from "@/lib/bancos";
import { CHIP_PRECIO } from "@/lib/redes";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import Negocios from "./Negocios";
export const dynamic = "force-dynamic";
export default async function P({ searchParams }) {
  const u = await needUser(), metodos = metodosDe(u), neg = searchParams?.s === "negocios";
  const tabs = <div style={{ display: "flex", gap: 8, margin: "10px 0" }}><Link className={"btn " + (neg ? "g" : "")} href="/mercado">Tienda</Link><Link className={"btn " + (neg ? "" : "g")} href="/mercado?s=negocios">Negocios</Link></div>;
  if (neg) return <Shell user={u}><h2>Mercado</h2>{tabs}<Negocios u={u} /></Shell>;
  await sembrar(await db());
  const items = await (await db()).collection("items").find({ stock: { $ne: 0 } }).sort({ _id: -1 }).toArray();
  return (<Shell user={u}><h2>Mercado</h2><p className="mut">{items.length} artículos disponibles</p>{tabs}
    <h3 style={{ marginTop: 16 }}>Tarjetas bancarias</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>{Object.entries(BANCOS).map(([k, b]) => <div className="card" key={k}>
      {k === "bvc" ? <BvcCard promo /> : k === "mer" ? <MerCard promo /> : <ComCard promo />}
      <span className="tag" style={{ marginTop: 10, display: "inline-block" }}>Banco</span><div><b>Tarjeta {b.nombre}</b></div><div className="mut">{k === "bvc" ? "Tu banca en línea de Venezuela Community." : k === "mer" ? "Transfiere a cualquier banco del servidor." : "Necesaria para comprar negocios. Membresía de $5 semanales."}</div><div className="big" style={{ fontSize: 22 }}>${b.precio}</div><BuyCard metodos={metodos} k={k} owned={!!u.cuentas?.[k]} /></div>)}
      <div className="card"><div className="bk" style={{ background: "linear-gradient(135deg,#0f8f6a,#0a5f4a)", display: "grid", placeItems: "center", color: "#fff", textAlign: "center" }}><div><MessageCircle size={44} /><div style={{ fontWeight: 800, fontSize: 24 }}>VE WhatsApp</div><div style={{ opacity: 0.85 }}>+58 4XX ••• ••••</div></div></div>
        <span className="tag" style={{ marginTop: 10, display: "inline-block" }}>Telefonía</span><div><b>Chip VE WhatsApp</b></div><div className="mut">Te asignan un número +58 aleatorio para chatear.</div><div className="big" style={{ fontSize: 22 }}>${CHIP_PRECIO}</div><BuyCard metodos={metodos} k="chip" url="/api/chip" msg="¡Listo! Tu chip ha sido entregado. Ya puedes usar VE WhatsApp." owned={!!u.chip} /></div></div>
    <h3 style={{ marginTop: 16 }}>Artículos</h3>
    <div className="grid">{items.map((i) => <div className="card" key={String(i._id)}><div className="mi">{i.img ? <img src={i.img} alt="" /> : <span className="mut">Sin foto</span>}</div>
      <span className="tag">{i.category}</span><div><b>{i.name}</b></div><div className="mut">{i.brand} {i.year}{i.clase ? ` · Clase ${i.clase}` : ""}</div>{i.ubicacion && <div className="mut">Ubicación: {i.ubicacion}</div>}{i.impuesto ? <div className="mut">Impuesto mensual: ${Number(i.impuesto).toLocaleString("es")}</div> : null}{i.desc && <div className="mut">{i.desc}</div>}<div className="big" style={{ fontSize: 22 }}>${i.price.toLocaleString("es")}</div><Buy metodos={metodos} id={String(i._id)} colores={i.category === "Propiedades" ? COLORES_CASA : null} /></div>)}</div></Shell>);
}
