import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import Link from "next/link";
export default async function P() {
  const u = await needUser();
  return (<Shell user={u}><div className="card"><p className="mut">Bienvenido, {u.cedula.nombres}</p><div className="big">${u.balance.toLocaleString("es")}</div><span className="tag">{u.rank ? u.rank.replace("_", " ") : "Ciudadano"}</span></div>
    <Link href="/emergencias" className="card" style={{ display: "block", borderColor: "var(--bad)" }}><b style={{ color: "var(--bad)" }}>Reportar emergencia</b><div className="mut">Llega al MDT en tiempo real</div></Link>
    <div className="card"><b>Inventario</b>{u.inventory.length ? u.inventory.map((i, k) => <div key={k} className="mut">{i.name}</div>) : <div className="mut">Aún no tienes artículos. Visita el mercado.</div>}</div></Shell>);
}
