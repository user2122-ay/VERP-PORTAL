"use client";
import { useState } from "react";
const $ = (n) => `$${Number(n).toLocaleString("es")}`;
// La víctima decide: rechazar, o aceptar quitando de la lista lo que NO quiere entregar.
export default function Asaltos({ lista, inv, bancos }) {
  const [ab, setAb] = useState(null), [no, setNo] = useState({}), [pago, setPago] = useState(bancos[0]?.k || "");
  const resp = async (a, ok) => { const items = ok ? inv.filter((x) => (x.veh ? a.vehiculos : a.objetos) && !no[x.i]).map((x) => ({ i: x.i, name: x.name })) : []; const r = await fetch("/api/delictivo", { method: "POST", body: JSON.stringify({ accion: "responder", id: a.id, ok, items, pago }) }), j = await r.json().catch(() => ({})); if (!r.ok) return alert(j.error || "Error"); location.reload(); };
  if (!lista.length) return null;
  return (<>{lista.map((a) => { const ver = a.objetos || a.vehiculos, mias = inv.filter((x) => (x.veh ? a.vehiculos : a.objetos)); return (<div key={a.id} className="card" style={{ borderColor: "#ff1f1f", boxShadow: "0 0 18px #ff1f1f44" }}><b style={{ color: "#ff1f1f" }}>Asalto en curso</b>
    <div>{a.de} quiere: {a.efectivo ? `${$(a.efectivo)} en efectivo · ` : ""}{a.tarjeta ? `${$(a.tarjeta)} de tu tarjeta · ` : ""}{a.objetos ? "objetos · " : ""}{a.vehiculos ? "vehículo" : ""}</div>{a.msg && <div className="mut">“{a.msg}”</div>}{a.evidencia && <a href={a.evidencia} target="_blank" rel="noreferrer" className="mut" style={{ textDecoration: "underline" }}>Ver evidencia</a>}
    {ab === a.id ? <div style={{ marginTop: 10 }}>{a.tarjeta > 0 && <select value={pago} onChange={(e) => setPago(e.target.value)}>{bancos.map((b) => <option key={b.k} value={b.k}>Pagar con {b.label} ({$(b.saldo)})</option>)}</select>}
      {ver && <><div className="mut">Desmarca lo que NO quieres entregar:</div>{mias.map((x) => <label key={x.i} style={{ display: "block", margin: "4px 0" }}><input type="checkbox" style={{ width: "auto", margin: "0 8px 0 0" }} checked={!no[x.i]} onChange={() => setNo({ ...no, [x.i]: !no[x.i] })} />{x.name}{x.placa ? ` · ${x.placa}` : ""}</label>)}{!mias.length && <div className="mut">No tienes nada que entregar.</div>}</>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}><button className="btn" onClick={() => resp(a, true)}>Confirmar entrega</button><button className="btn g" onClick={() => setAb(null)}>Volver</button></div></div>
      : <div style={{ display: "flex", gap: 8, marginTop: 10 }}><button className="btn" onClick={() => setAb(a.id)}>Aceptar</button><button className="btn r" onClick={() => resp(a, false)}>Rechazar</button></div>}</div>); })}</>);
}
