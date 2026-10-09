"use client";
import { useState, useEffect } from "react";
import { dura } from "@/lib/comida";
const call = async (b) => { const r = await fetch("/api/cultivo", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return false; } if (j.msg) alert(j.msg); location.reload(); return true; };
// Semilla en el inventario personal: se planta en el patio de una casa.
export function Cultivar({ name, at, casas }) {
  const [ab, setAb] = useState(false), [casa, setCasa] = useState(casas[0]?.ref || "");
  if (!casas.length) return <div className="mut" style={{ fontSize: 13, marginTop: 6 }}>Necesitas una casa con patio para cultivar.</div>;
  if (!ab) return <button className="btn" style={{ marginTop: 8, width: "100%" }} onClick={() => setAb(true)}>Cultivar</button>;
  return (<div style={{ marginTop: 8 }}>{casas.length > 1 && <select value={casa} onChange={(e) => setCasa(e.target.value)}>{casas.map((c) => <option key={c.ref} value={c.ref}>{c.label}</option>)}</select>}
    <div className="mut" style={{ fontSize: 12 }}>Se planta en el patio y tarda 48 horas reales. Guarda evidencias (fotos o video) del rol de la plantación.</div>
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}><button className="btn" onClick={() => call({ accion: "cultivar", name, at, casa })}>Plantar aquí</button><button className="btn g" onClick={() => setAb(false)}>Cancelar</button></div></div>);
}
// Planta sembrada en el patio: temporizador y cosecha.
export function Cosechar({ name, at, listo }) {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 30000); return () => clearInterval(t); }, []);
  const resto = listo - ahora;
  return resto > 0 ? <span className="tag" style={{ color: "#ff9f1a" }}>🌱 Faltan {dura(resto)}</span> : <button className="btn" onClick={() => call({ accion: "cosechar", name, at })}>Cosechar</button>;
}
// Ofertas de compra de sustancias que te hicieron otros jugadores.
export function Ofertas({ l }) {
  if (!l.length) return null;
  return (<div className="card" style={{ marginBottom: 12, borderColor: "#ff9f1a" }}><b>Te ofrecen una compra</b>{l.map((o) => <div key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--bd)" }}><span>{o.deN} te ofrece <b>{o.n} bolsitas</b> ({o.name}) por <b>${o.precio.toLocaleString("es")}</b> en efectivo.</span><span style={{ display: "flex", gap: 6 }}><button className="btn" onClick={() => call({ accion: "responder", id: o.id, ok: true })}>Aceptar</button><button className="btn g" onClick={() => call({ accion: "responder", id: o.id, ok: false })}>Rechazar</button></span></div>)}</div>);
}
