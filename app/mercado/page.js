import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Buy from "./Buy";
import BuyCard from "./BuyCard";
import { BvcCard, MerCard } from "../banco/Cards";
import { BANCOS } from "@/lib/bancos";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser();
  const items = await (await db()).collection("items").find({ stock: { $ne: 0 } }).sort({ _id: -1 }).toArray();
  return (<Shell user={u}><h2>Mercado</h2><p className="mut">{items.length} artículos disponibles</p>
    <h3 style={{ marginTop: 16 }}>Tarjetas bancarias</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>{Object.entries(BANCOS).map(([k, b]) => <div className="card" key={k}>
      {k === "bvc" ? <BvcCard promo /> : <MerCard promo />}
      <span className="tag" style={{ marginTop: 10, display: "inline-block" }}>Banco</span><div><b>Tarjeta {b.nombre}</b></div><div className="mut">{k === "bvc" ? "Tu banca en línea de Venezuela Community." : "Transfiere a cualquier banco del servidor."}</div><div className="big" style={{ fontSize: 22 }}>${b.precio}</div><BuyCard k={k} owned={!!u.cuentas?.[k]} /></div>)}</div>
    <h3 style={{ marginTop: 16 }}>Artículos</h3>
    <div className="grid">{items.map((i) => <div className="card" key={String(i._id)}><div className="mi">{i.img ? <img src={i.img} alt="" /> : <span className="mut">Sin foto</span>}</div>
      <span className="tag">{i.category}</span><div><b>{i.name}</b></div><div className="mut">{i.brand} {i.year}</div><div className="big" style={{ fontSize: 22 }}>${i.price.toLocaleString("es")}</div><Buy id={String(i._id)} /></div>)}</div></Shell>);
}
