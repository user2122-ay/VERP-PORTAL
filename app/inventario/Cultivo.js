"use client";
import { useState, useEffect } from "react";
import { dura } from "@/lib/comida";
import { duracionCultivo } from "@/lib/cultivo";
const call = async (b) => { const r = await fetch("/api/cultivo", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return false; } if (j.msg) alert(j.msg); location.reload(); return true; };
// Semilla en el inventario personal: se planta en el patio de una casa.
export function Cultivar({ name, at, casas }) {
  const [ab, setAb] = useState(false), [casa, setCasa] = useState(casas[0]?.ref || "");
  if (!casas.length) return <div className="mut" style={{ fontSize: 13, marginTop: 6 }}>Necesitas una casa con patio para cultivar.</div>;
  if (!ab) return <button className="btn" style={{ marginTop: 8, width: "100%" }} onClick={() => setAb(true)}>Cultivar</button>;
  return (<div style={{ marginTop: 8 }}>{casas.length > 1 && <select value={casa} onChange={(e) => setCasa(e.target.value)}>{casas.map((c) => <option key={c.ref} value={c.ref}>{c.label}</option>)}</select>}
    <div className="mut" style={{ fontSize: 12 }}>Se planta en el patio y tarda {duracionCultivo()} reales. Guarda evidencias (fotos o video) del rol de la plantación.</div>
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}><button className="btn" onClick={() => call({ accion: "cultivar", name, at, casa })}>Plantar aquí</button><button className="btn g" onClick={() => setAb(false)}>Cancelar</button></div></div>);
}
// Planta sembrada en el patio: temporizador y cosecha.
export function Cosechar({ name, at, listo }) {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 30000); return () => clearInterval(t); }, []);
  const resto = listo - ahora;
  return resto > 0 ? <span className="tag" style={{ color: "#ff9f1a" }}>🌱 Faltan {dura(resto)}</span> : <button className="btn" onClick={() => call({ accion: "cosechar", name, at })}>Cosechar</button>;
}
