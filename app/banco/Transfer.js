"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Copy, Check, Eye, EyeOff } from "lucide-react";
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

// CVC y fecha de validez ocultos; el ojito los pide al servidor y se vuelven a ocultar a los 15 s.
export function CardSecret() {
  const [d, setD] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => { if (!d) return; const t = setTimeout(() => setD(null), 15000); return () => clearTimeout(t); }, [d]);
  const toggle = async () => { if (d) return setD(null); setBusy(true); const r = await fetch("/api/banco/datos"); setBusy(false); if (r.ok) setD(await r.json()); };
  const L = { position: "absolute", whiteSpace: "nowrap", fontFamily: "Arial, sans-serif" }, lb = { ...L, top: "64%", fontSize: "2.6cqw", color: "#4b5b70", fontWeight: 600 }, vl = { ...L, top: "69%", fontSize: "3.8cqw", color: "#0a1f3a", fontWeight: 700 };
  return (<><div style={{ ...lb, left: "5%" }}>CVC</div><div style={{ ...lb, left: "26%" }}>VÁLIDA HASTA</div>
    <div style={{ ...vl, left: "5%" }}>{d ? d.cvc : "•••"}</div><div style={{ ...vl, left: "26%" }}>{d ? d.venc : "••/••"}</div>
    <button onClick={toggle} disabled={busy} aria-label="Mostrar u ocultar CVC y fecha" style={{ position: "absolute", right: "5%", top: "7%", background: "#ffffff30", border: 0, color: "#fff", borderRadius: 999, width: "9cqw", height: "9cqw", display: "grid", placeItems: "center", cursor: "pointer" }}>{d ? <EyeOff size={18} /> : <Eye size={18} />}</button></>);
}
