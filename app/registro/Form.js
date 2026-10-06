"use client";
import { useState } from "react";
import { UserPlus, ShieldCheck, Copy, Check, RefreshCw } from "lucide-react";
const LUGARES = ["Caracas", "La Guaira", "El Ávila"], ESTADOS = ["Soltero", "Casado", "Divorciado", "Viudo"];
const post = async (u, b) => { const r = await fetch(u, { method: "POST", body: JSON.stringify(b || {}) }); return { ok: r.ok, ...(await r.json().catch(() => ({}))) }; };
// pasos: 1 usuario Roblox · 2 código en la bio · 3 confirmar avatar · 4 datos de la cédula
export default function Form({ discord, initial }) {
  const [step, setStep] = useState(initial ? (initial.ok ? 3 : 2) : 1);
  const [v, setV] = useState(initial || {});
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [copied, setCopied] = useState(false), [ven, setVen] = useState("si");
  const run = async (fn) => { setBusy(true); setErr(""); try { await fn(); } finally { setBusy(false); } };
  const start = (e) => { e.preventDefault(); const roblox = new FormData(e.target).get("roblox"); run(async () => { const r = await post("/api/verify/start", { roblox }); r.ok ? (setV({ code: r.code, robloxName: r.robloxName }), setStep(2)) : setErr(r.error); }); };
  const check = () => run(async () => { const r = await post("/api/verify/check"); r.ok ? (setV((x) => ({ ...x, ok: true, avatar: r.avatar, robloxName: r.robloxName })), setStep(3)) : setErr(r.error); });
  const copy = () => { navigator.clipboard?.writeText(v.code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const send = (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); run(async () => { const r = await post("/api/cedula", { ...f, venezolano: true }); r.ok ? (location.href = "/cedula") : setErr(r.error); }); };
  const Err = () => err ? <p style={{ color: "var(--bad)" }}>{err}</p> : null;
  const dots = <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>{[1, 2, 3, 4].map((n) => <div key={n} style={{ flex: 1, height: 4, borderRadius: 4, background: n <= step ? "var(--ac)" : "var(--bd)" }} />)}</div>;

  if (step === 1) return (<form className="card" onSubmit={start}>{dots}<h2>Verifica tu identidad</h2>
    <p className="mut">Discord: <b>{discord}</b>. Ahora indica tu usuario de Roblox para comprobar que la cuenta es tuya.</p>
    <label>Usuario de Roblox</label><input name="roblox" required minLength={3} maxLength={20} autoComplete="off" placeholder="Tu nombre de usuario (no el de pantalla)" />
    <Err /><button className="btn" style={{ width: "100%" }} disabled={busy}><ShieldCheck size={18} />{busy ? "Buscando..." : "Continuar"}</button></form>);

  if (step === 2) return (<div className="card">{dots}<h2>Pon este código en tu biografía</h2>
    <p className="mut">En Roblox, entra a tu perfil, edita la descripción (“About”) y pega el código. Guarda y vuelve aquí.</p>
    <div style={{ fontFamily: "monospace", fontSize: 26, textAlign: "center", color: "var(--ac)", padding: 14, border: "1px dashed var(--bd)", borderRadius: 12, margin: "10px 0" }}>{v.code}</div>
    <button className="btn g" style={{ width: "100%", marginBottom: 8 }} onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copiado" : "Copiar código"}</button>
    <Err /><button className="btn" style={{ width: "100%" }} onClick={check} disabled={busy}><ShieldCheck size={18} />{busy ? "Verificando..." : "Ya lo puse, verificar"}</button>
    <button className="btn g" style={{ width: "100%", marginTop: 8 }} onClick={() => { setErr(""); setStep(1); }}><RefreshCw size={16} />Cambiar usuario de Roblox</button></div>);

  if (step === 3) return (<div className="card" style={{ textAlign: "center" }}>{dots}<h2>¿Este eres tú?</h2>
    <p className="mut">Cuenta verificada: <b>{v.robloxName}</b>. Esta imagen irá en tu cédula.</p>
    <div style={{ background: "#fff", borderRadius: 14, width: 180, height: 180, margin: "10px auto", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {v.avatar ? <img src={v.avatar} alt="Avatar de Roblox" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#555" }}>Sin imagen</span>}</div>
    <button className="btn" style={{ width: "100%" }} onClick={() => setStep(4)}><Check size={18} />Sí, soy yo</button>
    <button className="btn g" style={{ width: "100%", marginTop: 8 }} onClick={() => { setErr(""); setStep(1); }}>No, usar otra cuenta</button></div>);

  return (<form className="card" onSubmit={send}>{dots}<h2>Crea tu cédula</h2>
    <label>¿Eres venezolano?</label><select value={ven} onChange={(e) => setVen(e.target.value)}><option value="si">Sí, soy venezolano</option><option value="no">No, soy extranjero</option></select>
    {ven === "no" ? <p style={{ color: "var(--bad)" }}>Los extranjeros deben tramitar su <b>visa</b> (visación) con el staff en el Discord antes de poder obtener cédula.</p> : <>
      <label>Nombres</label><input name="nombres" required maxLength={40} /><label>Apellidos</label><input name="apellidos" required maxLength={40} />
      <label>Fecha de nacimiento</label><input name="nac" type="date" required />
      <label>¿Dónde naciste?</label><select name="lugar" required>{LUGARES.map((l) => <option key={l}>{l}</option>)}</select>
      <label>Estado civil</label><select name="edoCivil" required>{ESTADOS.map((l) => <option key={l}>{l}</option>)}</select>
      <Err /><button className="btn" style={{ width: "100%" }} disabled={busy}><UserPlus size={18} />{busy ? "Creando..." : "Crear cédula"}</button></>}</form>);
}
