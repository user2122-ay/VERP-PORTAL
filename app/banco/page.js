import Shell from "@/components/Shell";
import Transfer, { Deposito } from "./Transfer";
import { BvcCard, MerCard } from "./Cards";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { impuesto } from "@/lib/economia";
import { BANCOS } from "@/lib/bancos";
export const dynamic = "force-dynamic";
const G = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14, marginTop: 14, alignItems: "start" };
export default async function P() {
  const u = await needUser(), d = await db(), { fee, inflacion } = await impuesto(d), c = u.cedula, cu = u.cuentas || {}, owned = Object.keys(BANCOS).filter((k) => cu[k]);
  const mov = await d.collection("tx").find({ user: u.id }).sort({ at: -1 }).limit(15).toArray();
  return (<Shell user={u}><div style={{ maxWidth: 1100, margin: "0 auto" }}>
    <p className="mut" style={{ margin: "0 0 10px" }}>Banca en línea · Hola, {c.nombres.split(" ")[0]}</p>
    <div className="card"><span className="mut">Efectivo</span><div className="big">${u.balance.toLocaleString("es")}</div></div>
    {!owned.length ? <div className="card" style={{ marginTop: 14 }}><b>Aún no tienes tarjeta bancaria</b><p className="mut">Cómprala en el Mercado: BVC ${BANCOS.bvc.precio} · Mercantil VERP ${BANCOS.mer.precio}. Cuando te la entreguen aparecerá aquí.</p><a className="btn" href="/mercado">Ir al Mercado</a></div>
      : <><div style={G}>{owned.map((k) => (<div key={k}>{k === "bvc" ? <BvcCard c={c} cuenta={cu[k]} /> : <MerCard c={c} cuenta={cu[k]} />}
        <div className="card"><span className="mut">Saldo en {BANCOS[k].corto}</span><div className="big">${cu[k].saldo.toLocaleString("es")}</div></div></div>))}</div>
      <div style={G}><Deposito owned={owned} /><Transfer owned={owned} fee={fee} inflacion={inflacion} /></div></>}
    <div className="card" style={{ marginTop: 14 }}><b>Movimientos</b>{mov.length ? mov.map((m) => (<div key={String(m._id)} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid var(--bd)" }}>
      <div><div>{m.item}</div><div className="mut">{new Date(m.at).toLocaleString("es")}</div></div>
      <b style={{ color: m.amount < 0 ? "var(--bad)" : "var(--ok)", whiteSpace: "nowrap" }}>{m.amount < 0 ? "-" : "+"}${Math.abs(m.amount).toLocaleString("es")}</b></div>)) : <p className="mut">Sin movimientos aún.</p>}</div></div></Shell>);
}
