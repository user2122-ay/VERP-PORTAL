"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Copy, Check } from "lucide-react";
export function CopyCard({ num }) {
  const [ok, setOk] = useState(false);
  return <button className="btn g" onClick={() => { navigator.clipboard?.writeText(num); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? <Check size={16} /> : <Copy size={16} />} {ok ? "Copiada" : "Copiar"}</button>;
}
export default function Transfer({ fee, inflacion }) {
  const r = useRouter(), [err, setErr] = useState(""), [ok, setOk] = useState(""), [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault(); const f = e.target, b = Object.fromEntries(new FormData(f)); setBusy(true); setErr(""); setOk("");
    const x = await fetch("/api/banco", { method: "POST", body: JSON.stringify(b) }), j = await x.json().catch(() => ({}));
    setBusy(false); if (!x.ok) return setErr(j.error || "Error"); setOk("Transferencia enviada"); f.reset(); r.refresh();
  };
  return (<form className="card" onSubmit={send}><h3 style={{ margin: 0 }}>Enviar dinero</h3>
    <label>Tarjeta del destinatario</label><input name="dest" required inputMode="numeric" placeholder="7700 0000 0000 0000" autoComplete="off" />
    <label>Monto ($)</label><input name="monto" type="number" min="1" required />
    <label>Nota (opcional)</label><input name="nota" maxLength={60} />
    <p className="mut">Impuesto por transferencia: ${fee} · Inflación del sistema: {inflacion}%</p>
    {err && <p style={{ color: "var(--bad)" }}>{err}</p>}{ok && <p style={{ color: "var(--ok)" }}>{ok}</p>}
    <button className="btn" style={{ width: "100%" }} disabled={busy}><Send size={18} />{busy ? "Enviando..." : "Enviar"}</button></form>);
}
