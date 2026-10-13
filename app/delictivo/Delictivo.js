"use client";
import { useState } from "react";
import { Skull, Search, Car } from "lucide-react";
const call = async (b) => { const r = await fetch("/api/delictivo", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return false; } return true; };
const EST = { pendiente: "var(--mut)", aceptado: "var(--ok)", aprobado: "var(--ok)", rechazado: "var(--bad)", cerrando: "var(--mut)" };
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
const Hist = ({ l }) => l.map((x) => <div key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderTop: "1px solid var(--bd)" }}><span>{x.t}<div className="mut">{new Date(x.at).toLocaleDateString("es")}{x.m ? ` · ${x.m}` : ""}{x.ent?.length ? ` · ${x.ent.join(", ")}` : ""}</div></span><b style={{ color: EST[x.e] }}>{x.e}</b></div>);
export default function Delictivo({ asaltos, robos }) {
  const [q, setQ] = useState(""), [res, setRes] = useState([]), [t, setT] = useState(null), [info, setInfo] = useState(null), [sel, setSel] = useState({});
  const buscar = async (e) => { e.preventDefault(); const r = await fetch("/api/delictivo?q=" + encodeURIComponent(q)); if (r.ok) setRes((await r.json()).users); };
  const elegir = async (x) => { setT(x); setSel({}); setInfo(null); const r = await fetch("/api/delictivo?ver=" + x.id); if (r.ok) setInfo(await r.json()); };
  const marcados = info ? info.items.filter((i) => sel[i.name + i.at]) : [], veh = marcados.some((i) => i.category === "Concesionario");
  const v = (e) => { e.preventDefault(); return Object.fromEntries(new FormData(e.target)); };
  return (<><h2 style={{ color: "var(--ac)", display: "flex", gap: 8, alignItems: "center" }}><Skull />Panel delictivo</h2><p className="mut">Se entra con la VPN comprada (la misma de la Dark Web). Todo queda registrado.</p>
    <div className="card"><b>Asaltar a un ciudadano</b><p className="mut">Solo puedes robar lo que la persona lleva encima. Lo que guarda en su casa no se ve ni se puede robar. La víctima recibe un aviso y decide si acepta.</p>
      <form className="row2" onSubmit={buscar}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, Roblox o cédula" /><button className="btn g"><Search size={16} />Buscar</button></form>
      {res.map((x) => <div key={x.id} className="card" style={{ cursor: "pointer", padding: 10, marginTop: 6, borderColor: t?.id === x.id ? "var(--ac)" : "var(--bd)" }} onClick={() => elegir(x)}>{x.label}</div>)}
      {t && <form onSubmit={async (e) => { const f = v(e); if (await call({ accion: "asaltar", to: t.id, efectivo: f.efectivo, tarjeta: f.tarjeta, evidencia: f.evidencia, msg: f.msg, items: marcados.map((i) => ({ name: i.name, at: i.at })) })) { alert("Asalto enviado. Espera la respuesta."); location.reload(); } }}>
        <div style={{ margin: "10px 0" }}>Objetivo: <b>{t.label}</b></div>
        {!info ? <p className="mut">Mirando lo que lleva encima…</p> : <>
          <div className="card" style={{ padding: 10 }}><b>Lleva encima</b><div className="mut">Efectivo: {$(info.efectivo)}</div>
            {info.items.map((i) => <label key={i.name + i.at} style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0" }}><input type="checkbox" style={{ width: "auto", margin: 0 }} checked={!!sel[i.name + i.at]} onChange={() => setSel({ ...sel, [i.name + i.at]: !sel[i.name + i.at] })} /><span>{i.name}{i.placa ? ` · ${i.placa}` : ""} <span className="tag">{i.category}</span></span></label>)}{!info.items.length && <div className="mut">No lleva objetos encima.</div>}</div>
          <div className="row2"><input name="efectivo" type="number" min="0" max={info.efectivo} placeholder={`Efectivo (máx. ${$(info.efectivo)})`} /><input name="tarjeta" type="number" min="0" placeholder="De su tarjeta ($)" /></div>
          <input name="evidencia" placeholder={veh ? "Foto del robo (link de Discord) — obligatoria" : "Foto del robo (opcional)"} required={veh} /><input name="msg" placeholder="Mensaje (opcional)" /><button className="btn r">Asaltar</button></>}</form>}
      <Hist l={asaltos} /></div>
    <form className="card" onSubmit={async (e) => { const b = v(e); if (await call({ accion: "robo", ...b })) { alert("Solicitud enviada al staff."); location.reload(); } }}><b>Robar un auto (solicitud al staff)</b><p className="mut">El staff revisa la foto. Si lo aprueba, el auto aparece en tu inventario como ROBADO y la policía recibe el reporte (modelo, color y matrícula, sin ubicación).</p>
      <input name="img" placeholder="Foto del robo (link de Discord)" required /><div className="row2"><input name="modelo" placeholder="Modelo" required /><input name="color" placeholder="Color" required /><input name="placa" placeholder="Matrícula" required maxLength={8} /></div><textarea name="specs" rows={2} placeholder="Especificaciones del auto" required /><button className="btn"><Car size={16} />Enviar solicitud</button><Hist l={robos} /></form></>);
}
