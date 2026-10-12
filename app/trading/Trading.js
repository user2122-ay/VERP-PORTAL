"use client";
import { useEffect, useState } from "react";
import { ACTIVOS, precio, velas, MIN_COMPRA, MAX_COMPRA } from "@/lib/trading";
const $ = (n, d = 0) => `$${Number(n || 0).toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const FR = { "2 h": [5, 24], "12 h": [30, 24], "3 días": [180, 24] };
function Velas({ k, fr, ahora }) {
  const [min, n] = FR[fr], v = velas(k, min, n, ahora), W = 360, H = 190, hi = Math.max(...v.map((x) => x.h)), lo = Math.min(...v.map((x) => x.l)), y = (p) => 8 + ((hi - p) / (hi - lo || 1)) * (H - 16), w = W / n;
  return (<svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", background: "#0a1020", borderRadius: 10 }}>{[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={W} y1={8 + (i * (H - 16)) / 3} y2={8 + (i * (H - 16)) / 3} stroke="#ffffff14" />)}
    {v.map((x, i) => { const up = x.c >= x.o, c = up ? "#22c55e" : "#ef4444"; return <g key={i}><line x1={i * w + w / 2} x2={i * w + w / 2} y1={y(x.h)} y2={y(x.l)} stroke={c} /><rect x={i * w + 1.5} width={w - 3} y={y(Math.max(x.o, x.c))} height={Math.max(1.5, Math.abs(y(x.o) - y(x.c)))} fill={c} /></g>; })}
    <text x="4" y="14" fill="#9fb0d0" fontSize="9">{$(hi, 2)}</text><text x="4" y={H - 4} fill="#9fb0d0" fontSize="9">{$(lo, 2)}</text></svg>);
}
export default function Trading({ metodos: m0, hold: h0, imp, beta }) {
  const [metodos, setMetodos] = useState(m0), [hold, setHold] = useState(h0), [k, setK] = useState("VEBTC"), [fr, setFr] = useState("2 h"), [ahora, setAhora] = useState(Date.now()), [monto, setMonto] = useState(1000), [qty, setQty] = useState(""), [pago, setPago] = useState("efectivo"), [dep, setDep] = useState("efectivo"), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 15000); return () => clearInterval(t); }, []);
  const a = ACTIVOS[k], px = precio(k, ahora), ayer = precio(k, ahora - 864e5), cambio = ((px - ayer) / ayer) * 100, h = hold[k];
  const total = Object.entries(hold).reduce((s, [x, v]) => s + (v?.q || 0) * precio(x, ahora), 0), costoT = Object.values(hold).reduce((s, v) => s + (v?.costo || 0), 0);
  async function op(b) {
    setBusy(true); setMsg(""); const r = await fetch("/api/trading", { method: "POST", body: JSON.stringify({ activo: k, pago, deposito: dep, ...b }) }), j = await r.json().catch(() => ({})); setBusy(false);
    if (!r.ok) return setMsg("⚠️ " + (j.error || "Error")); setMetodos(j.metodos); setHold(j.hold); setMsg("✅ " + j.msg); setQty("");
  }
  return (<div style={{ maxWidth: 520, margin: "0 auto" }}>
    <h2 style={{ textAlign: "center", margin: "0 0 4px" }}>📈 Trading VE:RP</h2>{beta && <div style={{ textAlign: "center" }}><span className="tag">BETA · solo Developer y Fundación</span></div>}
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>{Object.entries(ACTIVOS).map(([x, v]) => { const p = precio(x, ahora), c = ((p - precio(x, ahora - 864e5)) / precio(x, ahora - 864e5)) * 100; return <button key={x} className={"btn " + (k === x ? "" : "g")} style={{ flex: "1 1 110px", flexDirection: "column", gap: 0, padding: "8px 6px" }} onClick={() => setK(x)}><b>{v.ic} {x}</b><span style={{ fontSize: 12 }}>{$(p, 2)} <span style={{ color: c >= 0 ? "#22c55e" : "#ef4444" }}>{c >= 0 ? "▲" : "▼"}{Math.abs(c).toFixed(1)}%</span></span></button>; })}</div>
    <div className="card"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><div><b style={{ fontSize: 17 }}>{a.ic} {a.n}</b><div className="mut" style={{ fontSize: 12 }}>{k}</div></div><div style={{ textAlign: "right" }}><b style={{ fontSize: 24 }}>{$(px, 2)}</b><div style={{ color: cambio >= 0 ? "#22c55e" : "#ef4444", fontSize: 13 }}>{cambio >= 0 ? "▲" : "▼"} {Math.abs(cambio).toFixed(2)}% en 24 h</div></div></div>
      <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>{Object.keys(FR).map((x) => <button key={x} className={"btn " + (fr === x ? "" : "g")} style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setFr(x)}>{x}</button>)}</div>
      <Velas k={k} fr={fr} ahora={ahora} /></div>
    <div className="card"><b>Operar {k}</b>
      <label className="mut">Pagar las compras con</label><select value={pago} onChange={(e) => setPago(e.target.value)}>{metodos.map((x) => <option key={x.k} value={x.k}>{x.label} · {$(x.saldo)}</option>)}</select>
      <label className="mut">Depositar lo que vendas en</label><select value={dep} onChange={(e) => setDep(e.target.value)}>{metodos.map((x) => <option key={x.k} value={x.k}>{x.label} · {$(x.saldo)}</option>)}</select>
      <label className="mut">Comprar (monto en dólares)</label><div className="row2"><input type="number" min={MIN_COMPRA} max={MAX_COMPRA} value={monto} onChange={(e) => setMonto(e.target.value)} /><button className="btn" disabled={busy} onClick={() => op({ accion: "comprar", monto })}>Comprar</button></div>
      <div className="mut" style={{ fontSize: 12 }}>≈ {(monto / px).toFixed(6)} {k}</div>
      <label className="mut">Vender (cantidad de {k}) — tienes {h?.q ? h.q : 0}</label><div className="row2"><input type="number" step="any" min="0" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="cantidad" /><button className="btn g" disabled={busy || !h?.q || !(Number(qty) > 0)} onClick={() => op({ accion: "vender", qty })}>Vender</button></div>
      <button className="btn g" style={{ width: "100%", marginTop: 6 }} disabled={busy || !h?.q} onClick={() => confirm(`¿Vender todo tu ${k}?`) && op({ accion: "vender", todo: true })}>Vender todo mi {k}</button>
      {msg && <div style={{ marginTop: 8, fontWeight: 700, wordBreak: "break-word" }}>{msg}</div>}
      <div className="mut" style={{ fontSize: 12, marginTop: 6 }}>Sin comisión. De la ganancia al vender se paga {imp}% de impuesto al Estado. El dinero de las compras entra a la reserva y las ventas se pagan desde la reserva.</div></div>
    <div className="card"><b>Mi cartera</b>{Object.entries(hold).filter(([, v]) => v?.q > 0).map(([x, v]) => { const val = v.q * precio(x, ahora), gp = val - (v.costo || 0); return <div key={x} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--bd)", cursor: "pointer" }} onClick={() => setK(x)}><div><b>{ACTIVOS[x].ic} {x}</b><div className="mut" style={{ fontSize: 12 }}>{v.q} · costo {$(v.costo)}</div></div><div style={{ textAlign: "right" }}><b>{$(val)}</b><div style={{ fontSize: 12, color: gp >= 0 ? "#22c55e" : "#ef4444" }}>{gp >= 0 ? "+" : ""}{$(gp)}</div></div></div>; })}
      {!Object.values(hold).some((v) => v?.q > 0) && <p className="mut">Aún no tienes inversiones.</p>}
      {total > 0 && <div style={{ borderTop: "1px solid var(--bd)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}><span>Total invertido hoy</span><b>{$(total)} <span style={{ color: total - costoT >= 0 ? "#22c55e" : "#ef4444", fontSize: 12 }}>({total - costoT >= 0 ? "+" : ""}{$(total - costoT)})</span></b></div>}</div></div>);
}
