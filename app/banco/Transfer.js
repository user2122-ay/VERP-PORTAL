"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
export default function Transfer() {
  const r = useRouter(), [err, setErr] = useState(""), [ok, setOk] = useState(""), [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault(); const f = e.target, b = Object.fromEntries(new FormData(f)); setBusy(true); setErr(""); setOk("");
    const x = await fetch("/api/banco", { method: "POST", body: JSON.stringify(b) }), j = await x.json().catch(() => ({}));
    setBusy(false); if (!x.ok) return setErr(j.error || "Error"); setOk("Transferencia enviada"); f.reset(); r.refresh();
  };
  return (<form className="card" onSubmit={send}><h3 style={{ margin: 0 }}>Transferir por cédula</h3>
    <label>Cédula del destinatario</label><input name="num" required placeholder="V-00.000.002" autoComplete="off" />
    <label>Monto ($)</label><input name="monto" type="number" min="1" required />
    <label>Nota (opcional)</label><input name="nota" maxLength={60} />
    {err && <p style={{ color: "var(--bad)" }}>{err}</p>}{ok && <p style={{ color: "var(--ok)" }}>{ok}</p>}
    <button className="btn" style={{ width: "100%" }} disabled={busy}><Send size={18} />{busy ? "Enviando..." : "Enviar"}</button></form>);
}
