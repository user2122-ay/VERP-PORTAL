"use client";
import { useEffect, useRef, useState } from "react";
import { colorNum, rango, palo, COLORES } from "@/lib/juegos";
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`, FICHAS = [100, 250, 500, 1000, 2500, 5000];
const api = async (b) => { const x = await fetch("/api/casino/mesa", { method: "POST", body: JSON.stringify(b) }), j = await x.json().catch(() => ({})); return { ok: x.ok, j }; };
const CSS = `.mz{background:radial-gradient(circle at 50% 30%,#0f6b3a,#073d21);border:3px solid #ffc83d;border-radius:20px;padding:14px;box-shadow:0 0 24px #ffc83d44,inset 0 0 30px #0007;color:#fff}
.mz-n{border:1px solid #ffffff55;border-radius:6px;padding:8px 0;text-align:center;font-weight:800;cursor:pointer;user-select:none;font-size:14px}.mz-n:active{transform:scale(.95)}
.mz-c{width:54px;height:76px;border-radius:8px;background:#fff;color:#111;display:inline-grid;place-items:center;font-weight:900;font-size:22px;margin:3px;box-shadow:0 3px 8px #0008;animation:mz-d .35s ease-out}
.mz-c.r{color:#d11}.mz-c.b{background:repeating-linear-gradient(45deg,#7a1230,#7a1230 6px,#9b1c3f 6px,#9b1c3f 12px);color:transparent;border:2px solid #fff}
@keyframes mz-d{from{transform:translateY(-30px) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}
@keyframes mz-g{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.mz-h{position:absolute;font-size:28px;transform:scaleX(-1);transition:left .06s linear}.mz-h.run{animation:mz-g .18s infinite}`;
function Pagos({ metodos, pago, setPago, dep, setDep }) {
  return (<div className="card" style={{ marginTop: 12 }}><label className="mut">Pagar la apuesta con</label><select value={pago} onChange={(e) => setPago(e.target.value)}>{metodos.map((x) => <option key={x.k} value={x.k}>{x.label} · {$(x.saldo)}</option>)}</select>
    <label className="mut">Depositar los premios en</label><select value={dep} onChange={(e) => setDep(e.target.value)}>{metodos.map((x) => <option key={x.k} value={x.k}>{x.label} · {$(x.saldo)}</option>)}</select></div>);
}
const Cerrado = ({ ab }) => !ab && <div style={{ background: "#7f1d1d", border: "2px solid #ef4444", borderRadius: 12, padding: 10, textAlign: "center", fontWeight: 800, margin: "8px 0" }}>🔒 Casino cerrado por el momento: se quedó sin fondos.</div>;
const Resultado = ({ r }) => r && (r.profit > 0 ? <div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 900, color: "#ffc83d" }}>¡GANASTE {$(r.profit)}! 🪙</div><div style={{ fontSize: 13, opacity: 0.85 }}>{r.impuesto ? `Impuesto ${$(r.impuesto)} · recibes ${$(r.neto)}` : `Recibes ${$(r.neto)}`}</div></div> : r.profit === 0 ? <div style={{ textAlign: "center", fontWeight: 800 }}>Empate: te devuelven {$(r.neto)}{r.sinFondos ? " (el casino no tenía fondos para pagar el premio)" : ""}</div> : <div style={{ textAlign: "center", fontWeight: 800, opacity: 0.9 }}>Perdiste {$(-r.profit)}</div>);
function useEstado(p) { const [e, setE] = useState({ metodos: p.metodos, abierto: p.abierto, max: p.max }); const [pago, setPago] = useState("efectivo"), [dep, setDep] = useState("efectivo"); return { e, setE, pago, setPago, dep, setDep }; }

// ---------- RULETA ESPAÑOLA ----------
const RUEDA = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const COL = { rojo: "#c81e1e", negro: "#111", verde: "#0a8a3c" }, GRAD = `conic-gradient(${RUEDA.map((n, i) => `${COL[colorNum(n)]} ${(i * 100) / 37}% ${((i + 1) * 100) / 37}%`).join(",")})`;
const NOM = { rojo: "Rojo", negro: "Negro", par: "Par", impar: "Impar", bajo: "1-18", alto: "19-36" };
export function Ruleta(p) {
  const { e, setE, pago, setPago, dep, setDep } = useEstado(p), [ficha, setFicha] = useState(250), [ap, setAp] = useState([]), [ang, setAng] = useState(0), [gira, setGira] = useState(false), [res, setRes] = useState(null), [err, setErr] = useState(""), [hist, setHist] = useState([]);
  const total = ap.reduce((s, x) => s + x.m, 0), poner = (t, v = 0) => { if (gira) return; setRes(null); setAp((a) => { const i = a.findIndex((x) => x.t === t && x.v === v); return i >= 0 ? a.map((x, k) => (k === i ? { ...x, m: x.m + ficha } : x)) : [...a, { t, v, m: ficha }]; }); };
  const en = (t, v = 0) => ap.find((x) => x.t === t && x.v === v)?.m, chip = (t, v) => en(t, v) ? <span style={{ position: "absolute", top: -6, right: -6, background: "#ffc83d", color: "#222", borderRadius: 99, fontSize: 10, padding: "1px 5px", fontWeight: 900 }}>{en(t, v)}</span> : null;
  async function girar() {
    if (gira || !ap.length) return; setErr(""); setRes(null); setGira(true); setAng((a) => a + 720);
    const [r] = await Promise.all([api({ a: "ruleta", apuestas: ap, pago, deposito: dep }), new Promise((ok) => setTimeout(ok, 700))]);
    if (!r.ok) { setErr(r.j.error || "Error"); setGira(false); return; }
    const j = r.j, i = RUEDA.indexOf(j.num); setE({ metodos: j.metodos, abierto: j.abierto, max: j.max }); setAng((a) => Math.ceil(a / 360) * 360 + 360 * 4 - ((i + 0.5) * 360) / 37);
    await new Promise((ok) => setTimeout(ok, 4200)); setRes(j); setHist((h) => [j.num, ...h].slice(0, 12)); setGira(false); setAp([]);
  }
  const celda = (n) => <div key={n} className="mz-n" onClick={() => poner("num", n)} style={{ background: COL[colorNum(n)], position: "relative", gridColumn: n === 0 ? "1 / -1" : undefined }}>{n}{chip("num", n)}</div>;
  const ext = (t, v, txt, bg) => <div key={t + v} className="mz-n" onClick={() => poner(t, v)} style={{ background: bg || "#0006", position: "relative" }}>{txt}{chip(t, v)}</div>;
  return (<div style={{ maxWidth: 480, margin: "0 auto" }}><style>{CSS}</style>
    <h2 style={{ textAlign: "center", margin: "0 0 4px" }}>🎡 Ruleta Española</h2>
    <div className="mz"><div style={{ position: "relative", width: 230, height: 230, margin: "0 auto 8px" }}>
      <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", zIndex: 3, fontSize: 24 }}>🔻</div>
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: GRAD, border: "6px solid #ffc83d", boxShadow: "0 0 20px #000a", transition: gira ? "transform 4.6s cubic-bezier(.12,.6,.1,1)" : "none", transform: `rotate(${ang}deg)` }} />
      <div style={{ position: "absolute", inset: "30%", borderRadius: "50%", background: "#073d21", border: "4px solid #ffc83d", display: "grid", placeItems: "center", fontSize: 30, fontWeight: 900, color: "#fff" }}>{res ? res.num : gira ? "…" : "🎡"}</div></div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", minHeight: 24 }}>{hist.map((n, i) => <span key={i} style={{ background: COL[colorNum(n)], borderRadius: 6, padding: "1px 7px", fontSize: 12, fontWeight: 800 }}>{n}</span>)}</div>
      <div style={{ minHeight: 48, margin: "6px 0" }}>{res && (<><div style={{ textAlign: "center", fontSize: 18, fontWeight: 900 }}>Salió <span style={{ color: colorNum(res.num) === "negro" ? "#ccc" : colorNum(res.num) === "rojo" ? "#ff6b6b" : "#4ade80" }}>{res.num} {colorNum(res.num)}</span></div><Resultado r={res} /></>)}{err && <div style={{ color: "#ff8a95", fontWeight: 700, textAlign: "center" }}>{err}</div>}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 3 }}>{Array.from({ length: 37 }, (_, n) => celda(n))}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3, marginTop: 4 }}>{ext("doc", 1, "1ª docena (1-12)")}{ext("doc", 2, "2ª docena (13-24)")}{ext("doc", 3, "3ª docena (25-36)")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3, marginTop: 4 }}>{ext("col", 1, "Columna 1")}{ext("col", 2, "Columna 2")}{ext("col", 3, "Columna 3")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3, marginTop: 4 }}>{ext("bajo", 0, "1-18")}{ext("par", 0, "Par")}{ext("rojo", 0, "Rojo", COL.rojo)}{ext("negro", 0, "Negro", COL.negro)}{ext("impar", 0, "Impar")}{ext("alto", 0, "19-36")}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", margin: "10px 0 4px" }}>{FICHAS.filter((f) => f <= Math.max(e.max, 100)).map((f) => <button key={f} onClick={() => setFicha(f)} style={{ background: ficha === f ? "#ffc83d" : "#0006", color: ficha === f ? "#222" : "#fff", border: "2px solid #ffc83d", borderRadius: 99, padding: "6px 12px", fontWeight: 800, cursor: "pointer" }}>{f}</button>)}</div>
      <Cerrado ab={e.abierto} />
      {ap.length > 0 && <div style={{ fontSize: 12, opacity: 0.9, textAlign: "center" }}>{ap.map((x) => `${x.t === "num" ? "N°" + x.v : x.t === "doc" ? x.v + "ª docena" : x.t === "col" ? "Col " + x.v : NOM[x.t]} ${x.m}`).join(" · ")}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}><button className="btn g" disabled={gira || !ap.length} onClick={() => setAp([])} style={{ flex: 1 }}>Borrar</button>
        <button onClick={girar} disabled={!e.abierto || gira || !ap.length || total > e.max} style={{ flex: 3, padding: 14, fontSize: 18, fontWeight: 900, borderRadius: 14, border: 0, cursor: "pointer", background: "linear-gradient(180deg,#ffd85a,#e09a00)", color: "#3b0a1a", opacity: !e.abierto || gira || !ap.length || total > e.max ? 0.6 : 1 }}>{gira ? "Girando…" : `GIRAR · ${$(total)}`}</button></div>
      {total > e.max && <div style={{ color: "#ff8a95", fontSize: 12, textAlign: "center", marginTop: 4 }}>Máximo por giro: {$(e.max)}</div>}</div>
    <Pagos metodos={e.metodos} pago={pago} setPago={setPago} dep={dep} setDep={setDep} />
    <div className="mut" style={{ fontSize: 12, marginTop: 8 }}>Ruleta española: números 0 al 36 (un solo cero). Número exacto paga 35 a 1 · docena y columna 2 a 1 · rojo/negro, par/impar, 1-18/19-36 pagan 1 a 1. Toca las casillas para poner la ficha elegida. Mínimo $100 por apuesta. De la ganancia se paga {p.imp}% de impuesto.</div></div>);
}

// ---------- BLACKJACK ----------
const PALOS = "♠♥♦♣", RN = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const Carta = ({ c, oculta }) => oculta ? <span className="mz-c b">?</span> : <span className={"mz-c " + (palo(c) === 1 || palo(c) === 2 ? "r" : "")}><span style={{ textAlign: "center", lineHeight: 1 }}>{RN[rango(c)]}<br /><span style={{ fontSize: 20 }}>{PALOS[palo(c)]}</span></span></span>;
export function Blackjack(p) {
  const { e, setE, pago, setPago, dep, setDep } = useEstado(p), [monto, setMonto] = useState(500), [g, setG] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  useEffect(() => { api({ a: "bj_estado" }).then((r) => { if (r.ok) { setG(r.j.juego); setE({ metodos: r.j.metodos, abierto: r.j.abierto, max: r.j.max }); } }); }, []);
  async function acc(a) { if (busy) return; setBusy(true); setErr(""); const r = await api({ a, monto, pago, deposito: dep }); setBusy(false); if (!r.ok) return setErr(r.j.error || "Error"); setG(r.j.juego); setE({ metodos: r.j.metodos, abierto: r.j.abierto, max: r.j.max }); }
  const jugando = g && !g.fin, saldo = e.metodos.find((x) => x.k === pago)?.saldo ?? 0;
  return (<div style={{ maxWidth: 480, margin: "0 auto" }}><style>{CSS}</style>
    <h2 style={{ textAlign: "center", margin: "0 0 4px" }}>🃏 Blackjack</h2>
    <div className="mz" style={{ minHeight: 300 }}>
      <div style={{ opacity: 0.8, fontWeight: 800 }}>Casa {g ? (g.fin ? `· ${g.vc}` : "") : ""}</div><div style={{ minHeight: 84 }}>{g ? [...g.c.map((c, i) => <Carta key={i} c={c} />), ...(!g.fin ? [<Carta key="o" oculta />] : [])] : <span className="mut">Haz tu apuesta y reparte</span>}</div>
      <div style={{ opacity: 0.8, fontWeight: 800, marginTop: 8 }}>Tú {g ? `· ${g.vp}` : ""}{g?.doble ? " · doblada" : ""}</div><div style={{ minHeight: 84 }}>{g?.p.map((c, i) => <Carta key={i} c={c} />)}</div>
      {g?.fin && g.res && <div style={{ marginTop: 6 }}><Resultado r={g.res} />{g.vp > 21 && <div style={{ textAlign: "center", opacity: 0.8 }}>Te pasaste de 21</div>}{g.p.length === 2 && g.vp === 21 && <div style={{ textAlign: "center", color: "#ffc83d", fontWeight: 900 }}>¡BLACKJACK!</div>}</div>}
      {err && <div style={{ color: "#ff8a95", fontWeight: 700, textAlign: "center" }}>{err}</div>}
      <Cerrado ab={e.abierto || jugando} />
      {jugando ? <div style={{ display: "flex", gap: 8, marginTop: 10 }}><button className="btn" style={{ flex: 1 }} disabled={busy} onClick={() => acc("bj_pedir")}>Pedir</button><button className="btn g" style={{ flex: 1 }} disabled={busy} onClick={() => acc("bj_plantarse")}>Plantarse</button>{g.puedeDoblar && <button className="btn g" style={{ flex: 1 }} disabled={busy} onClick={() => acc("bj_doblar")}>Doblar</button>}</div> : <>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", margin: "10px 0 4px" }}>{FICHAS.filter((f) => f <= Math.max(e.max, 100)).map((f) => <button key={f} onClick={() => setMonto(f)} style={{ background: monto === f ? "#ffc83d" : "#0006", color: monto === f ? "#222" : "#fff", border: "2px solid #ffc83d", borderRadius: 99, padding: "6px 12px", fontWeight: 800, cursor: "pointer" }}>{f}</button>)}</div>
        <button onClick={() => acc("bj_start")} disabled={!e.abierto || busy || saldo < monto || monto > e.max} style={{ width: "100%", padding: 14, fontSize: 18, fontWeight: 900, borderRadius: 14, border: 0, cursor: "pointer", background: "linear-gradient(180deg,#ffd85a,#e09a00)", color: "#3b0a1a", opacity: !e.abierto || busy || saldo < monto || monto > e.max ? 0.6 : 1 }}>{g?.fin ? "Otra mano" : "Repartir"} · {$(monto)}</button></>}</div>
    <Pagos metodos={e.metodos} pago={pago} setPago={setPago} dep={dep} setDep={setDep} />
    <div className="mut" style={{ fontSize: 12, marginTop: 8 }}>Acércate a 21 sin pasarte. La casa se planta en 17. Blackjack (21 con dos cartas) paga 3 a 2; ganar paga 1 a 1; empate devuelve tu apuesta. “Doblar” duplica la apuesta y recibes una sola carta. De la ganancia se paga {p.imp}% de impuesto. Apuesta de $100 a {$(Math.max(e.max, 100))}.</div></div>);
}

// ---------- HIPÓDROMO ----------
export function Hipodromo(p) {
  const { e, setE, pago, setPago, dep, setDep } = useEstado(p), [card, setCard] = useState(null), [sel, setSel] = useState(null), [monto, setMonto] = useState(500), [pos, setPos] = useState([0, 0, 0, 0, 0, 0]), [corre, setCorre] = useState(false), [res, setRes] = useState(null), [err, setErr] = useState(""), iv = useRef();
  useEffect(() => () => clearInterval(iv.current), []);
  async function programa() { setErr(""); setRes(null); setSel(null); setPos([0, 0, 0, 0, 0, 0]); const r = await api({ a: "hip_card" }); if (!r.ok) return setErr(r.j.error || "Error"); setCard(r.j.card); setE({ metodos: r.j.metodos, abierto: r.j.abierto, max: r.j.max }); }
  useEffect(() => { programa(); }, []);
  async function correr() {
    if (corre || sel === null) return; setErr(""); const r = await api({ a: "hip_correr", caballo: sel, monto, pago, deposito: dep }); if (!r.ok) return setErr(r.j.error || "Error");
    const j = r.j; setCorre(true); let k = 0; iv.current = setInterval(() => { setPos(j.frames[Math.min(k, j.frames.length - 1)]); k++; if (k >= j.frames.length) { clearInterval(iv.current); setE({ metodos: j.metodos, abierto: j.abierto, max: j.max }); setRes(j); setCorre(false); } }, 55);
  }
  const saldo = e.metodos.find((x) => x.k === pago)?.saldo ?? 0, ok = !corre && sel !== null && !res && e.abierto && saldo >= monto && monto <= e.max;
  return (<div style={{ maxWidth: 520, margin: "0 auto" }}><style>{CSS}</style>
    <h2 style={{ textAlign: "center", margin: "0 0 4px" }}>🏇 Hipódromo VE:RP</h2>
    <div className="mz" style={{ background: "linear-gradient(180deg,#3d7a2a,#2a5a1c)" }}>
      <div style={{ position: "relative", background: "#c9a26a", borderRadius: 10, padding: "6px 0", border: "2px solid #7a5a2a" }}>
        {(card || []).map((c, i) => <div key={i} style={{ position: "relative", height: 42, borderBottom: i < 5 ? "1px dashed #7a5a2a88" : 0 }}>
          <span style={{ position: "absolute", left: 4, top: 12, fontSize: 11, fontWeight: 900, background: COLORES[i], borderRadius: 6, padding: "1px 6px", zIndex: 2 }}>{i + 1}</span>
          <span className={"mz-h" + (corre ? " run" : "")} style={{ left: `${4 + pos[i] * 80}%`, top: 4, filter: `drop-shadow(0 0 3px ${COLORES[i]})`, zIndex: 3 }}>🐎</span>
          <span style={{ position: "absolute", right: 6, top: 6, fontSize: 24 }}>{i === 0 ? "🏁" : ""}</span></div>)}
        <div style={{ position: "absolute", right: "8%", top: 0, bottom: 0, width: 4, background: "repeating-linear-gradient(#fff 0 8px,#111 8px 16px)" }} /></div>
      <div style={{ minHeight: 54, marginTop: 8 }}>{res && <><div style={{ textAlign: "center", fontWeight: 900 }}>🏆 Ganó #{res.ganador + 1} {card[res.ganador].n}{res.caballo === res.ganador ? " — ¡era tu caballo!" : ""}</div><Resultado r={res} /></>}{err && <div style={{ color: "#ff8a95", fontWeight: 700, textAlign: "center" }}>{err}</div>}</div>
      <div style={{ display: "grid", gap: 4 }}>{(card || []).map((c, i) => <button key={i} disabled={corre || !!res} onClick={() => setSel(i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 10, cursor: "pointer", border: sel === i ? "2px solid #ffc83d" : "2px solid #ffffff33", background: sel === i ? "#ffc83d33" : "#0005", color: "#fff", fontWeight: 700 }}><span><span style={{ background: COLORES[i], borderRadius: 6, padding: "1px 7px", marginRight: 8 }}>{i + 1}</span>{c.n}</span><span>paga x{c.cuota}</span></button>)}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", margin: "10px 0 4px" }}>{FICHAS.filter((f) => f <= Math.max(e.max, 100)).map((f) => <button key={f} disabled={corre || !!res} onClick={() => setMonto(f)} style={{ background: monto === f ? "#ffc83d" : "#0006", color: monto === f ? "#222" : "#fff", border: "2px solid #ffc83d", borderRadius: 99, padding: "6px 12px", fontWeight: 800, cursor: "pointer" }}>{f}</button>)}</div>
      <Cerrado ab={e.abierto} />
      {res ? <button onClick={programa} style={{ width: "100%", padding: 14, fontSize: 18, fontWeight: 900, borderRadius: 14, border: 0, cursor: "pointer", background: "linear-gradient(180deg,#ffd85a,#e09a00)", color: "#3b0a1a" }}>Nueva carrera</button>
        : <button onClick={correr} disabled={!ok} style={{ width: "100%", padding: 14, fontSize: 18, fontWeight: 900, borderRadius: 14, border: 0, cursor: "pointer", background: "linear-gradient(180deg,#ffd85a,#e09a00)", color: "#3b0a1a", opacity: ok ? 1 : 0.6 }}>{corre ? "¡Corriendo!…" : sel === null ? "Elige un caballo" : `🏇 APOSTAR ${$(monto)} al #${sel + 1}`}</button>}</div>
    <Pagos metodos={e.metodos} pago={pago} setPago={setPago} dep={dep} setDep={setDep} />
    <div className="mut" style={{ fontSize: 12, marginTop: 8 }}>Elige un caballo a ganador. Los favoritos pagan menos y los más difíciles pagan más. Si tu caballo gana cobras tu apuesta x la cuota; si no, la pierdes. De la ganancia se paga {p.imp}% de impuesto. Apuesta de $100 a {$(Math.max(e.max, 100))}.</div></div>);
}
