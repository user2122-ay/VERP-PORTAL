"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Eye, EyeOff, PiggyBank, Banknote, Repeat } from "lucide-react";
import { BANCOS, ESPERA_MIN } from "@/lib/bancos";
// Hook común: envía JSON a la API y muestra el resultado.
function useForm(url, okMsg) {
  const r = useRouter(), [err, setErr] = useState(""), [ok, setOk] = useState(""), [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault(); const f = e.target, b = Object.fromEntries(new FormData(f)); setBusy(true); setErr(""); setOk("");
    const x = await fetch(url, { method: "POST", body: JSON.stringify(b) }), j = await x.json().catch(() => ({}));
    setBusy(false); if (!x.ok) return setErr(j.error || "Error"); setOk(typeof okMsg === "function" ? okMsg(j) : okMsg); f.reset(); r.refresh();
  };
  return { err, ok, busy, send };
}
const Msg = ({ err, ok }) => <>{err && <p style={{ color: "var(--bad)" }}>{err}</p>}{ok && <p style={{ color: "var(--ok)" }}>{ok}</p>}</>;
const Sel = ({ name, list }) => <select name={name}>{list.map((k) => <option key={k} value={k}>{BANCOS[k].nombre}</option>)}</select>;
export function Deposito({ owned }) {
  const { err, ok, busy, send } = useForm("/api/banco/deposito", "Depósito realizado");
  return (<form className="card" onSubmit={send} style={{ marginTop: 14 }}><h3 style={{ margin: 0 }}>Depositar efectivo</h3>
    <label>A mi cuenta</label><Sel name="banco" list={owned} /><label>Monto ($)</label><input name="monto" type="number" min="1" required />
    <Msg err={err} ok={ok} /><button className="btn g" style={{ width: "100%" }} disabled={busy}><PiggyBank size={18} />Depositar</button></form>);
}
export function Retiro({ owned }) {
  const { err, ok, busy, send } = useForm("/api/banco/retiro", "Retiro realizado: el dinero ya está en tu efectivo");
  return (<form className="card" onSubmit={send} style={{ marginTop: 14 }}><h3 style={{ margin: 0 }}>Retirar dinero</h3>
    <label>De la tarjeta</label><Sel name="banco" list={owned} /><label>Monto ($)</label><input name="monto" type="number" min="1" required />
    <p className="mut">Puedes retirar de cualquiera de tus tarjetas (incluida la de Comerciante). El dinero llega a tu efectivo al instante.</p>
    <Msg err={err} ok={ok} /><button className="btn g" style={{ width: "100%" }} disabled={busy}><Banknote size={18} />Retirar</button></form>);
}
export default function Transfer({ owned, fee, inflacion, todas = owned }) {
  const [modo, setModo] = useState("otro"), [pre, setPre] = useState("V"), [num, setNum] = useState("");
  const { err, ok, busy, send } = useForm("/api/banco", (j) => j.espera ? `Enviada. Llegará en ${j.espera} minutos.` : "Transferencia enviada");
  const propio = modo === "propio", puedePropio = todas.length > 1, tab = (m, t, I) => <button type="button" className={"btn " + (modo === m ? "" : "g")} style={{ flex: 1, padding: "8px 10px", boxShadow: "none" }} onClick={() => setModo(m)}><I size={16} />{t}</button>;
  return (<form className="card" onSubmit={(e) => { send(e); setNum(""); }} style={{ marginTop: 14 }}><h3 style={{ margin: 0 }}>Pago móvil / Transferencia</h3>
    {puedePropio && <div style={{ display: "flex", gap: 8, margin: "10px 0 4px" }}>{tab("otro", "A otra persona", Send)}{tab("propio", "Entre mis tarjetas", Repeat)}</div>}
    <input type="hidden" name="modo" value={propio ? "propio" : "otro"} />
    <label>{propio ? "Desde mi tarjeta" : "Mi banco"}</label><Sel name="desde" list={propio ? todas : owned} />
    <label>{propio ? "Hacia mi tarjeta" : "Banco del destinatario"}</label><Sel name="hacia" list={propio ? todas : Object.keys(BANCOS).filter((k) => !BANCOS[k].comercial)} />
    {!propio && <><label>Cédula del destinatario</label>
      <div style={{ display: "flex", gap: 8 }}><select value={pre} onChange={(e) => setPre(e.target.value)} style={{ width: 76, flex: "none" }} aria-label="Tipo de documento"><option>V</option><option>E</option></select>
        <input value={num} onChange={(e) => setNum(e.target.value.replace(/[^\d.]/g, ""))} required inputMode="numeric" placeholder="00.000.002" autoComplete="off" /></div>
      <input type="hidden" name="cedula" value={num ? `${pre}-${num}` : ""} />
      <label>Usuario de Roblox</label><input name="roblox" required autoComplete="off" /></>}
    <label>Monto ($)</label><input name="monto" type="number" min="1" required />
    {!propio && <><label>Nota (opcional)</label><input name="nota" maxLength={60} />
      <p className="mut">Mismo banco: llega al instante, impuesto ${fee}. Entre bancos distintos: tarda {ESPERA_MIN} minutos, impuesto ${fee * 3}. Inflación del sistema: {inflacion}%.</p></>}
    {propio && <p className="mut">Mueves tu propio dinero entre tus tarjetas: llega al instante y sin impuesto.</p>}
    <Msg err={err} ok={ok} /><button className="btn" style={{ width: "100%" }} disabled={busy}>{propio ? <Repeat size={18} /> : <Send size={18} />}{busy ? "Enviando..." : propio ? "Mover dinero" : "Enviar"}</button></form>);
}
// CVC y fecha de validez ocultos; el ojito los pide al servidor y se vuelven a ocultar a los 15 s.
export function CardSecret({ b, mer, promo, oscuro }) {
  const [d, setD] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => { if (!d) return; const t = setTimeout(() => setD(null), 15000); return () => clearTimeout(t); }, [d]);
  const toggle = async () => { if (d) return setD(null); setBusy(true); const r = await fetch(`/api/banco/datos?b=${b}`); setBusy(false); if (r.ok) setD(await r.json()); };
  const L = { position: "absolute", whiteSpace: "nowrap", fontFamily: "Arial, sans-serif" }, t1 = mer ? "72%" : "64%", t2 = mer ? "77%" : "69%", x1 = mer ? "8%" : "5%", x2 = mer ? "28%" : "26%";
  const lb = { ...L, top: t1, fontSize: "2.6cqw", color: mer ? "#cfe0f7" : "#4b5b70", fontWeight: 600 }, vl = { ...L, top: t2, fontSize: "3.8cqw", color: mer ? "#fff" : "#0a1f3a", fontWeight: 700 };
  return (<><div style={{ ...lb, left: x1 }}>CVC</div><div style={{ ...lb, left: x2 }}>VÁLIDA HASTA</div>
    <div style={{ ...vl, left: x1 }}>{d ? d.cvc : "•••"}</div><div style={{ ...vl, left: x2 }}>{d ? d.venc : "••/••"}</div>
    {!promo && <button onClick={toggle} disabled={busy} aria-label="Mostrar u ocultar CVC y fecha" style={{ position: "absolute", right: "5%", top: "7%", background: oscuro ? "#00000022" : "#ffffff30", border: 0, color: oscuro ? "#222" : "#fff", borderRadius: 999, width: "9cqw", height: "9cqw", display: "grid", placeItems: "center", cursor: "pointer" }}>{d ? <EyeOff size={18} /> : <Eye size={18} />}</button>}</>);
}
