import Comprar from "./PagoModal";
import { db } from "@/lib/db";
import { metodosDe } from "@/lib/pago";
import { NEGOCIOS, ensureNegocios, planesDe, MAX_NEGOCIOS } from "@/lib/negocios";
import { sembrar } from "@/lib/catalogo";
// Sección "Negocios" del Mercado. El Taller clandestino NO sale aquí: solo se compra dentro de la Dark Web.
export default async function Negocios({ u }) {
  const d = await db(); await ensureNegocios(d); await sembrar(d);
  const docs = Object.fromEntries((await d.collection("negocios").find().toArray()).map((n) => [n._id, n])), planes = await planesDe(d), metodos = metodosDe(u);
  const dueños = Object.fromEntries((await d.collection("users").find({ id: { $in: Object.values(docs).map((n) => n.owner).filter(Boolean) } }, { projection: { id: 1, name: 1, cedula: 1 } }).toArray()).map((x) => [x.id, x.cedula ? `${x.cedula.nombres.split(" ")[0]} ${x.cedula.apellidos.split(" ")[0]}` : x.name]));
  const lista = Object.entries(NEGOCIOS).filter(([, n]) => !n.oculto), mios = lista.map(([k]) => k).filter((k) => docs[k]?.owner === u.id), items = {};
  for (const k of mios) items[k] = (await d.collection("items").find({ negocio: k }).sort({ name: 1 }).limit(300).toArray()).map((i) => ({ id: String(i._id), name: i.name, price: i.price, impuesto: i.impuesto || 0 }));
  return (<><p className="mut">Para comprar un negocio necesitas la Tarjeta de Comerciante ($50 en la Tienda, membresía de $5 semanales). Lo que se venda en tu negocio llega a esa tarjeta. Máximo {MAX_NEGOCIOS} negocios por persona.</p>
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>{lista.map(([k, n]) => { const o = docs[k]?.owner; return (<div key={k}><div className="card"><img src={n.img} alt={n.nombre} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: 12 }} />
      <div style={{ marginTop: 8 }}><b>{n.nombre}</b></div><div className="mut">{n.edita}</div><div className="big" style={{ fontSize: 22 }}>${n.precio.toLocaleString("es")}</div>
      {o ? <><span className="tag">{o === u.id ? "Eres el dueño" : `Dueño: ${dueños[o] || "—"}`}</span>{docs[k]?.estado === "clausurado" && <span className="tag" style={{ color: "var(--bad)", marginLeft: 6 }}>CLAUSURADO</span>}{docs[k]?.estado === "moroso" && <span className="tag" style={{ color: "#ff9f1a", marginLeft: 6 }}>MOROSO</span>}</> : docs[k]?.vetado?.uid === u.id && +new Date(docs[k].vetado.hasta) > Date.now() ? <span className="tag" style={{ color: "#ff9f1a" }}>Podrás comprarlo de nuevo el {new Date(docs[k].vetado.hasta).toLocaleDateString("es")}</span> : <Comprar url="/api/negocios" body={{ accion: "comprar", key: k }} metodos={metodos} msg="¡Negocio comprado! Ya puedes administrarlo." label="Comprar negocio" />}</div>
      </div>); })}</div></>);
}
