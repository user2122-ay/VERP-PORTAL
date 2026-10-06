"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Eye, EyeOff, PiggyBank } from "lucide-react";
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
export default function Transfer({ owned, fee, inflacion }) {
  const { err, ok, busy, send } = useForm("/api/banco", (j) => j.espera ? `Enviada. Llegará en ${j.espera} minutos.` : "Transferencia enviada");
  return (<form className="card" onSubmit={send} style={{ marginTop: 14 }}><h3 style={{ margin: 0 }}>Pago móvil / Transferencia</h3>
    <label>Mi banco</label><Sel name="desde" list={owned} />
    <label>Banco del destinatario</label><Sel name="hacia" list={Object.keys(BANCOS)} />
    <label>Cédula del destinatario</label><input name="cedula" required inputMode="numeric" placeholder="V-00.000.002" autoComplete="off" />
    <label>Usuario de Roblox</label><input name="roblox" required autoComplete="off" />
    <label>Monto ($)</label><input name="monto" type="number" min="1" required />
    <label>Nota (opcional)</label><input name="nota" maxLength={60} />
    <p className="mut">Mismo banco: llega al instante, impuesto ${fee}. Entre bancos distintos: tarda {ESPERA_MIN} minutos, impuesto ${fee * 3}. Inflación del sistema: {inflacion}%.</p>
    <Msg err={err} ok={ok} /><button className="btn" style={{ width: "100%" }} disabled={busy}><Send size={18} />{busy ? "Enviando..." : "Enviar"}</button></form>);
}
// CVC y fecha de validez ocultos; el ojito los pide al servidor y se vuelven a ocultar a los 15 s.
export function CardSecret({ b, mer }) {
  const [d, setD] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => { if (!d) return; const t = setTimeout(() => setD(null), 15000); return () => clearTimeout(t); }, [d]);
  const toggle = async () => { if (d) return setD(null); setBusy(true); const r = await fetch(`/api/banco/datos?b=${b}`); setBusy(false); if (r.ok) setD(await r.json()); };
  const L = { position: "absolute", whiteSpace: "nowrap", fontFamily: "Arial, sans-serif" }, t1 = mer ? "72%" : "64%", t2 = mer ? "77%" : "69%", x1 = mer ? "8%" : "5%", x2 = mer ? "28%" : "26%";
  const lb = { ...L, top: t1, fontSize: "2.6cqw", color: mer ? "#cfe0f7" : "#4b5b70", fontWeight: 600 }, vl = { ...L, top: t2, fontSize: "3.8cqw", color: mer ? "#fff" : "#0a1f3a", fontWeight: 700 };
  return (<><div style={{ ...lb, left: x1 }}>CVC</div><div style={{ ...lb, left: x2 }}>VÁLIDA HASTA</div>
    <div style={{ ...vl, left: x1 }}>{d ? d.cvc : "•••"}</div><div style={{ ...vl, left: x2 }}>{d ? d.venc : "••/••"}</div>
    <button onClick={toggle} disabled={busy} aria-label="Mostrar u ocultar CVC y fecha" style={{ position: "absolute", right: "5%", top: "7%", background: "#ffffff30", border: 0, color: "#fff", borderRadius: 999, width: "9cqw", height: "9cqw", display: "grid", placeItems: "center", cursor: "pointer" }}>{d ? <EyeOff size={18} /> : <Eye size={18} />}</button></>);
}
