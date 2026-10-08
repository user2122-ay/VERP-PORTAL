"use client";
import { useState } from "react";
const $ = (n) => `$${Number(n).toLocaleString("es")}`;
// La víctima ve exactamente qué le piden. Si acepta, puede desmarcar los objetos que NO quiere entregar.
export default function Asaltos({ lista, bancos }) {
  const [ab, setAb] = useState(null), [no, setNo] = useState({}), [pago, setPago] = useState(bancos[0]?.k || "");
  const resp = async (a, ok) => { const items = ok ? a.items.filter((x) => !no[x.name + x.at]).map((x) => ({ name: x.name, at: x.at })) : []; const r = await fetch("/api/delictivo", { method: "POST", body: JSON.stringify({ accion: "responder", id: a.id, ok, items, pago }) }), j = await r.json().catch(() => ({})); if (!r.ok) return alert(j.error || "Error"); location.reload(); };
  if (!lista.length) return null;
  return (<>{lista.map((a) => (<div key={a.id} className="card" style={{ borderColor: "#ff1f1f", boxShadow: "0 0 18px #ff1f1f44" }}><b style={{ color: "#ff1f1f" }}>Asalto en curso</b>
    <div>{a.de} te quiere robar:</div><ul style={{ margin: "6px 0", paddingLeft: 18 }}>{a.efectivo > 0 && <li>{$(a.efectivo)} en efectivo</li>}{a.tarjeta > 0 && <li>{$(a.tarjeta)} de tu tarjeta</li>}{a.items.map((x) => <li key={x.name + x.at}>{x.name}{x.placa ? ` · ${x.placa}` : ""}</li>)}</ul>
    {a.msg && <div className="mut">“{a.msg}”</div>}{a.evidencia && <a href={a.evidencia} target="_blank" rel="noreferrer" className="mut" style={{ textDecoration: "underline" }}>Ver evidencia</a>}
    {ab === a.id ? <div style={{ marginTop: 10 }}>{a.tarjeta > 0 && <select value={pago} onChange={(e) => setPago(e.target.value)}>{bancos.map((b) => <option key={b.k} value={b.k}>Pagar con {b.label} ({$(b.saldo)})</option>)}</select>}
      {a.items.length > 0 && <><div className="mut">Desmarca lo que NO quieres entregar:</div>{a.items.map((x) => <label key={x.name + x.at} style={{ display: "block", margin: "4px 0" }}><input type="checkbox" style={{ width: "auto", margin: "0 8px 0 0" }} checked={!no[x.name + x.at]} onChange={() => setNo({ ...no, [x.name + x.at]: !no[x.name + x.at] })} />{x.name}</label>)}</>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}><button className="btn" onClick={() => resp(a, true)}>Confirmar entrega</button><button className="btn g" onClick={() => setAb(null)}>Volver</button></div></div>
      : <div style={{ display: "flex", gap: 8, marginTop: 10 }}><button className="btn" onClick={() => setAb(a.id)}>Aceptar</button><button className="btn r" onClick={() => resp(a, false)}>Rechazar</button></div>}</div>))}</>);
}
