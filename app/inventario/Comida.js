"use client";
import { useState, useEffect } from "react";
import { dura, estrellas } from "@/lib/comida";
const call = async (b) => { const r = await fetch("/api/comida", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); alert(r.ok ? j.msg || "Listo" : j.error || "Error"); if (r.ok) location.reload(); };
const num = (x) => Math.round(x * 10) / 10;
function Tarjeta({ i, ahora, hay, dest }) {
  const resto = i.vence - ahora, venc = resto <= 0, tipo = i.consumo?.tipo === "agua" ? "agua" : "comida", r = i.rac, verbo = tipo === "agua" ? "Beber" : "Comer";
  return (<div className="card" style={venc ? { borderColor: "var(--bad)" } : undefined}><div className="mi">{i.img ? <img src={i.img} alt="" /> : <span className="mut">Sin foto</span>}</div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><span className="tag">{i.sub || "Comida"}</span>{i.enNevera && <span className="tag">❄ En la nevera</span>}{venc && <span className="rob-t">VENCIDO</span>}</div>
    <div><b>{i.name}</b></div>
    {r ? <><div className="mut">{r.q} de {r.R} {r.unp} · cada {r.un} sube {num(r.per)}% de {tipo}</div><div style={{ height: 6, borderRadius: 4, background: "var(--bd)", margin: "4px 0" }}><div style={{ height: 6, borderRadius: 4, width: `${(r.q / r.R) * 100}%`, background: "var(--ac)" }} /></div></>
      : <div className="mut">Sube {i.consumo?.pct}% de {tipo}</div>}
    <div className="mut"><span title="Calificación">{estrellas(i.calif || 4)}</span></div>
    <div className="mut" style={{ color: venc ? "var(--bad)" : resto < 36e5 * 6 ? "#ff9f1a" : undefined }}>{venc ? "Vencido: puede enfermarte" : `Vence en ${dura(resto)}`}</div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      {r ? <>
        <button className="btn" onClick={() => call({ accion: "comer", fid: i.fid, n: 1 })}>{verbo} 1 {r.un}</button>
        {r.q >= 3 && <button className="btn g" onClick={() => call({ accion: "comer", fid: i.fid, modo: "mitad" })}>La mitad</button>}
        {r.q >= 2 && <button className="btn g" onClick={() => call({ accion: "comer", fid: i.fid, modo: "todo" })}>{r.q === r.R ? "Todo" : "Lo que queda"}</button>}</>
        : <button className="btn" onClick={() => call({ accion: "comer", fid: i.fid })}>{verbo}</button>}
      {i.enNevera ? <button className="btn g" onClick={() => call({ accion: "sacar", fid: i.fid })}>Sacar de la nevera</button> : hay && !venc && <button className="btn g" onClick={() => call({ accion: "guardar", fid: i.fid, nev: dest })}>Guardar en la nevera</button>}
      <button className="btn g" onClick={() => confirm(`¿Botar ${i.name}?`) && call({ accion: "botar", fid: i.fid })}>Botar</button></div></div>);
}
// Pestaña Comida del Inventario: la comida que llevas y tus neveras (hasta 2, una por casa).
export default function Comida({ comida, neveras }) {
  const [ver, setVer] = useState(""), [ahora, setAhora] = useState(Date.now()), [dest, setDest] = useState(neveras[0]?.nid || "");
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 30000); return () => clearInterval(t); }, []);
  const fuera = comida.filter((c) => !c.enNevera), dentroDe = (n) => comida.filter((c) => c.enNevera && c.nev === n.nid), hay = neveras.length > 0;
  return (<>
    {!hay && <div className="card" style={{ marginBottom: 12 }}><b>No tienes nevera</b><div className="mut">Compra una en el Mercado → Herramientas (Tool Store). Necesitas una casa; puedes tener hasta 2 neveras (una por casa). Con nevera la comida dura más.</div></div>}
    {neveras.map((n) => { const dentro = dentroDe(n), abierta = ver === n.nid; return (<div key={n.nid} style={{ marginBottom: 12 }}><div className="card"><div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>{n.img && <img src={n.img} alt="" style={{ width: 96, height: 68, objectFit: "cover", borderRadius: 10 }} />}
      <div style={{ flex: 1, minWidth: 160 }}><b>{n.name}</b>{n.casa && <div className="mut">🏠 {n.casa}</div>}<div className="mut">{dentro.length} de {n.capacidad} espacios · la comida guardada dura 3x más</div></div>
      <button className="btn" onClick={() => setVer(abierta ? "" : n.nid)}>{abierta ? "Cerrar" : "Ver nevera"}</button></div></div>
      {abierta && <>{dentro.length ? <div className="grid" style={{ marginTop: 8 }}>{dentro.map((i) => <Tarjeta key={i.fid} i={i} ahora={ahora} hay dest={dest} />)}</div> : <div className="card mut" style={{ marginTop: 8 }}>La nevera está vacía.</div>}</>}</div>); })}
    {neveras.length > 1 && <div className="card" style={{ marginBottom: 12 }}><label className="mut">¿En qué nevera quieres guardar la comida?</label><select value={dest} onChange={(e) => setDest(e.target.value)}>{neveras.map((n) => <option key={n.nid} value={n.nid}>{n.name}{n.casa ? " · " + n.casa : ""} ({dentroDe(n).length}/{n.capacidad})</option>)}</select></div>}
    <h3 style={{ marginTop: 16 }}>Lo que llevas ({fuera.length})</h3>
    {fuera.length ? <div className="grid">{fuera.map((i) => <Tarjeta key={i.fid} i={i} ahora={ahora} hay={hay} dest={dest} />)}</div> : <div className="card mut">No llevas comida. Compra en el Mercado → Comida y bebida.</div>}</>);
}
