import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Buy from "./Buy";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser();
  const items = await (await db()).collection("items").find({ stock: { $ne: 0 } }).sort({ _id: -1 }).toArray();
  return (<Shell user={u}><h2>Mercado</h2><p className="mut">{items.length} artículos disponibles</p>
    <div className="grid">{items.map((i) => <div className="card" key={String(i._id)}><div className="mi">{i.img ? <img src={i.img} alt="" /> : <span className="mut">Sin foto</span>}</div>
      <span className="tag">{i.category}</span><div><b>{i.name}</b></div><div className="mut">{i.brand} {i.year}</div><div className="big" style={{ fontSize: 22 }}>${i.price.toLocaleString("es")}</div><Buy id={String(i._id)} /></div>)}</div></Shell>);
}
