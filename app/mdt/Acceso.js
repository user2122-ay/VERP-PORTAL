"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
// Sonidos de la MDT (sintetizados, sin archivos): arranque y acceso concedido.
export const sonar = (notas, tipo = "sine") => { try { const a = new (window.AudioContext || window.webkitAudioContext)(); notas.forEach(([f, t, d]) => { const o = a.createOscillator(), g = a.createGain(), s = a.currentTime + t; o.type = tipo; o.frequency.value = f; g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.16, s + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, s + d); o.connect(g); g.connect(a.destination); o.start(s); o.stop(s + d + 0.05); }); setTimeout(() => a.close(), 3500); } catch {} };
export const SND = { boot: [[220, 0, 0.18], [330, 0.14, 0.18], [440, 0.28, 0.2], [660, 0.44, 0.3]], ok: [[523, 0, 0.16], [659, 0.14, 0.16], [784, 0.28, 0.16], [1047, 0.42, 0.5]], no: [[180, 0, 0.25], [140, 0.2, 0.35]] };
export default function Acceso({ info, onOk }) {
  const [lin, setLin] = useState([]), [listo, setListo] = useState(false), [placa, setPlaca] = useState(""), [err, setErr] = useState(""), [ok, setOk] = useState(false), ref = useRef(false);
  const ag = info.ag, guion = ["Iniciando sistema…", "Verificando credenciales…", `Bienvenido, ${ag.rango} ${info.nombre}`, `${ag.depto}`];
  useEffect(() => {
    sonar(SND.boot, "triangle"); const ts = guion.map((t, i) => setTimeout(() => { setLin((l) => [...l, t]); if (i === guion.length - 1) setListo(true); }, 700 + i * 850)); return () => ts.forEach(clearTimeout);
  }, []);
  const entrar = async (e) => {
    e.preventDefault(); if (ref.current) return; ref.current = true; setErr("");
    const r = await fetch("/api/mdt", { method: "POST", body: JSON.stringify({ accion: "entrar", placa }) }), j = await r.json().catch(() => ({}));
    if (!r.ok) { sonar(SND.no, "sawtooth"); setErr(j.error || "Placa incorrecta"); ref.current = false; return; }
    sonar(SND.ok, "triangle"); setOk(true); setTimeout(onOk, 1600);
  };
  return (<div className="mdt-ov"><div className="mdt-scan" /><div className="mdt-box">
    <img src="/justicia-paz.png" alt="Justicia y Paz" className="mdt-logo" />
    <div className="mdt-t" style={{ textAlign: "left", width: "100%" }}>{lin.map((t, i) => <div key={i} className="mdt-in" style={{ color: i === 2 ? "#fff" : undefined, fontSize: i === 2 ? 18 : 14, fontWeight: i === 2 ? 700 : 400 }}>{i < 2 ? "> " : ""}{t}</div>)}</div>
    {listo && !ok && <form onSubmit={entrar} className="mdt-in" style={{ width: "100%", display: "grid", gap: 10 }}><div className="mut">Ingresa tu número de placa</div><input autoFocus value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="Placa" style={{ textAlign: "center", fontSize: 20, letterSpacing: ".15em" }} />{err && <div style={{ color: "var(--bad)" }}>{err}</div>}<button className="btn">Ingresar</button><Link href="/" className="mut" style={{ textDecoration: "underline" }}>Volver al portal</Link></form>}
    {ok && <div className="mdt-ok">ACCESO CONCEDIDO</div>}</div></div>);
}
