"use client";
import { useEffect, useRef, useState } from "react";
import { SIMBOLOS, APUESTAS, TABLA } from "@/lib/casino";
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
const rnd = () => Math.floor(Math.random() * SIMBOLOS.length);
// Tragamonedas animada: los rodillos giran, se detienen uno por uno y, si ganas, caen monedas.
export default function Casino({ metodos: m0, imp, beta }) {
  const [metodos, setMetodos] = useState(m0), [monto, setMonto] = useState(500), [pago, setPago] = useState("efectivo"), [dep, setDep] = useState("efectivo"), [rod, setRod] = useState([0, 1, 2]), [giro, setGiro] = useState([false, false, false]), [res, setRes] = useState(null), [lluvia, setLluvia] = useState(0), [busy, setBusy] = useState(false), [err, setErr] = useState(""), iv = useRef();
  useEffect(() => () => clearInterval(iv.current), []);
  const saldo = metodos.find((x) => x.k === pago)?.saldo ?? 0;
  async function jugar() {
    if (busy) return; setErr(""); setRes(null); setBusy(true); setGiro([true, true, true]);
    iv.current = setInterval(() => setRod((r) => r.map((x, i) => (giro_ref.current[i] ? rnd() : x))), 70); giro_ref.current = [true, true, true];
    const [r] = await Promise.all([fetch("/api/casino", { method: "POST", body: JSON.stringify({ monto, pago, deposito: dep }) }).then(async (x) => ({ ok: x.ok, j: await x.json().catch(() => ({})) })), new Promise((ok) => setTimeout(ok, 1100))]);
    if (!r.ok) { clearInterval(iv.current); giro_ref.current = [false, false, false]; setGiro([false, false, false]); setErr(r.j.error || "Error"); setBusy(false); return; }
    const j = r.j; setMetodos(j.metodos);
    for (let i = 0; i < 3; i++) { await new Promise((ok) => setTimeout(ok, i ? 550 : 0)); giro_ref.current[i] = false; setRod((x) => x.map((v, k) => (k === i ? j.reels[i] : v))); setGiro((g) => g.map((v, k) => (k === i ? false : v))); }
    clearInterval(iv.current); setRes(j); if (j.premio > 0) setLluvia((n) => n + 1); setBusy(false);
  }
  const giro_ref = useRef([false, false, false]);
  return (<div style={{ maxWidth: 460, margin: "0 auto" }}>
    <style>{`.cs-m{background:linear-gradient(180deg,#7a1230,#3b0a1a);border:3px solid #ffc83d;border-radius:22px;padding:18px;box-shadow:0 0 28px #ffc83d55,inset 0 0 30px #0008;position:relative;overflow:hidden}
.cs-r{display:flex;gap:10px;justify-content:center;background:#0b0b12;border:3px solid #ffc83d;border-radius:14px;padding:12px}
.cs-c{width:30%;aspect-ratio:.9;background:linear-gradient(180deg,#d8d8e6,#fff 40%,#d8d8e6);border-radius:10px;display:grid;place-items:center;font-size:clamp(42px,14vw,66px);overflow:hidden;box-shadow:inset 0 0 14px #0006}
.cs-c.g span{filter:blur(2px);animation:cs-v .14s linear infinite}.cs-c.f span{animation:cs-r .35s ease-out}
@keyframes cs-v{from{transform:translateY(-14px)}to{transform:translateY(14px)}}@keyframes cs-r{0%{transform:translateY(-40px) scale(.7)}60%{transform:translateY(6px) scale(1.15)}100%{transform:none}}
.cs-co{position:absolute;top:-40px;font-size:26px;animation:cs-f 1.9s ease-in forwards;pointer-events:none;z-index:5}
@keyframes cs-f{to{transform:translateY(520px) rotate(720deg);opacity:.9}}
.cs-luz{animation:cs-l .5s infinite alternate}@keyframes cs-l{from{opacity:.4}to{opacity:1}}`}</style>
    <h2 style={{ textAlign: "center", margin: "0 0 4px" }}>🎰 Casino VE:RP</h2>{beta && <div style={{ textAlign: "center" }}><span className="tag">BETA · solo Developer y Fundación</span></div>}
    <div className="cs-m" style={{ marginTop: 10 }}>
      {lluvia > 0 && res?.premio > 0 && Array.from({ length: 28 }).map((_, i) => <span key={lluvia + "-" + i} className="cs-co" style={{ left: `${(i * 37) % 96}%`, animationDelay: `${(i % 9) * 0.12}s` }}>🪙</span>)}
      <div style={{ textAlign: "center", color: "#ffc83d", fontWeight: 900, letterSpacing: 3, marginBottom: 8 }}><span className={busy ? "cs-luz" : ""}>★ TRAGAMONEDAS ★</span></div>
      <div className="cs-r">{rod.map((s, i) => <div key={i} className={"cs-c " + (giro[i] ? "g" : res ? "f" : "")}><span key={giro[i] ? "g" : s + "-" + (res ? 1 : 0)}>{SIMBOLOS[s]}</span></div>)}</div>
      <div style={{ minHeight: 56, textAlign: "center", marginTop: 10 }}>
        {res && (res.premio > 0 ? <div><div style={{ fontSize: 22, fontWeight: 900, color: "#ffc83d" }}>¡GANASTE {$(res.premio)}! 🪙</div><div style={{ fontSize: 13, opacity: 0.85 }}>x{res.mult}{res.impuesto ? ` · impuesto a la ganancia ${$(res.impuesto)} · recibes ${$(res.neto)}` : ""}</div></div> : <div style={{ fontSize: 16, opacity: 0.85 }}>{res.sinFondos ? "La máquina no tiene fondos para pagar premios ahora. Perdiste la apuesta." : "Sin suerte esta vez. Sigue intentando…"}</div>)}
        {err && <div style={{ color: "#ff8a95", fontWeight: 700 }}>{err}</div>}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", margin: "6px 0" }}>{APUESTAS.map((a) => <button key={a} disabled={busy} onClick={() => setMonto(a)} style={{ background: monto === a ? "#ffc83d" : "#0006", color: monto === a ? "#3b0a1a" : "#fff", border: "2px solid #ffc83d", borderRadius: 99, padding: "6px 12px", fontWeight: 800, cursor: "pointer" }}>{$(a)}</button>)}</div>
      <button onClick={jugar} disabled={busy || saldo < monto} style={{ width: "100%", marginTop: 8, padding: 16, fontSize: 20, fontWeight: 900, borderRadius: 14, border: 0, cursor: "pointer", background: "linear-gradient(180deg,#ffd85a,#e09a00)", color: "#3b0a1a", opacity: busy || saldo < monto ? 0.6 : 1 }}>{busy ? "Girando…" : `🎰 GIRAR · ${$(monto)}`}</button></div>
    <div className="card" style={{ marginTop: 12 }}>
      <label className="mut">Pagar la apuesta con</label><select value={pago} onChange={(e) => setPago(e.target.value)}>{metodos.map((x) => <option key={x.k} value={x.k}>{x.label} · {$(x.saldo)}</option>)}</select>
      <label className="mut">Depositar los premios en</label><select value={dep} onChange={(e) => setDep(e.target.value)}>{metodos.map((x) => <option key={x.k} value={x.k}>{x.label} · {$(x.saldo)}</option>)}</select>
      <div className="mut" style={{ fontSize: 12, marginTop: 8 }}>Premios: 🍒🍒🍒 x2 · 🔔🔔🔔 x4 · ⭐⭐⭐ x8 · 7️⃣7️⃣7️⃣ x20 · 💎💎💎 x50. Ganar es muy difícil. De la ganancia se paga {imp}% de impuesto al Estado. Apuesta de {$(APUESTAS[0])} a {$(APUESTAS.at(-1))}. Juega con responsabilidad.</div></div></div>);
}
