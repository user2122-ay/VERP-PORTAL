"use client";
import { useState, useMemo } from "react";
const ALERTA = "+18, 18+, +17, desnud, nude, nudes, sexo, sex, hot, cama, fotos intimas, fotos íntimas, edad, años, menor, colegio, liceo, pack, privado, dm";
const hora = (t) => new Date(t).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });
function Texto({ t, pal }) {
  if (!pal.length || !t) return <>{t}</>;
  const rx = new RegExp("(" + pal.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "ig"), parts = String(t).split(rx);
  return <>{parts.map((x, i) => (i % 2 ? <mark key={i} style={{ background: "#ffb020", color: "#000", borderRadius: 3, padding: "0 2px" }}>{x}</mark> : x))}</>;
}
function Chats({ lista, pal, filtro, vacio }) {
  const [sel, setSel] = useState(0), f = filtro.toLowerCase(), vis = lista.filter((c) => !f || c.msgs.some((m) => (m.texto || "").toLowerCase().includes(f)) || (c.con + c.nombre + (c.usuario || "")).toLowerCase().includes(f));
  if (!vis.length) return <p className="mut">{vacio}</p>;
  const c = vis[Math.min(sel, vis.length - 1)];
  return (<div style={{ display: "grid", gridTemplateColumns: "minmax(150px,230px) 1fr", gap: 10 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 460, overflow: "auto" }}>{vis.map((x, i) => <button key={i} className={"btn " + (x === c ? "" : "g")} style={{ textAlign: "left" }} onClick={() => setSel(i)}><b>{x.con}</b><br /><small>{x.nombre || x.usuario || ""} · {x.msgs.length} msj{x.estado ? " · " + x.estado : ""}</small></button>)}</div>
    <div className="chatb" style={{ maxHeight: 460 }}>{c.msgs.map((m, i) => <div key={i} style={{ alignSelf: m.mio ? "flex-end" : "flex-start", maxWidth: "80%", background: m.mio ? "var(--ac)" : "var(--card)", color: m.mio ? "#fff" : "var(--tx)", border: "1px solid var(--bd)", borderRadius: 10, padding: "6px 10px", wordBreak: "break-word" }}>
      <Texto t={m.texto || (m.post ? "(compartió una publicación)" : "")} pal={pal} />{m.anon && <small> · anónimo</small>}<br /><small style={{ opacity: .7 }}>{hora(m.at)}</small></div>)}</div></div>);
}
export default function Ojos() {
  const [q, setQ] = useState(""), [res, setRes] = useState(null), [sel, setSel] = useState(null), [razon, setRazon] = useState(""), [d, setD] = useState(null), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [tab, setTab] = useState("wa"), [filtro, setFiltro] = useState(""), [alerta, setAlerta] = useState(true), [lista, setLista] = useState(ALERTA);
  const pal = useMemo(() => (alerta ? lista.split(",").map((x) => x.trim()).filter(Boolean) : []), [alerta, lista]);
  const post = async (b) => { setBusy(true); setErr(""); try { const r = await fetch("/api/ojos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }), j = await r.json(); if (!r.ok) { setErr(j.error || "Error"); return null; } return j; } finally { setBusy(false); } };
  const buscar = async (e) => { e.preventDefault(); const j = await post({ a: "buscar", q }); if (j) { setRes(j.users); setSel(null); setD(null); } };
  const ver = async (e) => { e.preventDefault(); const j = await post({ a: "ver", uid: sel.id, razon }); if (j) { setD(j); setTab("wa"); setFiltro(""); } };
  const cuenta = d ? { wa: d.wa.reduce((n, c) => n + c.msgs.length, 0), tk: d.tk.reduce((n, c) => n + c.msgs.length, 0) } : null;
  return (<div>
    <h2>Moderación de comunicaciones</h2>
    <div className="card" style={{ borderColor: "#ffb020" }}><b>Developer, Fundación y Junta Directiva · solo lectura</b><p className="mut" style={{ margin: "6px 0 0" }}>Sirve para moderar reportes y casos de la política del servidor (roles +18). Cada revisión exige un motivo y queda en Auditoría (sin el contenido de los mensajes). Úsalo solo cuando haya un reporte o una sospecha fundada, y mantén en la política de privacidad que el staff puede revisar comunicaciones del portal para moderar.</p></div>
    <form className="card" onSubmit={buscar}><b>Buscar persona</b><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Usuario de Discord, Roblox, nombre, cédula, número +58 o @tiktok" /><button className="btn" disabled={busy || q.trim().length < 2}>Buscar</button></form>
    {err && <p style={{ color: "var(--bad)" }}>{err}</p>}
    {res && !res.length && <p className="mut">Sin resultados.</p>}
    {res && res.length > 0 && <div className="card"><b>Resultados</b>{res.map((x) => <div key={x.id} style={{ marginTop: 8 }}><button className={"btn " + (sel?.id === x.id ? "" : "g")} onClick={() => { setSel(x); setD(null); }}>{x.name}{x.nombre ? " · " + x.nombre : ""}{x.roblox ? " · Roblox " + x.roblox : ""}{x.tiktok ? " · @" + x.tiktok : ""}{x.chip ? " · " + x.chip : ""}</button></div>)}</div>}
    {sel && <form className="card" onSubmit={ver}><b>Revisar a {sel.name}</b><input value={razon} onChange={(e) => setRazon(e.target.value)} placeholder="Motivo obligatorio (ej.: reporte de un miembro por contenido +18 con un menor)" maxLength={300} /><button className="btn" disabled={busy || razon.trim().length < 10}>Abrir comunicaciones</button></form>}
    {d && <div className="card">
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>{d.user.avatar && <img src={d.user.avatar} alt="" width={56} height={56} style={{ borderRadius: 12 }} />}<div><b>{d.user.name}</b> {d.user.nombre && <>· {d.user.nombre}</>}<br /><small className="mut">Roblox: {d.user.roblox || "—"} · Tel: {d.user.chip || "—"} · TikTok: {d.user.tiktok ? "@" + d.user.tiktok : "—"}</small></div></div>
      <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>{[["wa", `WhatsApp (${cuenta.wa})`], ["tk", `Chats de TikTok (${cuenta.tk})`], ["act", `Publicaciones y comentarios (${d.posts.length + d.coms.length})`]].map(([k, t]) => <button key={k} className={"btn " + (tab === k ? "" : "g")} onClick={() => setTab(k)}>{t}</button>)}</div>
      <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar por texto dentro de las conversaciones" />
      <label style={{ display: "block", margin: "4px 0" }}><input type="checkbox" checked={alerta} onChange={(e) => setAlerta(e.target.checked)} style={{ width: "auto", marginRight: 6 }} />Resaltar palabras de alerta</label>
      {alerta && <input value={lista} onChange={(e) => setLista(e.target.value)} aria-label="Palabras de alerta separadas por comas" />}
      {tab === "wa" && <Chats lista={d.wa} pal={pal} filtro={filtro} vacio="Sin mensajes de WhatsApp." />}
      {tab === "tk" && <Chats lista={d.tk} pal={pal} filtro={filtro} vacio="Sin chats de TikTok." />}
      {tab === "act" && <div><b>Publicaciones</b>{!d.posts.length && <p className="mut">Ninguna.</p>}{d.posts.map((p) => <div key={p.id} style={{ marginTop: 8 }}><small className="mut">{hora(p.at)} · {p.tipo}</small><br /><Texto t={p.desc} pal={pal} /><br /><a href={p.url} target="_blank" rel="noreferrer">Ver archivo</a></div>)}
        <hr /><b>Comentarios</b>{!d.coms.length && <p className="mut">Ninguno.</p>}{d.coms.filter((c) => !filtro || (c.txt || "").toLowerCase().includes(filtro.toLowerCase())).map((c, i) => <div key={i} style={{ marginTop: 8 }}><small className="mut">{hora(c.at)}</small><br /><Texto t={c.txt} pal={pal} /></div>)}</div>}
    </div>}
  </div>);
}
