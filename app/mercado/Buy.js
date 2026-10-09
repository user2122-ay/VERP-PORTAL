"use client";
import { useState } from "react";
import Comprar from "./PagoModal";
// Casas: pregunta el color antes de pagar. Autos: color (cambia cada cierto tiempo) y detalles opcionales.
export default function Buy({ id, metodos, colores, bloqueo, total, auto, label, totalLabel }) {
  const [color, setColor] = useState(auto?.colores?.[0]?.n || colores?.[0] || ""), [det, setDet] = useState([]);
  const alt = (d) => setDet((l) => (l.includes(d) ? l.filter((x) => x !== d) : [...l, d]));
  return (<>{colores && <label className="mut" style={{ display: "block", marginTop: 8 }}>Color de la casa<select value={color} onChange={(e) => setColor(e.target.value)}>{colores.map((c) => <option key={c}>{c}</option>)}</select></label>}
    {auto && <div style={{ marginTop: 8 }}>
      <div className="mut">Color: <b style={{ color: "var(--tx)" }}>{color}</b></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "6px 0" }}>{auto.colores.map((c) => <button key={c.n} type="button" title={c.n} aria-label={c.n} onClick={() => setColor(c.n)} style={{ width: 30, height: 30, borderRadius: "50%", background: c.hex, cursor: "pointer", border: color === c.n ? "3px solid var(--ac)" : "2px solid var(--bd)", boxShadow: color === c.n ? "0 0 10px var(--glow)" : "none" }} />)}</div>
      <div className="mut" style={{ fontSize: 12 }}>Llegan colores nuevos a las {new Date(auto.hasta).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}.</div>
      <div className="mut" style={{ marginTop: 8 }}>Detalles (opcional)</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "4px 0" }}>{auto.detalles.map((d) => <button key={d} type="button" className={"btn " + (det.includes(d) ? "" : "g")} style={{ padding: "5px 10px", fontSize: 12, boxShadow: "none" }} onClick={() => alt(d)}>{d}</button>)}</div></div>}
    <Comprar url="/api/comprar" body={{ id, color, detalles: det }} metodos={metodos} disabled={!!bloqueo} off={bloqueo} total={total} label={label} totalLabel={totalLabel} /></>);
}
