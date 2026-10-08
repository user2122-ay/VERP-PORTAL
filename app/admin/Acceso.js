"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sonar, SND } from "../mdt/Acceso";
// Entrada a Administración: pide la placa del staff (igual que la MDT).
export default function AdminAcceso({ nombre, rango }) {
  const [placa, setPlaca] = useState(""), [err, setErr] = useState(""), [ok, setOk] = useState(false), ref = useRef(false);
  useEffect(() => { sonar(SND.boot, "triangle"); }, []);
  const entrar = async (e) => {
    e.preventDefault(); if (ref.current) return; ref.current = true; setErr("");
    const r = await fetch("/api/admin/entrar", { method: "POST", body: JSON.stringify({ placa }) }), j = await r.json().catch(() => ({}));
    if (!r.ok) { sonar(SND.no, "sawtooth"); setErr(j.error || "Placa incorrecta"); ref.current = false; return; }
    sonar(SND.ok, "triangle"); setOk(true); setTimeout(() => location.reload(), 1200);
  };
  return (<div className="mdt-ov"><div className="mdt-scan" /><div className="mdt-box">
    <img src="/admin-logo.jpg" alt="VE:RP" style={{ width: "min(440px,100%)", borderRadius: 12 }} />
    <div className="mdt-t" style={{ textAlign: "left", width: "100%" }}><div className="mdt-in">&gt; Administración · acceso restringido</div><div className="mdt-in" style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>Bienvenido, {rango} {nombre}</div></div>
    {!ok && <form onSubmit={entrar} className="mdt-in" style={{ width: "100%", display: "grid", gap: 10 }}><div className="mut">Ingresa tu número de placa</div><input autoFocus value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="Placa" style={{ textAlign: "center", fontSize: 20, letterSpacing: ".15em" }} />{err && <div style={{ color: "var(--bad)" }}>{err}</div>}<button className="btn">Ingresar</button><Link href="/" className="mut" style={{ textDecoration: "underline" }}>Volver al portal</Link></form>}
    {ok && <div className="mdt-ok">ACCESO CONCEDIDO</div>}</div></div>);
}
