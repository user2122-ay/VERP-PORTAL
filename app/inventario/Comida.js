"use client";
import { useState, useEffect } from "react";
import { dura, estrellas } from "@/lib/comida";
const call = async (b) => { const r = await fetch("/api/comida", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); alert(r.ok ? j.msg || "Listo" : j.error || "Error"); if (r.ok) location.reload(); };
function Tarjeta({ i, ahora, nevera }) {
  const resto = i.vence - ahora, venc = resto <= 0, tipo = i.consumo?.tipo === "agua" ? "agua" : "comida";
  return (<div className="card" style={venc ? { borderColor: "var(--bad)" } : undefined}><div className="mi">{i.img ? <img src={i.img} alt="" /> : <span className="mut">Sin foto</span>}</div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><span className="tag">{i.sub || "Comida"}</span>{i.enNevera && <span className="tag">❄ En la nevera</span>}{venc && <span className="rob-t">VENCIDO</span>}</div>
    <div><b>{i.name}</b></div><div className="mut">Sube {i.consumo?.pct}% de {tipo} · <span title="Calificación">{estrellas(i.calif || 4)}</span></div>
    <div className="mut" style={{ color: venc ? "var(--bad)" : resto < 36e5 * 6 ? "#ff9f1a" : undefined }}>{venc ? "Vencido: puede enfermarte" : `Vence en ${dura(resto)}`}</div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      <button className="btn" onClick={() => call({ accion: "comer", fid: i.fid })}>{tipo === "agua" ? "Beber" : "Comer"}</button>
      {i.enNevera ? <button className="btn g" onClick={() => call({ accion: "sacar", fid: i.fid })}>Sacar de la nevera</button> : nevera && !venc && <button className="btn g" onClick={() => call({ accion: "guardar", fid: i.fid })}>Guardar en la nevera</button>}
      <button className="btn g" onClick={() => confirm(`¿Botar ${i.name}?`) && call({ accion: "botar", fid: i.fid })}>Botar</button></div></div>);
}
// Pestaña Comida del Inventario: la comida que llevas y la nevera de tu casa.
export default function Comida({ comida, nevera }) {
  const [ver, setVer] = useState(false), [ahora, setAhora] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 30000); return () => clearInterval(t); }, []);
  const fuera = comida.filter((c) => !c.enNevera), dentro = comida.filter((c) => c.enNevera);
  return (<>
    <div className="card" style={{ marginBottom: 12 }}>{nevera ? <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>{nevera.img && <img src={nevera.img} alt="" style={{ width: 110, height: 76, objectFit: "cover", borderRadius: 10 }} />}
      <div style={{ flex: 1, minWidth: 180 }}><b>{nevera.name}</b><div className="mut">{dentro.length} de {nevera.capacidad} espacios usados · la comida guardada dura {3}x más</div></div>
      <button className="btn" onClick={() => setVer(!ver)}>{ver ? "Cerrar nevera" : "Ver nevera"}</button></div>
      : <div><b>No tienes nevera</b><div className="mut">Compra una en el Mercado → Herramientas (Tool Store). Necesitas una casa. Con nevera puedes guardar comida para que dure más.</div></div>}</div>
    {ver && nevera && <><h3>Dentro de la nevera ({dentro.length}/{nevera.capacidad})</h3>{dentro.length ? <div className="grid">{dentro.map((i) => <Tarjeta key={i.fid} i={i} ahora={ahora} nevera />)}</div> : <div className="card mut">La nevera está vacía.</div>}</>}
    <h3 style={{ marginTop: 16 }}>Lo que llevas ({fuera.length})</h3>
    {fuera.length ? <div className="grid">{fuera.map((i) => <Tarjeta key={i.fid} i={i} ahora={ahora} nevera={!!nevera} />)}</div> : <div className="card mut">No llevas comida. Compra en el Mercado → Comida y bebida.</div>}</>);
}
