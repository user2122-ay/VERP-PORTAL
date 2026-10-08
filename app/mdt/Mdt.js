"use client";
import { useEffect, useRef, useState } from "react";
import { Search, Shield, FileText, Gavel, Siren, Plus, Home, Wallet, Landmark, Receipt, Lock } from "lucide-react";
import CedulaCard from "@/components/CedulaCard";
import ZoomMap from "@/components/ZoomMap";
import Acceso from "./Acceso";
import { RANGOS_POR_DEPTO, DEPTOS } from "@/lib/mdt";
import LicenciaCard from "@/components/LicenciaCard";
const fecC = (d) => new Date(d).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`, fec = (d) => new Date(d).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const get = async (q) => { const r = await fetch("/api/mdt?" + q, { cache: "no-store" }); return r.ok ? r.json() : null; };
const post = async (b) => { const r = await fetch("/api/mdt", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return null; } return j; };
const fd = (e) => { e.preventDefault(); return Object.fromEntries(new FormData(e.target)); };
function Buscador({ onPick, ph = "Nombre, Roblox o cédula", m = "buscar" }) {
  const [q, setQ] = useState(""), [r, setR] = useState([]);
  // OJO: no es un <form> porque este buscador va dentro de otros formularios (Multas); un form dentro de otro hacía que "Buscar" enviara el de afuera y recargara la página.
  const buscar = async () => setR((await get("m=" + m + "&q=" + encodeURIComponent(q)))?.users || []);
  return (<><div className="row2"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.keyCode === 13) { e.preventDefault(); e.stopPropagation(); buscar(); } }} onKeyPress={(e) => { if (e.key === "Enter") e.preventDefault(); }} enterKeyHint="search" placeholder={ph} /><button type="button" className="btn g" onClick={buscar}><Search size={16} />Buscar</button></div>
    {r.map((x) => <div key={x.id} className="card" style={{ cursor: "pointer", padding: 10, marginTop: 6 }} onClick={() => { onPick(x); setR([]); setQ(""); }}>{x.label}</div>)}</>);
}
function AutoCard({ r, abrir }) {
  const esp = [["Marca", r.marca], ["Año", r.anio], ["Clase", r.clase], ["Color", r.color], ["Detalles", r.detalles?.length ? r.detalles.join(", ") : "Ninguno"]].filter(([, v]) => v);
  return (<div className={"card" + (r.robado ? " rob" : "")} style={{ marginTop: 8 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, alignItems: "start" }}>
      <div className="mi" style={{ marginBottom: 0 }}>{r.img ? <img src={r.img} alt={r.modelo} /> : <span className="mut">Sin foto</span>}</div>
      <div><b style={{ fontSize: 22 }}>{r.placa}</b> {r.robado && <span className="rob-t" style={{ fontSize: 11 }}>ROBADO</span>}<div style={{ fontSize: 17 }}>{r.modelo}</div><div className="mut">{r.estado}</div>
        <div style={{ marginTop: 8 }}><b>Especificaciones</b>{esp.map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "4px 0", borderTop: "1px solid var(--bd)" }}><span className="mut">{k}</span><span style={{ textAlign: "right" }}>{v}</span></div>)}</div>
        {r.desc && <div className="mut" style={{ marginTop: 6 }}>{r.desc}</div>}
        <div style={{ marginTop: 8 }}>Propietario: {r.dueno ? <b>{r.dueno.label}</b> : <span className="mut">sin propietario registrado</span>}</div>{r.dueno && <button className="btn g" style={{ marginTop: 6 }} onClick={() => abrir(r.dueno.id)}>Ver ficha del propietario</button>}</div></div></div>);
}
function Matricula({ abrir }) {
  const [q, setQ] = useState(""), [r, setR] = useState(undefined), [v, setV] = useState([]);
  return (<><form className="row2" onSubmit={async (e) => { e.preventDefault(); const j = await get("m=placa&q=" + encodeURIComponent(q)); setR(j?.p || null); setV(j?.varios || []); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Matrícula (ej: VEN-482) o modelo del auto" /><button className="btn g"><Search size={16} />Buscar</button></form>
    {r === null && !v.length && <p className="mut">No hay ningún auto con esa matrícula o modelo.</p>}
    {r && <AutoCard r={r} abrir={abrir} />}
    {!r && v.map((x) => <AutoCard key={x.placa} r={x} abrir={abrir} />)}</>);
}
function Ciudadanos() {
  const [f, setF] = useState(null), abrir = async (id) => setF(await get("m=ficha&id=" + id));
  return (<><div className="card"><b>Buscar ciudadano</b><Buscador onPick={(x) => abrir(x.id)} /><b style={{ display: "block", marginTop: 14 }}>Buscar auto por matrícula</b><Matricula abrir={abrir} /></div>
    {f && <div style={{ display: "grid", gap: 12 }}><div style={{ maxWidth: 520 }}><CedulaCard c={f.cedula} /></div>
      <div className="card"><b>Datos</b><div className="mut">Línea: {f.linea || "sin chip"}</div><b style={{ display: "block", marginTop: 8 }}>Vehículos</b>{f.autos.map((a, k) => <div key={k} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0" }}>{a.img && <img src={a.img} alt="" style={{ width: 84, height: 52, objectFit: "cover", borderRadius: 8 }} />}<div>{a.name} {a.placa && <span className="mut">· {a.placa}</span>} {a.robado && <span className="rob-t" style={{ fontSize: 11 }}>ROBADO</span>}{a.ret && <span className="tag" style={{ color: "#ff9f1a" }}>RETENIDO hasta {fecC(a.ret)}</span>}<div className="mut">{a.color}{a.detalles?.length ? ` · ${a.detalles.join(", ")}` : ""}</div></div></div>)}{!f.autos.length && <div className="mut">Sin vehículos.</div>}</div>
      <div className="card"><b>Licencias</b>{[["conducir", "Conducir"], ["armas", "Armas"], ["embarcaciones", "Embarcaciones"]].map(([t, n]) => { const l = f.licencias.find((x) => x.tipo === t); return <div key={t} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "4px 0" }}><span>{n}</span>{l ? (l.ret ? <b style={{ color: "#ff9f1a" }}>Retenida hasta {fecC(l.ret)}</b> : <b style={{ color: "var(--ok)" }}>Tiene · {l.num}</b>) : <b style={{ color: "var(--bad)" }}>No tiene</b>}</div>; })}
        {f.licencias.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, marginTop: 10 }}>{f.licencias.map((l, k) => <LicenciaCard key={k} tipo={l.tipo} c={f.cedula} num={l.num} emision={l.at} />)}</div>}</div>
      <div className="card"><b>Multas ({f.multas.length})</b>{f.multas.map((m) => <FilaMulta key={m.id} m={m} />)}{!f.multas.length && <div className="mut">Sin multas.</div>}{f.retenidos.length > 0 && <><b style={{ display: "block", marginTop: 10 }}>Objetos retenidos</b>{f.retenidos.map((r, k) => <div key={k} style={{ padding: "4px 0" }}>{r.name} <span className="mut">· hasta {fecC(r.hasta)} · {r.por}{r.motivo ? ` · ${r.motivo}` : ""}</span></div>)}</>}</div>
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
const fec2 = (d) => new Date(d).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const EST = { pendiente: "var(--mut)", aprobada: "var(--ok)", ejecutada: "var(--ok)", rechazada: "var(--bad)" };
function Casas({ aprueba, yo }) {
  const [sel, setSel] = useState(null), [motivo, setMotivo] = useState(""), [l, setL] = useState([]), [dentro, setDentro] = useState(null), cargar = async () => setL((await get("m=allan"))?.l || []);
  useEffect(() => { cargar(); const x = setInterval(cargar, 8000); return () => clearInterval(x); }, []);
  const grupos = dentro && dentro.items.reduce((g, i) => ((g[i.lugar] = g[i.lugar] || []).push(i), g), {});
  return (<><div className="card"><b>Solicitar allanamiento</b><p className="mut">Cualquier agente puede solicitarlo. Desde el rango de Comisario se aprueba. Si lo aprueban, el agente que lo pidió puede entrar a revisar durante 1 hora.</p>
    <Buscador m="casas" ph="Dueño de la casa (nombre, Roblox o cédula)" onPick={setSel} />
    {sel && <div style={{ marginTop: 8 }}><div>Propietario: <b>{sel.label}</b></div><textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo del allanamiento" style={{ margin: "6px 0" }} />
      {sel.casas.map((c) => <div key={c.name + c.at} className="card" style={{ padding: 10, marginTop: 6, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><span>{c.name}<div className="mut">{c.ubicacion}{c.color ? ` · ${c.color}` : ""}</div></span><button className="btn" onClick={async () => { if (await post({ accion: "allanSolicitar", owner: sel.id, casaName: c.name, casaAt: c.at, motivo })) { alert("Solicitud enviada"); setSel(null); setMotivo(""); cargar(); } }}>Solicitar</button></div>)}</div>}</div>
    {dentro && <div className="card" style={{ borderColor: "var(--ac)" }}><div style={{ display: "flex", justifyContent: "space-between" }}><b>Revisando: {dentro.casa}</b><button className="btn g" onClick={() => setDentro(null)}>Salir</button></div>
      {Object.entries(grupos).map(([lugar, its]) => <div key={lugar} style={{ marginTop: 8 }}><b>{lugar}</b>{its.map((i, k) => <div key={k} style={{ padding: "4px 0" }}>{i.name} <span className="tag">{i.category}</span>{i.placa && <span className="mut"> · {i.placa}</span>} {i.robado && <span className="rob-t" style={{ fontSize: 11 }}>ROBADO</span>}</div>)}</div>)}{!dentro.items.length && <p className="mut">No encontraron nada escondido en esta casa.</p>}</div>}
    <h3 style={{ marginTop: 14 }}>Solicitudes</h3>
    {l.map((x) => (<div key={x.id} className="card"><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>{x.casa} · {x.duenoN}</b><b style={{ color: EST[x.estado] }}>{x.estado}</b></div><div className="mut">{x.ubicacion} · Pide: {x.por} · {fec2(x.at)}</div><div>{x.motivo}</div>{x.resolvio && <div className="mut">Resolvió: {x.resolvio}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {x.estado === "pendiente" && aprueba && x.porId !== yo && <><button className="btn" onClick={async () => { if (await post({ accion: "allanResolver", id: x.id, ok: true })) cargar(); }}>Aprobar</button><button className="btn r" onClick={async () => { if (await post({ accion: "allanResolver", id: x.id, ok: false })) cargar(); }}>Rechazar</button></>}
        {x.estado === "pendiente" && aprueba && x.porId === yo && <span className="mut">Otro comisario debe aprobar tu solicitud.</span>}
        {["aprobada", "ejecutada"].includes(x.estado) && x.porId === yo && x.vence && new Date(x.vence) > new Date() && <button className="btn" onClick={async () => { const j = await post({ accion: "allanEntrar", id: x.id }); if (j) { setDentro(j); cargar(); } }}>Entrar a revisar (hasta {fec2(x.vence)})</button>}</div></div>))}{!l.length && <div className="card mut">No hay solicitudes de allanamiento.</div>}</>);
}
function Sueldo() {
  const [s, setS] = useState(null), cargar = async () => setS(await get("m=sueldo")); useEffect(() => { cargar(); }, []);
  if (!s) return <p className="mut">Cargando...</p>;
  return (<div className="card"><b>Mi sueldo</b>
    {s.ultimo ? <><div className="mut" style={{ marginTop: 6 }}>Último pago</div><div className="big" style={{ fontSize: 28 }}>{$(s.ultimo.monto)}</div><div className="mut">{fec(s.ultimo.at)}</div></> : <p className="mut">Todavía no has recibido ningún pago. El Ministro del Interior libera los sueldos.</p>}
    {s.pagos.length > 0 && <><b style={{ display: "block", marginTop: 12 }}>Historial de pagos</b>{s.pagos.map((p, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "7px 0", borderTop: "1px solid var(--bd)" }}><div><div>{p.det}</div><div className="mut">{fec(p.at)}</div></div><b style={{ color: "var(--ok)", whiteSpace: "nowrap" }}>+{$(p.monto)}</b></div>)}</>}
    {s.edita && <><label className="mut" style={{ display: "block", marginTop: 10 }}>¿Dónde quieres recibir tu sueldo?</label>
      <select value={s.cuenta} onChange={async (e) => { if (await post({ accion: "sueldoCuenta", cuenta: e.target.value })) cargar(); }}>{s.cuentas.map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}</select>
      <p className="mut">El Ministro del Interior libera los sueldos cada semana y se depositan ahí. Si no tienes esa cuenta, se paga en efectivo.</p></>}</div>);
}
function Tesoreria() {
  const [t, setT] = useState(null), [busy, setBusy] = useState(false), [dep, setDep] = useState("Policía Nacional Bolivariana"), [rg, setRg] = useState(""), [sl, setSl] = useState(""), [tasa, setTasa] = useState(""), cargar = async () => setT(await get("m=tesoreria")); useEffect(() => { cargar(); }, []);
  if (!t) return <p className="mut">Cargando...</p>;
  const rangos = RANGOS_POR_DEPTO[dep] || [], rango = rangos.includes(rg) ? rg : rangos[0], miembros = t.agentes.filter((a) => a.depto === dep && a.rango === rango);
  const sueldo = sl !== "" ? Number(sl) : t.sueldos?.[`${dep}|${rango}`] || 0, pend = miembros.filter((a) => a.toca).length;
  const liberar = async () => {
    if (!(sueldo > 0)) return alert("Escribe el sueldo");
    if (!confirm(`Se pagarán ${$(sueldo * pend)} a ${pend} miembro(s) con rango ${rango}. ¿Liberar sueldo?`)) return; setBusy(true);
    const j = await post({ accion: "liberarRango", depto: dep, rango, sueldo }); setBusy(false);
    if (j) { alert(`Sueldo liberado: ${j.pagados} de ${j.miembros} miembro(s), ${$(j.total)}.${j.sinFondos?.length ? `
Sin fondos para: ${j.sinFondos.join(", ")}` : ""}`); setSl(""); cargar(); }
  };
  const guardarTasa = async () => { if (await post({ accion: "tasaSet", tasa })) { setTasa(""); cargar(); } };
  return (<div style={{ display: "grid", gap: 12 }}>
    <div className="card"><b>Tesorería del Estado</b><div className="big" style={{ fontSize: 30 }}>{$(t.saldo)}</div>
      <div className="mut">Ingresos totales {$(t.ingresos)} · Egresos totales {$(t.egresos)}</div>
      <p className="mut">Aquí llega el ITBMS de lo que se compra en el Mercado, los impuestos de los bancos y los negocios legales. El mercado negro no paga impuestos.</p></div>
    <div className="card"><b>Impuesto a los objetos (ITBMS)</b><div className="big" style={{ fontSize: 28 }}>{Math.round(t.tasa * 1000) / 10}%</div><div className="row2"><input type="number" min="0" max="30" step="0.5" value={tasa} onChange={(e) => setTasa(e.target.value)} placeholder="Nuevo impuesto (%)" /><button className="btn" onClick={guardarTasa}>Aplicar</button></div><p className="mut">Sube o baja el impuesto de todo lo que se vende en el Mercado (de 0% a 30%).</p></div>
    <div className="card"><b>Pagar sueldos</b>
      <label className="mut">Departamento</label><select value={dep} onChange={(e) => { setDep(e.target.value); setRg(""); setSl(""); }}>{DEPTOS.map((d) => <option key={d}>{d}</option>)}</select>
      <label className="mut">Rango</label><select value={rango} onChange={(e) => { setRg(e.target.value); setSl(""); }}>{rangos.map((r) => <option key={r}>{r}</option>)}</select>
      <label className="mut">Sueldo semanal ($)</label><input type="number" min="1" value={sl} onChange={(e) => setSl(e.target.value)} placeholder={sueldo ? `Actual: ${$(sueldo)}` : "Escribe el sueldo"} />
      <b style={{ display: "block", marginTop: 6 }}>Miembros con este rango ({miembros.length})</b>
      {miembros.map((a) => <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderTop: "1px solid var(--bd)" }}><span>{a.nombre}<div className="mut">cobra en {a.cuenta === "efectivo" ? "efectivo" : a.cuenta.toUpperCase()}</div></span><span className="mut" style={{ textAlign: "right" }}>{a.toca ? "Pendiente de pago" : `Pagado ${fec(a.ultimoPago)}`}</span></div>)}
      {!miembros.length && <p className="mut">No hay nadie con este rango.</p>}
      <button className="btn" style={{ width: "100%", marginTop: 10 }} disabled={busy || !pend || !(sueldo > 0)} onClick={liberar}><Wallet size={16} />{pend ? `Liberar sueldo (${$(sueldo * pend)})` : "No hay pagos pendientes"}</button>
      {sueldo * pend > t.saldo && <p style={{ color: "var(--bad)" }}>La Tesorería no alcanza. Se pagará a quienes alcance.</p>}</div>
    <div className="card"><b>Negocios legales e impuesto</b>
      {t.negocios.map((n, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderTop: "1px solid var(--bd)" }}><span>{n.nombre}<div className="mut">Dueño: {n.dueno}</div></span><span style={{ textAlign: "right" }}><b style={{ color: n.paga ? "var(--ok)" : "var(--bad)" }}>{n.paga ? "Paga impuestos" : "No paga impuestos"}</b>{n.evadido > 0 && <div className="mut">Evadido: {$(n.evadido)}</div>}</span></div>)}
      {!t.negocios.length && <p className="mut">Ningún negocio legal tiene dueño todavía.</p>}</div>
    <div className="card"><b>Movimientos (últimos 60)</b>
      {t.mov.map((x, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderTop: "1px solid var(--bd)" }}><span>{x.concepto}<div className="mut">{fec(x.at)}</div></span><b style={{ color: x.tipo === "ingreso" ? "var(--ok)" : "var(--bad)" }}>{x.tipo === "ingreso" ? "+" : "-"}{$(x.monto)}</b></div>)}
      {!t.mov.length && <p className="mut">Aún no hay movimientos.</p>}</div></div>);
}
const ESTADO = { pendiente: ["Pendiente", "#ff9f1a"], pagada: ["Pagada", "var(--ok)"], vencida: ["VENCIDA · desacato", "var(--bad)"] };
function FilaMulta({ m, reload, pnb, ver }) {
  const [modo, setModo] = useState(null), [e, a] = ESTADO[m.estado] || ESTADO.pendiente;
  return (<div style={{ padding: "8px 0", borderTop: "1px solid var(--bd)" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><div>{ver && <b>{m.sujetoN}</b>} <b>{$(m.monto)}</b> <span className="tag" style={{ color: a, border: `1px solid ${a}` }}>{e}</span></div><span className="mut">{fec(m.at)}</span></div>
    <div>{m.articulos.join(" · ")}</div>{m.motivo && <div className="mut">{m.motivo}</div>}
    <div className="mut">{m.por} · plazo hasta {fecC(m.vence)}{m.pagadaAt ? ` · pagada el ${fecC(m.pagadaAt)}` : ""}</div>
    {m.desacato && <div style={{ color: "var(--bad)" }}>Desacato: {m.desacato.tipo} ({m.desacato.detalle}) · {m.desacato.por}</div>}
    {pnb && m.estado === "vencida" && !m.desacato && <div style={{ marginTop: 6 }}>{!modo && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className="btn g" onClick={() => setModo("detencion")}>Detener</button><button className="btn g" onClick={() => setModo("licencia")}>Retirar licencia</button></div>}
      {modo === "detencion" && <form className="row2" onSubmit={async (ev) => { const f = fd(ev); if (await post({ accion: "desacato", id: m.id, tipo: "detencion", minutos: f.minutos })) reload(); }}><input name="minutos" type="number" min="1" max="600" placeholder="Minutos detenido" required /><button className="btn">Detener</button><button type="button" className="btn g" onClick={() => setModo(null)}>Cancelar</button></form>}
      {modo === "licencia" && <form className="row2" onSubmit={async (ev) => { const f = fd(ev); if (await post({ accion: "desacato", id: m.id, tipo: "licencia", licencia: f.licencia, dias: f.dias })) reload(); }}><select name="licencia"><option value="conducir">Licencia de Conducir</option><option value="armas">Licencia de Armas</option></select><input name="dias" type="number" min="1" max="365" placeholder="Días retenida" required /><button className="btn">Retener</button><button type="button" className="btn g" onClick={() => setModo(null)}>Cancelar</button></form>}</div>}</div>);
}
function Multas({ pnb }) {
  const [l, setL] = useState([]), [f, setF] = useState("todas"), [s, setS] = useState(null), cargar = async (x = f) => setL((await get("m=multas&f=" + x))?.multas || []);
  useEffect(() => { cargar(); }, [f]);
  return (<>{pnb ? <form className="card" onKeyDown={(e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault(); }} onSubmit={async (e) => { const b = fd(e); if (!s) return alert("Elige al ciudadano"); if (await post({ accion: "multar", ...b, sujeto: s.id })) { e.target.reset(); setS(null); cargar(); } }}><b>Poner una multa</b><p className="mut" style={{ margin: "4px 0" }}>No se cobra sola: le llega al ciudadano a Inventario → Multas y la paga cuando quiera. Tiene mínimo {PLAZO_MIN} días; si vence sin pagar es desacato.</p>
      <div className="mut">Ciudadano: {s ? <b>{s.label}</b> : "ninguno"}</div><Buscador onPick={setS} />
      <input name="monto" type="number" min="1" max="1000000" placeholder="Monto ($)" required /><textarea name="articulos" rows={3} placeholder={"Artículos infringidos (uno por línea)\nEj: Art. 12 · Exceso de velocidad"} required /><input name="motivo" maxLength={300} placeholder="Observaciones (opcional)" />
      <label className="mut">Plazo para pagar (días, mínimo {PLAZO_MIN})</label><input name="dias" type="number" min={PLAZO_MIN} max="60" defaultValue={PLAZO_MIN} required /><button className="btn"><Plus size={16} />Multar</button></form>
      : <div className="card mut">Solo la Policía Nacional Bolivariana puede poner multas. Aquí puedes consultarlas.</div>}
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0" }}>{[["todas", "Todas"], ["pendiente", "Pendientes"], ["vencida", "Vencidas"], ["pagada", "Pagadas"]].map(([k, t]) => <button key={k} className={"btn " + (f === k ? "" : "g")} style={{ padding: "6px 12px" }} onClick={() => setF(k)}>{t}</button>)}</div>
    <div className="card">{l.map((m) => <FilaMulta key={m.id} m={m} ver pnb={pnb} reload={() => cargar()} />)}{!l.length && <div className="mut">No hay multas en esta lista.</div>}</div></>);
}
function Decomisos() {
  const [s, setS] = useState(null), [it, setIt] = useState([]), [act, setAct] = useState([]), ver = async (x) => setIt((await get("m=inv&id=" + x.id))?.items || []), cargar = async () => setAct((await get("m=decomisos"))?.l || []);
  useEffect(() => { cargar(); }, []);
  return (<><div className="card"><b>Decomisar</b><p className="mut" style={{ margin: "4px 0" }}>Armas, licencia de armas, licencia de conducir y autos (lo que lleve encima). Le aparece en el inventario como <b>retenido</b> los días que elijas; pasado el plazo se le devuelve solo.</p>
      <div className="mut">Ciudadano: {s ? <b>{s.label}</b> : "ninguno"}</div><Buscador onPick={(x) => { setS(x); ver(x); }} />
      {s && it.map((i) => <form key={i.name + i.at} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "8px 0", borderTop: "1px solid var(--bd)" }} onSubmit={async (e) => { const f = fd(e); if (await post({ accion: "decomisar", sujeto: s.id, name: i.name, at: i.at, dias: f.dias, motivo: f.motivo })) { ver(s); cargar(); } }}>
        {i.img && <img src={i.img} alt="" style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6 }} />}<div style={{ flex: "1 1 160px" }}><b>{i.name}</b> <span className="tag">{i.category}</span>{i.placa && <span className="mut"> · {i.placa}</span>}{i.ret && <div style={{ color: "#ff9f1a", fontSize: 13 }}>Ya retenido hasta {fecC(i.ret.hasta)}</div>}</div>
        {!i.ret && <><input name="dias" type="number" min="1" max="365" placeholder="Días" required style={{ width: 80, margin: 0 }} /><input name="motivo" placeholder="Motivo" required minLength={5} maxLength={300} style={{ flex: "1 1 140px", margin: 0 }} /><button className="btn">Decomisar</button></>}</form>)}
      {s && !it.length && <p className="mut">No lleva armas, licencias de armas/conducir ni autos encima.</p>}</div>
    <div className="card"><b>Retenciones activas ({act.length})</b>{act.map((r, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid var(--bd)", flexWrap: "wrap" }}><div><b>{r.name}</b> <span className="tag">{r.category}</span><div className="mut">{r.sujetoN} · hasta {fecC(r.hasta)} · {r.por}{r.motivo ? ` · ${r.motivo}` : ""}</div></div><button className="btn g" onClick={async () => { if (confirm("¿Devolver este objeto ahora?") && (await post({ accion: "liberar", sujeto: r.sujeto, name: r.name, at: r.at }))) { cargar(); if (s) ver(s); } }}>Devolver</button></div>)}{!act.length && <div className="mut">No hay objetos retenidos.</div>}</div></>);
}
const PLAZO_MIN = 10;
const TABS = [["Ciudadanos", Shield, Ciudadanos], ["Expedientes", FileText, Expedientes], ["Arrestos", Gavel, Arrestos], ["Multas", Receipt, Multas], ["Decomisos", Lock, Decomisos], ["Reportes", Siren, Reportes], ["Casas", Home, Casas], ["Mi sueldo", Wallet, Sueldo]];
export default function Mdt() {
  const [info, setInfo] = useState(null), [ok, setOk] = useState(false), [t, setT] = useState("Ciudadanos");
  useEffect(() => { try { const g = sessionStorage.getItem("mdt-tab"); if (g) setT(g); } catch {} }, []);
  const cambiar = (n) => { setT(n); try { sessionStorage.setItem("mdt-tab", n); } catch {} };
  useEffect(() => { (async () => { const j = await get("m=estado"); if (j) { setInfo(j); setOk(j.ok); } })(); }, []);
  if (!info) return null; if (!ok) return <Acceso info={info} onOk={() => setOk(true)} />;
  const tabs = [...TABS, ...(info.ministro ? [["Tesorería", Landmark, Tesoreria]] : [])], V = (tabs.find((x) => x[0] === t) || tabs[0])[2];
  return (<div style={{ maxWidth: 820, margin: "0 auto" }}><div style={{ display: "flex", gap: 12, alignItems: "center" }}><img src="/justicia-paz.png" alt="Justicia y Paz" style={{ height: 54, background: "#fff", borderRadius: 10, padding: 4 }} /><div><b style={{ fontSize: 18 }}>MDT · {info.ag.depto}</b><div className="mut">{info.ag.rango} {info.nombre} · @{info.discord} · Placa {info.ag.placa}</div></div></div>
    <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>{tabs.map(([n, I]) => <button key={n} className={"btn " + (t === n ? "" : "g")} onClick={() => cambiar(n)}><I size={16} />{n}</button>)}</div><V aprueba={info.aprueba} yo={info.yo} pnb={info.pnb} /></div>);
}
