import Shell from "@/components/Shell";
import Transfer from "./Transfer";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
const vnum = (n) => "V-" + String(n).padStart(8, "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export default async function P() {
  const u = await needUser(), mov = await (await db()).collection("tx").find({ user: u.id }).sort({ at: -1 }).limit(15).toArray();
  return (<Shell user={u}><div style={{ maxWidth: 560, margin: "0 auto" }}><h2>Banco Venezuela</h2>
    <div className="card"><p className="mut">Saldo disponible · Cuenta {vnum(u.cedula.num)}</p><div className="big">${u.balance.toLocaleString("es")}</div></div>
    <Transfer />
    <div className="card"><b>Movimientos</b>{mov.length ? mov.map((m) => (<div key={String(m._id)} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid var(--bd)" }}>
      <div><div>{m.item}</div><div className="mut">{new Date(m.at).toLocaleDateString("es")}</div></div>
      <b style={{ color: m.amount < 0 ? "var(--bad)" : "var(--ok)", whiteSpace: "nowrap" }}>{m.amount < 0 ? "-" : "+"}${Math.abs(m.amount).toLocaleString("es")}</b></div>)) : <p className="mut">Sin movimientos aún.</p>}</div></div></Shell>);
}
