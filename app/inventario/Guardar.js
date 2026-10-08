"use client";
import { useState } from "react";
import { LUGARES_CASA } from "@/lib/casa";
const call = async (b) => { const r = await fetch("/api/casa", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return false; } location.reload(); return true; };
export function Guardar({ name, at, casas, espera, auto = false }) {
  const [ab, setAb] = useState(false), [casa, setCasa] = useState(casas[0]?.ref || ""), [lugar, setLugar] = useState(LUGARES_CASA[0]);
  if (espera > 0) return <div className="mut" style={{ fontSize: 13, marginTop: 6 }}>Podrás guardar otro objeto en {Math.ceil(espera / 60000)} min</div>;
  if (!ab) return <button className="btn g" style={{ marginTop: 8, width: "100%" }} onClick={() => setAb(true)}>{auto ? "Guardar en el garaje" : "Guardar en casa"}</button>;
  return (<div style={{ marginTop: 8 }}>{casas.length > 1 && <select value={casa} onChange={(e) => setCasa(e.target.value)}>{casas.map((c) => <option key={c.ref} value={c.ref}>{c.label}</option>)}</select>}
    {auto ? <div className="mut">Se guarda en el garaje de la casa (cabe un solo auto).</div> : <select value={lugar} onChange={(e) => setLugar(e.target.value)}>{LUGARES_CASA.map((l) => <option key={l}>{l}</option>)}</select>}
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}><button className="btn" onClick={() => call({ accion: "guardar", name, at, casa, lugar })}>{auto ? "Guardar aquí" : "Esconder aquí"}</button><button className="btn g" onClick={() => setAb(false)}>Cancelar</button></div></div>);
}
export function Sacar({ name, at }) { return <button className="btn g" onClick={() => call({ accion: "sacar", name, at })}>Sacar</button>; }
