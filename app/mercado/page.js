import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Buy from "./Buy";
import BuyCard from "./BuyCard";
import { metodosDe } from "@/lib/pago";
import { BvcCard, MerCard } from "../banco/Cards";
import { BANCOS } from "@/lib/bancos";
import { CHIP_PRECIO } from "@/lib/redes";
import { MessageCircle } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser(), metodos = metodosDe(u);
  const items = await (await db()).collection("items").find({ stock: { $ne: 0 } }).sort({ _id: -1 }).toArray();
  return (<Shell user={u}><h2>Mercado</h2><p className="mut">{items.length} artículos disponibles</p>
    <h3 style={{ marginTop: 16 }}>Tarjetas bancarias</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>{Object.entries(BANCOS).map(([k, b]) => <div className="card" key={k}>
      {k === "bvc" ? <BvcCard promo /> : <MerCard promo />}
      <span className="tag" style={{ marginTop: 10, display: "inline-block" }}>Banco</span><div><b>Tarjeta {b.nombre}</b></div><div className="mut">{k === "bvc" ? "Tu banca en línea de Venezuela Community." : "Transfiere a cualquier banco del servidor."}</div><div className="big" style={{ fontSize: 22 }}>${b.precio}</div><BuyCard metodos={metodos} k={k} owned={!!u.cuentas?.[k]} /></div>)}
      <div className="card"><div className="bk" style={{ background: "linear-gradient(135deg,#0f8f6a,#0a5f4a)", display: "grid", placeItems: "center", color: "#fff", textAlign: "center" }}><div><MessageCircle size={44} /><div style={{ fontWeight: 800, fontSize: 24 }}>VE WhatsApp</div><div style={{ opacity: 0.85 }}>+58 4XX ••• ••••</div></div></div>
        <span className="tag" style={{ marginTop: 10, display: "inline-block" }}>Telefonía</span><div><b>Chip VE WhatsApp</b></div><div className="mut">Te asignan un número +58 aleatorio para chatear.</div><div className="big" style={{ fontSize: 22 }}>${CHIP_PRECIO}</div><BuyCard metodos={metodos} k="chip" url="/api/chip" msg="¡Listo! Tu chip ha sido entregado. Ya puedes usar VE WhatsApp." owned={!!u.chip} /></div></div>
    <h3 style={{ marginTop: 16 }}>Artículos</h3>
    <div className="grid">{items.map((i) => <div className="card" key={String(i._id)}><div className="mi">{i.img ? <img src={i.img} alt="" /> : <span className="mut">Sin foto</span>}</div>
      <span className="tag">{i.category}</span><div><b>{i.name}</b></div><div className="mut">{i.brand} {i.year}</div><div className="big" style={{ fontSize: 22 }}>${i.price.toLocaleString("es")}</div><Buy metodos={metodos} id={String(i._id)} /></div>)}</div></Shell>);
}
