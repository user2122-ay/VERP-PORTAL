"use client";
import { useState } from "react";
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
const post = async (a, data) => { const r = await fetch("/api/admin", { method: "POST", body: JSON.stringify({ a, ...data }) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return false; } return true; };
const vals = (e) => { e.preventDefault(); return Object.fromEntries(new FormData(e.target, e.nativeEvent?.submitter)); };
function Linea({ datos, claves, colores, nombres }) {
  const W = 520, H = 190, P = 6; if (datos.length < 2) return <p className="mut">Todavía no hay suficientes datos (se guarda una foto cada hora cuando alguien entra).</p>;
  const todos = datos.flatMap((d) => claves.map((k) => d[k])), hi = Math.max(...todos), lo = Math.min(...todos, 0), x = (i) => P + (i * (W - 2 * P)) / (datos.length - 1), y = (v) => H - P - ((v - lo) / (hi - lo || 1)) * (H - 2 * P - 14);
  return (<><svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", background: "#0a1020", borderRadius: 10 }}>{[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={W} y1={P + (i * (H - 2 * P - 14)) / 3 + 14} y2={P + (i * (H - 2 * P - 14)) / 3 + 14} stroke="#ffffff12" />)}
    {claves.map((k, c) => <polyline key={k} fill="none" stroke={colores[c]} strokeWidth="2" points={datos.map((d, i) => `${x(i)},${y(d[k])}`).join(" ")} />)}<text x="6" y="12" fill="#9fb0d0" fontSize="10">{$(hi)}</text></svg>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, margin: "4px 0 10px" }}>{claves.map((k, c) => <span key={k}><b style={{ color: colores[c] }}>●</b> {nombres[c]}</span>)}<span className="mut">{new Date(datos[0].at).toLocaleDateString("es")} → {new Date(datos.at(-1).at).toLocaleDateString("es")}</span></div></>);
}
function Barras({ datos }) {
  const W = 520, H = 190, P = 18; if (!datos.length) return <p className="mut">Sin movimientos todavía.</p>;
  const mx = Math.max(...datos.flatMap((d) => [d.casinoIn + d.tradingIn, d.casinoOut + d.tradingOut]), 1), bw = (W - 2 * P) / datos.length;
  return (<><svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", background: "#0a1020", borderRadius: 10 }}>{datos.map((d, i) => { const e = d.casinoIn + d.tradingIn, s = d.casinoOut + d.tradingOut, h = (v) => (v / mx) * (H - 2 * P - 8); return <g key={d.dia}><rect x={P + i * bw + 2} width={bw / 2 - 3} y={H - P - h(e)} height={h(e)} fill="#22c55e" /><rect x={P + i * bw + bw / 2} width={bw / 2 - 3} y={H - P - h(s)} height={h(s)} fill="#ef4444" /><text x={P + i * bw + bw / 2} y={H - 4} fill="#9fb0d0" fontSize="8" textAnchor="middle">{d.dia.slice(5)}</text></g>; })}<text x="4" y="12" fill="#9fb0d0" fontSize="10">{$(mx)}</text></svg>
    <div style={{ fontSize: 12, margin: "4px 0 10px" }}><b style={{ color: "#22c55e" }}>●</b> entra a la reserva (apuestas perdidas y compras) · <b style={{ color: "#ef4444" }}>●</b> sale de la reserva (premios y ventas)</div></>);
}
export default function Economia({ eco }) {
  const m = eco.masa, usado = eco.cfg.tope > 0 ? Math.min(100, (m.total / eco.cfg.tope) * 100) : null, [busy, setBusy] = useState(false);
  const go = async (a, e, extra = {}) => { const v = { ...vals(e), ...extra }; setBusy(true); const ok = await post(a, v); setBusy(false); if (ok) { alert("Guardado"); location.reload(); } };
  return (<div style={{ display: "grid", gap: 12 }}>
    <div className="card"><b>Masa monetaria (todo el dinero del juego)</b>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, margin: "8px 0" }}>{[["Efectivo de usuarios", m.ef], ["En tarjetas", m.ct], ["Tesorería", m.tes], ["Reserva (casino/trading)", m.res]].map(([t, v]) => <div key={t} style={{ background: "#ffffff0d", padding: 10, borderRadius: 10 }}><div className="mut" style={{ fontSize: 12 }}>{t}</div><b style={{ fontSize: 17 }}>{$(v)}</b></div>)}</div>
      <div style={{ fontSize: 18 }}>Total en circulación: <b>{$(m.total)}</b>{eco.cfg.tope > 0 ? <> de un tope de <b>{$(eco.cfg.tope)}</b> ({usado.toFixed(1)}%)</> : <span className="mut"> · sin tope configurado</span>}</div>
      {usado !== null && <div style={{ height: 10, background: "#ffffff1a", borderRadius: 99, marginTop: 6 }}><div style={{ width: usado + "%", height: "100%", borderRadius: 99, background: usado > 90 ? "#ef4444" : usado > 70 ? "#f59e0b" : "#22c55e" }} /></div>}
      <div className="mut" style={{ fontSize: 12, marginTop: 6 }}>Inflación actual: <b>{eco.cfg.inflacion}%</b> (con 50% o más la transferencia entre usuarios cuesta $2 en vez de $1). El casino y el trading solo mueven dinero que ya existe: lo que se pierde entra a la reserva y los premios salen de ella.</div></div>
    <div className="card"><b>Masa monetaria en el tiempo</b><Linea datos={eco.serie} claves={["total", "res", "tes"]} colores={["#60a5fa", "#f59e0b", "#a78bfa"]} nombres={["Total", "Reserva", "Tesorería"]} />
      <b>Inflación registrada</b><Linea datos={eco.serie} claves={["inf"]} colores={["#ef4444"]} nombres={["Inflación %"]} />
      <b>Movimiento de la reserva (últimos 14 días)</b><Barras datos={eco.dias} /></div>
    <div className="card"><b>Ajustes de economía</b>
      <form onSubmit={(e) => go("ecoSet", e)}><label className="mut">Inflación (%)</label><input name="inflacion" type="number" min="0" max="1000" step="0.1" defaultValue={eco.cfg.inflacion} />
        <label className="mut">Tope de dinero en circulación (0 = sin tope). Si lo pasas, Administración ya no puede crear más dinero con "Dar dinero".</label><input name="tope" type="number" min="0" defaultValue={eco.cfg.tope} />
        <label className="mut">Impuesto a las ganancias del casino y trading (%)</label><input name="impGan" type="number" min="0" max="100" step="0.5" defaultValue={eco.cfg.impGan} />
        <label className="mut">Casino</label><select name="casino" defaultValue={eco.cfg.casino}><option value="beta">Beta (solo Developer y Fundación)</option><option value="abierto">Abierto para todos con teléfono</option></select>
        <label className="mut">Trading</label><select name="trading" defaultValue={eco.cfg.trading}><option value="beta">Beta (solo Developer y Fundación)</option><option value="abierto">Abierto para todos con teléfono</option></select>
        <input name="razon" placeholder="Razón (obligatoria)" required minLength={3} /><button className="btn" disabled={busy} style={{ width: "100%" }}>Guardar ajustes</button></form></div>
    <div className="card"><b>Mover dinero entre Tesorería y Reserva</b><p className="mut">El dinero no se crea: sale de un lado y entra al otro. Reserva ahora: <b>{$(m.res)}</b> · Tesorería: <b>{$(m.tes)}</b>.</p>
      <form onSubmit={(e) => go("ecoMover", e)}><select name="dir"><option value="tes2res">Tesorería → Reserva</option><option value="res2tes">Reserva → Tesorería</option></select><input name="monto" type="number" min="1" required placeholder="Monto" /><input name="razon" placeholder="Razón (obligatoria)" required minLength={3} /><button className="btn" disabled={busy} style={{ width: "100%" }}>Mover</button></form></div></div>);
}
