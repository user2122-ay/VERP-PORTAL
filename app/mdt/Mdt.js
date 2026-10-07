"use client";
import { useEffect, useRef, useState } from "react";
import { Search, Shield, FileText, Gavel, Siren, Plus } from "lucide-react";
import CedulaCard from "@/components/CedulaCard";
import ZoomMap from "@/components/ZoomMap";
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`, fec = (d) => new Date(d).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const get = async (q) => { const r = await fetch("/api/mdt?" + q, { cache: "no-store" }); return r.ok ? r.json() : null; };
const post = async (b) => { const r = await fetch("/api/mdt", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return null; } return j; };
const fd = (e) => { e.preventDefault(); return Object.fromEntries(new FormData(e.target)); };
function Buscador({ onPick, ph = "Nombre, Roblox o cédula" }) {
  const [q, setQ] = useState(""), [r, setR] = useState([]);
  return (<><form className="row2" onSubmit={async (e) => { e.preventDefault(); setR((await get("m=buscar&q=" + encodeURIComponent(q)))?.users || []); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ph} /><button className="btn g"><Search size={16} />Buscar</button></form>
    {r.map((x) => <div key={x.id} className="card" style={{ cursor: "pointer", padding: 10, marginTop: 6 }} onClick={() => { onPick(x); setR([]); setQ(""); }}>{x.label}</div>)}</>);
}
function Matricula({ abrir }) {
  const [q, setQ] = useState(""), [r, setR] = useState(undefined);
  return (<><form className="row2" onSubmit={async (e) => { e.preventDefault(); setR((await get("m=placa&q=" + encodeURIComponent(q)))?.p || null); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Matrícula (ej: VEN-482)" /><button className="btn g"><Search size={16} />Buscar</button></form>
    {r === null && <p className="mut">No hay ningún auto con esa matrícula.</p>}
    {r && <div className={"card" + (r.robado ? " rob" : "")} style={{ marginTop: 8 }}><b style={{ fontSize: 20 }}>{r.placa}</b> {r.robado && <span className="rob-t" style={{ fontSize: 11 }}>ROBADO</span>}<div>{r.modelo}{r.color ? ` · ${r.color}` : ""}</div><div className="mut">{r.estado}</div>
      <div style={{ marginTop: 6 }}>Propietario: {r.dueno ? <b>{r.dueno.label}</b> : <span className="mut">sin propietario registrado</span>}</div>{r.dueno && <button className="btn g" style={{ marginTop: 6 }} onClick={() => abrir(r.dueno.id)}>Ver ficha del propietario</button>}</div>}</>);
}
function Ciudadanos() {
  const [f, setF] = useState(null), abrir = async (id) => setF(await get("m=ficha&id=" + id));
  return (<><div className="card"><b>Buscar ciudadano</b><Buscador onPick={(x) => abrir(x.id)} /><b style={{ display: "block", marginTop: 14 }}>Buscar auto por matrícula</b><Matricula abrir={abrir} /></div>
    {f && <div style={{ display: "grid", gap: 12 }}><div style={{ maxWidth: 520 }}><CedulaCard c={f.cedula} /></div>
      <div className="card"><b>Datos</b><div className="mut">Línea: {f.linea || "sin chip"}</div><b style={{ display: "block", marginTop: 8 }}>Vehículos</b>{f.autos.map((a, k) => <div key={k}>{a.name} {a.placa && <span className="mut">· {a.placa}</span>} {a.robado && <span className="rob-t" style={{ fontSize: 11 }}>ROBADO</span>}</div>)}{!f.autos.length && <div className="mut">Sin vehículos.</div>}</div>
      <div className="card"><b>Historial de arrestos ({f.arrestos.length})</b>{f.arrestos.map((a) => <div key={a.id} style={{ padding: "6px 0", borderTop: "1px solid var(--bd)" }}>{a.cargos}<div className="mut">{fec(a.at)} · multa {$(a.multa)} (cobrado {$(a.cobrado)}) · {a.minutos} min · {a.por}</div></div>)}{!f.arrestos.length && <div className="mut">Sin antecedentes.</div>}</div>
      <div className="card"><b>Expedientes ({f.expedientes.length})</b>{f.expedientes.map((e) => <div key={e.id}>{e.titulo} <span className="tag">{e.estado}</span></div>)}{!f.expedientes.length && <div className="mut">Ninguno.</div>}</div></div>}</>);
}
function Expedientes() {
  const [l, setL] = useState([]), [s, setS] = useState(null), [ab, setAb] = useState(null), cargar = async () => setL((await get("m=exp"))?.exps || []);
  useEffect(() => { cargar(); }, []);
  return (<><form className="card" onSubmit={async (e) => { const b = fd(e); if (await post({ accion: "expNuevo", ...b, sujeto: s?.id })) { e.target.reset(); setS(null); cargar(); } }}><b>Nuevo expediente / investigación</b><input name="titulo" placeholder="Título" required /><textarea name="desc" rows={2} placeholder="Descripción" />
    <div className="mut">Sujeto (opcional): {s ? <b>{s.label}</b> : "ninguno"}</div><Buscador onPick={setS} /><button className="btn" style={{ marginTop: 8 }}><Plus size={16} />Crear</button></form>
    {l.map((e) => (<div key={e.id} className="card"><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>{e.titulo}</b><span className="tag" style={{ color: e.estado === "abierto" ? "var(--ok)" : "var(--mut)" }}>{e.estado}</span></div><div className="mut">{e.creador} · {fec(e.at)}{e.sujetos.length ? ` · ${e.sujetos.join(" | ")}` : ""}</div><div>{e.desc}</div>
      {ab === e.id && <><div className="chatb">{e.notas.map((n, k) => <div key={k}><b>{n.by}</b> <span className="mut">{fec(n.at)}</span><div>{n.txt}</div></div>)}{!e.notas.length && <span className="mut">Sin notas.</span>}</div>
        <form className="row2" onSubmit={async (x) => { const b = fd(x); if (await post({ accion: "expNota", id: e.id, txt: b.txt })) { x.target.reset(); cargar(); } }}><input name="txt" placeholder="Añadir nota" /><button className="btn g">Añadir</button></form></>}
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}><button className="btn g" onClick={() => setAb(ab === e.id ? null : e.id)}>{ab === e.id ? "Ocultar notas" : `Notas (${e.notas.length})`}</button>
        <button className={"btn " + (e.estado === "abierto" ? "r" : "")} onClick={async () => { if (await post({ accion: "expEstado", id: e.id, estado: e.estado === "abierto" ? "cerrado" : "abierto" })) cargar(); }}>{e.estado === "abierto" ? "Cerrar" : "Reabrir"}</button>
        {s && <button className="btn g" onClick={async () => { if (await post({ accion: "expSujeto", id: e.id, sujeto: s.id })) cargar(); }}>Añadir sujeto elegido</button>}</div></div>))}{!l.length && <div className="card mut">No hay expedientes.</div>}</>);
}
function Arrestos() {
  const [s, setS] = useState(null);
  return (<form className="card" onSubmit={async (e) => { const b = fd(e); if (!s) return alert("Elige al sujeto"); const r = await post({ accion: "arresto", ...b, sujeto: s.id }); if (r) { alert(`Arresto registrado. Multa cobrada: ${$(r.cobrado)}. Comisión de ${$(r.comision)} para cada uno de los ${r.oficiales} oficiales.`); e.target.reset(); setS(null); } }}>
    <b>Registrar arresto</b><div className="mut">Sujeto: {s ? <b>{s.label}</b> : "sin elegir"}</div><Buscador onPick={setS} />
    <textarea name="cargos" rows={2} placeholder="Cargos" required style={{ marginTop: 8 }} /><div className="row2"><input name="multa" type="number" min="0" placeholder="Multa ($)" /><input name="minutos" type="number" min="0" placeholder="Condena (minutos)" /></div>
    <input name="oficiales" placeholder="Otros oficiales presentes (usuarios de Roblox separados por coma)" /><p className="mut">Tú y cada oficial presente reciben el 5% de la multa cobrada, en efectivo.</p><button className="btn"><Gavel size={16} />Arrestar</button></form>);
}
const beep = () => { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = 0.15; o.start(); setTimeout(() => { o.stop(); a.close(); }, 350); } catch {} };
function Reportes() {
  const [l, setL] = useState([]), [ab, setAb] = useState(null), [sel, setSel] = useState(null), prev = useRef(null);
  const cargar = async () => { const reps = (await get("m=rep"))?.reps || [], n = reps.filter((r) => r.src === "e" && !r.resuelto && !r.atiende).length; if (prev.current !== null && n > prev.current) beep(); prev.current = n; setL(reps); };
  useEffect(() => { cargar(); const x = setInterval(cargar, 6000); return () => clearInterval(x); }, []);
  const pins = l.filter((r) => r.src === "e" && r.x != null && !r.resuelto).map((r) => ({ id: r.src + r.id, x: r.x, y: r.y, color: r.atiende ? "#fbbf24" : "#ff4d5e" }));
  const atender = async (r) => { if (await post({ accion: "repAtender", src: r.src, id: r.id })) cargar(); };
  const card = (r) => { const k = r.src + r.id; return (<div key={k} className={"card" + (r.resuelto ? "" : " rob")}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}><b>{r.titulo}</b>
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="mut">{r.resuelto ? "Resuelto" : "Pendiente"}</span><button className={"sw" + (r.resuelto ? " on" : "")} aria-label="Resolver problema" onClick={async () => { if (await post({ accion: "repEstado", src: r.src, id: r.id, resuelto: !r.resuelto })) cargar(); }} /></label></div>
    <div className="mut">{fec(r.at)}{r.por ? ` · ${r.por}` : ""}</div><div>{r.det}</div>
    {r.atiende ? <div style={{ color: "var(--ok)", marginTop: 4 }}>Atiende: <b>{r.atiende}</b></div> : !r.resuelto && <button className="btn" style={{ marginTop: 8 }} onClick={() => atender(r)}>Atender llamado</button>}
    {ab === k && <><div className="chatb">{r.seg.map((n, i) => <div key={i}><b>{n.by}</b> <span className="mut">{fec(n.at)}</span><div>{n.txt}</div></div>)}{!r.seg.length && <span className="mut">Sin seguimiento.</span>}</div>
      <form className="row2" onSubmit={async (x) => { const b = fd(x); if (await post({ accion: "repNota", src: r.src, id: r.id, txt: b.txt })) { x.target.reset(); cargar(); } }}><input name="txt" placeholder="Añadir seguimiento" /><button className="btn g">Añadir</button></form></>}
    <button className="btn g" style={{ marginTop: 8 }} onClick={() => setAb(ab === k ? null : k)}>{ab === k ? "Ocultar seguimiento" : `Seguimiento (${r.seg.length})`}</button></div>); };
  const s = sel && l.find((r) => r.src + r.id === sel);
  return (<><div className="card"><b>Mapa de llamados 911</b><p className="mut" style={{ margin: "4px 0 8px" }}><span style={{ color: "#ff4d5e" }}>●</span> pendiente · <span style={{ color: "#fbbf24" }}>●</span> atendiendo. Toca un punto para ver el llamado. Se actualiza solo y suena cuando entra uno nuevo.</p><ZoomMap pins={pins} onPin={(p) => setSel(p.id)} /></div>
    {s && <><div className="mut" style={{ margin: "4px 0" }}>Llamado seleccionado · {s.zona || ""}</div>{card(s)}</>}
    {l.filter((r) => r.src + r.id !== sel).map(card)}{!l.length && <div className="card mut">No hay reportes.</div>}</>);
}
const TABS = [["Ciudadanos", Shield, Ciudadanos], ["Expedientes", FileText, Expedientes], ["Arrestos", Gavel, Arrestos], ["Reportes", Siren, Reportes]];
export default function Mdt() {
  const [t, setT] = useState("Ciudadanos"), V = TABS.find((x) => x[0] === t)[2];
  return (<div style={{ maxWidth: 820, margin: "0 auto" }}><h2 style={{ display: "flex", gap: 8, alignItems: "center" }}><Shield className="neon" />MDT · Policía</h2>
    <div style={{ display: "flex", gap: 8, margin: "10px 0", flexWrap: "wrap" }}>{TABS.map(([n, I]) => <button key={n} className={"btn " + (t === n ? "" : "g")} onClick={() => setT(n)}><I size={16} />{n}</button>)}</div><V /></div>);
}
