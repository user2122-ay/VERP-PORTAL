"use client";
import { useState } from "react";
import { Home, Users, Refrigerator, Package, LogOut, UserPlus, X } from "lucide-react";
import { LUGARES_CASA, } from "@/lib/casa";
import { dura } from "@/lib/comida";
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
async function call(b, recargar = true) { const r = await fetch("/api/hogar", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return null; } if (j.msg) alert(j.msg); if (recargar) location.reload(); return j; }
const Foto = ({ src, n }) => src ? <img src={src} alt="" style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 8 }} /> : <span style={{ width: 38, height: 38, borderRadius: 8, background: "var(--bd)", display: "grid", placeItems: "center", fontSize: 11 }}>{(n || "?")[0]}</span>;
const modoTxt = (m, c) => m === "familia" ? "Familia (gratis, acceso completo)" : `Alquilino · ${$(c)} por semana`;
function Invitar({ c }) {
  const [q, setQ] = useState(""), [modo, setModo] = useState("familia"), [cuota, setCuota] = useState(500), libre = c.cupo - c.ocup.length - c.inv.length;
  if (libre <= 0) return <div className="mut" style={{ fontSize: 13 }}>La casa está llena.</div>;
  return (<div style={{ marginTop: 8 }}><label className="mut">Invitar a alguien (usuario de Roblox o cédula)</label><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej: Juan123" />
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><select value={modo} onChange={(e) => setModo(e.target.value)} style={{ flex: 1 }}><option value="familia">Familia (gratis, acceso total al inventario y nevera)</option><option value="alquiler">Alquilino (paga cuota semanal, acceso limitado)</option></select>{modo === "alquiler" && <input type="number" min="1" value={cuota} onChange={(e) => setCuota(e.target.value)} style={{ width: 120 }} placeholder="Cuota/semana" />}</div>
    <button className="btn" style={{ width: "100%", marginTop: 6 }} onClick={() => q.trim() && call({ accion: "invitar", casa: c.ref, quien: q, modo, cuota })}><UserPlus size={16} /> Invitar ({libre} lugar{libre === 1 ? "" : "es"} libre{libre === 1 ? "" : "s"})</button></div>);
}
function Vivo({ v }) {
  const [it, setIt] = useState(""), [lugar, setLugar] = useState(LUGARES_CASA[0]), [fid, setFid] = useState(""), sel = v.mios.find((x) => x.name + x.at === it);
  return (<div className="card"><b style={{ display: "flex", gap: 6, alignItems: "center" }}><Home size={18} /> Vivo en {v.label}</b><p className="mut" style={{ margin: "4px 0" }}>Dueño: {v.dueno} · {modoTxt(v.modo, v.cuota)}{v.cuota > 0 && v.prox ? ` · próximo cobro ${new Date(v.prox).toLocaleDateString("es")}` : ""}</p>
    {v.companeros.length > 0 && <p className="mut" style={{ margin: "0 0 6px", fontSize: 13 }}>Conmigo viven: {v.companeros.map((c) => `${c.name} (${c.modo})`).join(", ")}</p>}
    <button className="btn g" onClick={() => confirm("¿Irte de esta casa? Recuperas lo que guardaste aquí.") && call({ accion: "salir", casa: v.ref })}><LogOut size={16} /> Irme de la casa</button>
    <div style={{ marginTop: 14 }}><b style={{ display: "flex", gap: 6, alignItems: "center" }}><Package size={16} /> Inventario de la casa</b>
      {v.modo === "alquiler" && <p className="mut" style={{ fontSize: 12, margin: "2px 0" }}>Como alquilino solo ves y sacas lo que tú guardaste.</p>}
      {v.objetos.map((o) => <div key={o.name + o.at} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--bd)" }}><Foto src={o.img} n={o.name} /><div style={{ flex: 1 }}><b>{o.name}</b><div className="mut" style={{ fontSize: 12 }}>{o.lugar} · guardó {o.por}</div></div>{o.puede && <button className="btn g" onClick={() => call({ accion: "sacar", casa: v.ref, name: o.name, at: o.at })}>Sacar</button>}</div>)}
      {!v.objetos.length && <p className="mut">No hay objetos que puedas ver.</p>}{v.ocultos > 0 && v.modo === "familia" && <p className="mut" style={{ fontSize: 12 }}>Hay {v.ocultos} objeto(s) en la caja fuerte u otros que solo ve el dueño.</p>}
      {v.mios.length > 0 && <div style={{ marginTop: 8 }}><label className="mut">Guardar uno de mis objetos en la casa</label><select value={it} onChange={(e) => setIt(e.target.value)}><option value="">Elige un objeto</option>{v.mios.map((x) => <option key={x.name + x.at} value={x.name + x.at}>{x.name}{x.auto ? " (auto: va al garaje)" : ""}</option>)}</select>
        {sel && !sel.auto && <select value={lugar} onChange={(e) => setLugar(e.target.value)}>{LUGARES_CASA.map((l) => <option key={l}>{l}</option>)}</select>}
        <button className="btn" disabled={!sel} style={{ width: "100%" }} onClick={() => call({ accion: "guardar", casa: v.ref, name: sel.name, at: sel.at, lugar })}>Guardar en la casa</button></div>}</div>
    <div style={{ marginTop: 14 }}><b style={{ display: "flex", gap: 6, alignItems: "center" }}><Refrigerator size={16} /> Nevera de la casa ({v.nevera.length}/{v.cap})</b>
      {!v.tieneNevera && <p className="mut">El dueño todavía no tiene nevera.</p>}
      {v.nevera.map((o) => <div key={o.fid} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--bd)" }}><Foto src={o.img} n={o.name} /><div style={{ flex: 1 }}><b>{o.name}</b><div className="mut" style={{ fontSize: 12 }}>{o.resta > 0 ? `dura ${dura(o.resta)}` : "vencido"} · puso {o.por}</div></div><button className="btn" onClick={() => call({ accion: "nev_comer", casa: v.ref, fid: o.fid })}>Comer</button>{o.puede && <button className="btn g" onClick={() => call({ accion: "nev_sacar", casa: v.ref, fid: o.fid })}>Sacar</button>}</div>)}
      {v.tieneNevera && v.comida.length > 0 && <div style={{ marginTop: 8 }}><label className="mut">Meter mi comida en la nevera de la casa</label><select value={fid} onChange={(e) => setFid(e.target.value)}><option value="">Elige comida</option>{v.comida.map((x) => <option key={x.fid} value={x.fid}>{x.name}</option>)}</select><button className="btn" disabled={!fid} style={{ width: "100%" }} onClick={() => call({ accion: "nev_guardar", casa: v.ref, fid })}>Guardar en la nevera</button></div>}</div></div>);
}
export default function Hogar({ mias, invs, vivo, cuotaMax }) {
  return (<div style={{ maxWidth: 720, margin: "0 auto" }}><h2 style={{ display: "flex", gap: 8, alignItems: "center" }}><Home size={22} /> Hogar</h2>
    <p className="mut">Vive con otras personas: el dueño de una casa invita como <b>familia</b> (gratis, todos usan el inventario y la nevera de la casa) o como <b>alquilino</b> (paga una cuota semanal de hasta {$(cuotaMax)} y solo usa lo que él mismo guarda). Cada persona puede vivir en una sola casa compartida.</p>
    {invs.map((i) => <div key={i.ref} className="card"><b>Invitación</b><p className="mut" style={{ margin: "4px 0" }}>{i.dueno} te invita a vivir en {i.label} · {modoTxt(i.modo, i.cuota)}{i.cuota > 0 ? ". Pagas la primera semana al aceptar." : ""}</p><div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => call({ accion: "aceptar", casa: i.ref })}>Aceptar</button><button className="btn g" onClick={() => call({ accion: "rechazar", casa: i.ref })}>Rechazar</button></div></div>)}
    {vivo && <Vivo v={vivo} />}
    {mias.map((c) => <div key={c.ref} className="card"><b style={{ display: "flex", gap: 6, alignItems: "center" }}><Users size={18} /> Mi casa: {c.label}</b><p className="mut" style={{ margin: "4px 0" }}>{c.hab} · {c.ocup.length + 1} de {c.plazas} personas</p>
      {c.ocup.map((o) => <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--bd)" }}><span><b>{o.name}</b> <span className="mut">{modoTxt(o.modo, o.cuota)}{o.cuota > 0 && o.prox ? ` · cobra ${new Date(o.prox).toLocaleDateString("es")}` : ""}</span></span><button className="btn g" onClick={() => confirm(`¿Sacar a ${o.name}?`) && call({ accion: "expulsar", casa: c.ref, id: o.id })}>Sacar</button></div>)}
      {c.inv.map((o) => <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--bd)" }}><span><b>{o.name}</b> <span className="mut">invitación pendiente · {modoTxt(o.modo, o.cuota)}</span></span><button className="btn g" onClick={() => call({ accion: "cancelarInv", casa: c.ref, id: o.id })}><X size={14} /></button></div>)}
      <Invitar c={c} /></div>)}
    {!mias.length && !vivo && !invs.length && <div className="card"><p className="mut">Todavía no tienes casa ni vives en una. Compra una casa en el Mercado (Propiedades) o espera una invitación.</p></div>}</div>);
}
