import Shell from "@/components/Shell";
import { CARD } from "../banco/Cards";
import { needUser } from "@/lib/auth";
import { BANCOS } from "@/lib/bancos";
import { fmtTel } from "@/lib/redes";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
const G = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 };
export default async function P() {
  const u = await needUser(), cu = u.cuentas || {}, own = Object.keys(BANCOS).filter((k) => cu[k]), items = u.inventory || [], nombres = [...new Set(items.filter((i) => !i.img).map((i) => i.name))];
  const fotos = nombres.length ? Object.fromEntries((await (await db()).collection("items").find({ name: { $in: nombres } }, { projection: { name: 1, img: 1 } }).toArray()).map((x) => [x.name, x.img])) : {};
  return (<Shell user={u}><div style={{ maxWidth: 1100, margin: "0 auto" }}><h2>Inventario</h2>
    {own.length > 0 && <><h3>Tarjetas bancarias</h3><div style={G}>{own.map((k) => <div key={k}>{(() => { const C = CARD[k]; return <C c={u.cedula} cuenta={cu[k]} />; })()}</div>)}</div></>}
    {u.chip && <div className="card" style={{ marginTop: 14 }}><span className="tag">Línea telefónica</span><div><b>{fmtTel(u.chip.num)}</b></div><div className="mut">Chip de VE WhatsApp{u.plan ? ` · Plan $${u.plan.monto}/semana` : ""}</div></div>}
    <h3 style={{ marginTop: 18 }}>Artículos</h3>
    {items.length ? <div className="grid">{items.map((i, k) => { const img = i.img || fotos[i.name]; return (<div className={"card" + (i.robado ? " rob" : "")} key={k}><div className="mi">{img ? <img src={img} alt="" /> : <span className="mut">Sin foto</span>}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><span className="tag">{i.category}</span>{i.robado && <span className="rob-t">ROBADO</span>}</div><div><b>{i.name}</b></div>
      {i.placa && <div className="mut">Placa: <b>{i.placa}</b>{i.color ? ` · ${i.color}` : ""}</div>}{i.ubicacion && <div className="mut">Ubicación: {i.ubicacion}</div>}{i.color && !i.placa && <div className="mut">Color: {i.color}</div>}{i.vence && <div className="mut">{new Date(i.vence) > new Date() ? "Vence" : "Expiró"}: {new Date(i.vence).toLocaleDateString("es")}</div>}
      <div className="mut">{i.robado ? "Robado" : "Pagado"}: ${Number(i.price).toLocaleString("es")} · {new Date(i.at).toLocaleDateString("es")}</div></div>); })}</div> : <div className="card mut">Aún no tienes artículos. Visita el Mercado.</div>}</div></Shell>);
}
