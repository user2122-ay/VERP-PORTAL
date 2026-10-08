import Comprar from "./PagoModal";
import Cancelar from "./Cancelar";
import { db } from "@/lib/db";
import { metodosDe } from "@/lib/pago";
import { tieneLic } from "@/lib/licencia";
import { esUnico, yaTiene } from "@/lib/catalogo";
// Mercado → Segunda mano: artículos que otros ciudadanos revenden por menos de lo que pagaron.
export default async function Usados({ u }) {
  const d = await db(), l = await d.collection("usados").find({ estado: "abierta" }).sort({ at: -1 }).limit(100).toArray(), metodos = metodosDe(u);
  const foto = Object.fromEntries((await d.collection("items").find({ name: { $in: [...new Set(l.filter((x) => !x.item.img).map((x) => x.item.name))] } }, { projection: { name: 1, img: 1 } }).toArray()).map((x) => [x.name, x.img]));
  return (<><p className="mut">Artículos de segunda mano: otros ciudadanos los revenden por menos de lo que pagaron. Para vender uno tuyo, ve a Inventario y pulsa “Revender”. No llevan ITBMS.</p>
    <div className="grid">{l.map((x) => { const i = x.item, mio = x.seller === u.id, off = mio ? null : i.category === "Armas" && !tieneLic(u, "armas") ? "Requiere licencia de armas" : esUnico(i) && yaTiene(u, i) ? "Ya lo tienes" : null, img = i.img || foto[i.name];
      return (<div className="card" key={String(x._id)}><div className="mi">{img ? <img src={img} alt="" /> : <span className="mut">Sin foto</span>}</div><span className="tag">Segunda mano</span> <span className="tag">{i.category}</span><div><b>{i.name}</b></div><div className="mut">Vende: {x.sellerName}</div>
        <div className="big" style={{ fontSize: 22 }}>${x.precio.toLocaleString("es")}</div><div className="mut" style={{ fontSize: 12 }}>Nuevo costaba ${Number(x.pagado).toLocaleString("es")} · ahorras ${(x.pagado - x.precio).toLocaleString("es")}</div>
        {mio ? <Cancelar id={String(x._id)} /> : <Comprar url="/api/usados" body={{ accion: "comprar", id: String(x._id) }} metodos={metodos} total={x.precio} totalLabel="Total" disabled={!!off} off={off} msg="¡Compra realizada! Ya está en tu inventario." />}</div>); })}
      {!l.length && <div className="card mut">Todavía no hay artículos de segunda mano.</div>}</div></>);
}
