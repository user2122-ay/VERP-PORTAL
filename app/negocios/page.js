import Shell from "@/components/Shell";
import Comprar from "../mercado/PagoModal";
import Gestion from "./Gestion";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { metodosDe } from "@/lib/pago";
import { NEGOCIOS, ensureNegocios, planesDe } from "@/lib/negocios";
import { sembrar } from "@/lib/catalogo";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser(), d = await db(); await ensureNegocios(d); await sembrar(d);
  const docs = Object.fromEntries((await d.collection("negocios").find().toArray()).map((n) => [n._id, n])), planes = await planesDe(d), metodos = metodosDe(u);
  const dueños = Object.fromEntries((await d.collection("users").find({ id: { $in: Object.values(docs).map((n) => n.owner).filter(Boolean) } }, { projection: { id: 1, name: 1, cedula: 1 } }).toArray()).map((x) => [x.id, x.cedula ? `${x.cedula.nombres.split(" ")[0]} ${x.cedula.apellidos.split(" ")[0]}` : x.name]));
  const mios = Object.keys(NEGOCIOS).filter((k) => docs[k]?.owner === u.id), items = {};
  for (const k of mios) if (k !== "taller") items[k] = (await d.collection("items").find({ negocio: k }).sort({ name: 1 }).limit(300).toArray()).map((i) => ({ id: String(i._id), name: i.name, price: i.price, impuesto: i.impuesto || 0 }));
  return (<Shell user={u}><div style={{ maxWidth: 1100, margin: "0 auto" }}><h2>Negocios</h2><p className="mut">Para comprar un negocio necesitas la Tarjeta de Comerciante ($50 en el Mercado, membresía de $5 semanales). Lo que se venda en tu negocio llega a esa tarjeta.</p>
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>{Object.entries(NEGOCIOS).map(([k, n]) => { const o = docs[k]?.owner; return (<div key={k}><div className="card"><img src={n.img} alt={n.nombre} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: 12 }} />
      <div style={{ marginTop: 8 }}><b>{n.nombre}</b></div><div className="mut">{n.edita}</div><div className="big" style={{ fontSize: 22 }}>${n.precio.toLocaleString("es")}</div>
      {o ? <span className="tag">{o === u.id ? "Eres el dueño" : `Dueño: ${dueños[o] || "—"}`}</span> : <Comprar url="/api/negocios" body={{ accion: "comprar", key: k }} metodos={metodos} msg="¡Negocio comprado! Ya puedes administrarlo." label="Comprar negocio" />}</div>
      {o === u.id && <Gestion k={k} items={items[k] || []} planes={planes} />}</div>); })}</div></div></Shell>);
}
