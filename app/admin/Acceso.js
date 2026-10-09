"use client";
import { useRef, useState } from "react";
import Link from "next/link";
// Acceso a ADMINISTRACIÓN (staff). Es independiente de la MDT: aquí se pide la PLACA DE STAFF, la MDT pide la placa policial.
export default function AdminAcceso({ nombre, rango }) {
  const [placa, setPlaca] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false), ref = useRef(false);
  const entrar = async (e) => {
    e.preventDefault(); if (ref.current) return; ref.current = true; setBusy(true); setErr("");
    const r = await fetch("/api/admin/entrar", { method: "POST", body: JSON.stringify({ placa }) }), j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || "Placa incorrecta"); ref.current = false; setBusy(false); return; }
    location.reload();
  };
  return (<div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}><form className="card" onSubmit={entrar} style={{ maxWidth: 420, width: "100%", textAlign: "center", display: "grid", gap: 10 }}>
    <img src="/admin-logo.jpg" alt="VE:RP" style={{ width: "100%", borderRadius: 12 }} />
    <b style={{ fontSize: 18 }}>Administración · Acceso del Staff</b>
    <div className="mut">{rango} {nombre}</div>
    <div className="mut">Escribe tu <b>placa de Staff</b>. No es la placa de la MDT: la MDT es solo para la policía y tiene su propio inicio de sesión.</div>
    <input autoFocus value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="Placa de Staff" style={{ textAlign: "center", fontSize: 20, letterSpacing: ".15em" }} />
    {err && <div style={{ color: "var(--bad)" }}>{err}</div>}
    <button className="btn" disabled={busy}>{busy ? "Verificando..." : "Entrar a Administración"}</button>
    <Link href="/" className="mut" style={{ textDecoration: "underline" }}>Volver al portal</Link></form></div>);
}
