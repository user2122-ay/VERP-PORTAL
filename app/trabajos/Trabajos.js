"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { TRABAJOS } from "@/lib/trabajos";
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
const ST = { pendiente: ["Pendiente", "#f5b301"], aprobado: ["Aprobado", "#22c55e"], rechazado: ["Rechazado", "#ef4444"] };
export default function Trabajos({ roblox, cuentas, mias }) {
  const [k, setK] = useState(TRABAJOS[0][0]), [h, setH] = useState(1), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const t = TRABAJOS.find((x) => x[0] === k), horas = Math.max(0, Math.floor(Number(h) || 0)), total = t[2] * horas;
  const enviar = async (e) => {
    e.preventDefault(); const f = new FormData(e.target); setErr(""); setBusy(true);
    const r = await fetch("/api/trabajos", { method: "POST", body: JSON.stringify({ roblox: f.get("roblox"), trabajo: k, horas: h, inicio: f.get("inicio"), durante: f.get("durante"), final: [f.get("f1"), f.get("f2"), f.get("f3")], cuenta: f.get("cuenta") }) }), j = await r.json().catch(() => ({}));
    setBusy(false); if (!r.ok) return setErr(j.error || "Error"); alert(`Solicitud enviada al staff. Si la aprueban recibirás ${$(j.total)}.`); location.reload();
  };
  return (<div style={{ maxWidth: 560, margin: "0 auto" }}><h2>Trabajos secundarios</h2>
    <p className="mut">Pide el pago de las horas que trabajaste. El staff revisa tus evidencias y, si todo está bien, te depositan el total. Las fotos van como link de imagen (por ejemplo de Discord).</p>
    <form className="card" onSubmit={enviar}>
      <label className="mut">Tu usuario de Roblox</label><input name="roblox" defaultValue={roblox} required maxLength={20} />
      <label className="mut">Trabajo que realizaste</label><select value={k} onChange={(e) => setK(e.target.value)}>{TRABAJOS.map((x) => <option key={x[0]} value={x[0]}>{x[1]} · {$(x[2])} la hora</option>)}</select>
      <label className="mut">¿Cuántas horas trabajaste?</label><input type="number" min="1" max="24" step="1" value={h} onChange={(e) => setH(e.target.value)} required />
      <div className="card" style={{ margin: "4px 0 10px", textAlign: "center", borderColor: "var(--ok)" }}><div className="mut">Ganaste en total</div><div className="big" style={{ fontSize: 30 }}>{$(total)}</div><div className="mut" style={{ fontSize: 12 }}>{horas} h × {$(t[2])}</div></div>
      <b>Evidencias</b>
      <label className="mut">Al iniciar el trabajo (1 foto)</label><input name="inicio" required placeholder="https://cdn.discordapp.com/..." />
      <label className="mut">Durante el trabajo (1 foto)</label><input name="durante" required placeholder="https://cdn.discordapp.com/..." />
      <label className="mut">Al finalizar el trabajo (3 fotos)</label><input name="f1" required placeholder="Foto 1 · https://..." /><input name="f2" required placeholder="Foto 2 · https://..." /><input name="f3" required placeholder="Foto 3 · https://..." />
      <label className="mut">¿Dónde quieres recibir el pago?</label><select name="cuenta">{cuentas.map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}</select>
      {err && <p style={{ color: "var(--bad)" }}>{err}</p>}
      <button className="btn" style={{ width: "100%" }} disabled={busy}><Send size={16} />{busy ? "Enviando..." : "Enviar solicitud"}</button></form>
    <div className="card"><b>Mis solicitudes</b>{mias.map((r) => <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid var(--bd)" }}><span>{r.trabajo} · {r.horas} h<div className="mut" style={{ fontSize: 12 }}>{new Date(r.at).toLocaleString("es")}{r.motivo ? ` · ${r.motivo}` : ""}</div></span><span style={{ textAlign: "right" }}><b>{$(r.total)}</b><div style={{ color: ST[r.estado]?.[1], fontSize: 13 }}>{ST[r.estado]?.[0]}</div></span></div>)}{!mias.length && <p className="mut">Aún no has enviado solicitudes.</p>}</div></div>);
}
