"use client";
import { useState } from "react";
import { Skull, Search, Car } from "lucide-react";
const call = async (b) => { const r = await fetch("/api/delictivo", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return false; } return true; };
const EST = { pendiente: "var(--mut)", aceptado: "var(--ok)", aprobado: "var(--ok)", rechazado: "var(--bad)", cerrando: "var(--mut)" };
const Hist = ({ l }) => l.map((x) => <div key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderTop: "1px solid var(--bd)" }}><span>{x.t}<div className="mut">{new Date(x.at).toLocaleDateString("es")}{x.m ? ` · ${x.m}` : ""}{x.ent?.length ? ` · ${x.ent.join(", ")}` : ""}</div></span><b style={{ color: EST[x.e] }}>{x.e}</b></div>);
export default function Delictivo({ asaltos, robos }) {
  const [q, setQ] = useState(""), [res, setRes] = useState([]), [t, setT] = useState(null), [veh, setVeh] = useState(false);
  const buscar = async (e) => { e.preventDefault(); const r = await fetch("/api/delictivo?q=" + encodeURIComponent(q)); if (r.ok) setRes((await r.json()).users); };
  const v = (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); return { ...f, objetos: !!f.objetos, vehiculos: !!f.vehiculos }; };
  return (<><h2 style={{ color: "var(--ac)", display: "flex", gap: 8, alignItems: "center" }}><Skull />Panel delictivo</h2><p className="mut">Solo para quienes tienen el rol delictivo. Todo queda registrado.</p>
    <div className="card"><b>Asaltar a un ciudadano</b><p className="mut">La víctima recibe un aviso y debe aceptar o rechazar. Si acepta, ella elige qué te entrega.</p>
      <form className="row2" onSubmit={buscar}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, Roblox o cédula" /><button className="btn g"><Search size={16} />Buscar</button></form>
      {res.map((x) => <div key={x.id} className="card" style={{ cursor: "pointer", padding: 10, marginTop: 6, borderColor: t?.id === x.id ? "var(--ac)" : "var(--bd)" }} onClick={() => setT(x)}>{x.label}</div>)}
      {t && <form onSubmit={async (e) => { if (await call({ accion: "asaltar", to: t.id, ...v(e) })) { alert("Asalto enviado. Espera la respuesta."); location.reload(); } }}><div style={{ margin: "10px 0" }}>Objetivo: <b>{t.label}</b></div>
        <div className="row2"><input name="efectivo" type="number" min="0" placeholder="Efectivo ($)" /><input name="tarjeta" type="number" min="0" placeholder="De su tarjeta ($)" /></div>
        <label style={{ display: "block", margin: "6px 0" }}><input type="checkbox" name="objetos" style={{ width: "auto", margin: "0 8px 0 0" }} />Objetos</label>
        <label style={{ display: "block", margin: "6px 0" }}><input type="checkbox" name="vehiculos" style={{ width: "auto", margin: "0 8px 0 0" }} onChange={(e) => setVeh(e.target.checked)} />Vehículo</label>
        <input name="evidencia" placeholder={veh ? "Foto del robo (link de Discord) — obligatoria" : "Foto del robo (opcional)"} required={veh} /><input name="msg" placeholder="Mensaje (opcional)" /><button className="btn r">Asaltar</button></form>}
      <Hist l={asaltos} /></div>
    <form className="card" onSubmit={async (e) => { const b = v(e); if (await call({ accion: "robo", ...b })) { alert("Solicitud enviada al staff."); location.reload(); } }}><b>Robar un auto (solicitud al staff)</b><p className="mut">El staff revisa la foto. Si lo aprueba, el auto aparece en tu inventario como ROBADO y la policía recibe el reporte (modelo, color y matrícula, sin ubicación).</p>
      <input name="img" placeholder="Foto del robo (link de Discord)" required /><div className="row2"><input name="modelo" placeholder="Modelo" required /><input name="color" placeholder="Color" required /><input name="placa" placeholder="Matrícula" required maxLength={8} /></div><textarea name="specs" rows={2} placeholder="Especificaciones del auto" required /><button className="btn"><Car size={16} />Enviar solicitud</button><Hist l={robos} /></form></>);
}
