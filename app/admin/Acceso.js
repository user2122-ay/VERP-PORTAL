"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sonar, SND } from "../mdt/Acceso";
// Inicio de sesión de ADMINISTRACIÓN (Staff). Independiente de la MDT: aquí se pide la PLACA DE STAFF.
const CSS = `
.adm-ov{position:fixed;inset:0;z-index:60;display:grid;place-items:center;overflow:auto;padding:18px;background:radial-gradient(120% 90% at 50% 0%,#0b1a4a 0%,#050a1f 55%,#02040d 100%)}
.adm-grid{position:absolute;inset:-60px;background-image:linear-gradient(rgba(59,130,246,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.13) 1px,transparent 1px);background-size:46px 46px;transform:perspective(500px) rotateX(58deg) translateY(0);transform-origin:50% 100%;animation:admgrid 5s linear infinite;mask-image:linear-gradient(to top,#000 20%,transparent 85%);-webkit-mask-image:linear-gradient(to top,#000 20%,transparent 85%)}
@keyframes admgrid{to{background-position:0 46px}}
.adm-orb{position:absolute;border-radius:50%;filter:blur(60px);opacity:.5;animation:admorb 9s ease-in-out infinite alternate}
.adm-orb.o1{width:280px;height:280px;background:#2563eb;top:-60px;left:-70px}
.adm-orb.o2{width:240px;height:240px;background:#f5b301;bottom:-80px;right:-60px;opacity:.28;animation-delay:-3s}
.adm-orb.o3{width:200px;height:200px;background:#7c3aed;top:40%;right:12%;opacity:.25;animation-delay:-6s}
@keyframes admorb{from{transform:translate(0,0) scale(1)}to{transform:translate(40px,30px) scale(1.18)}}
.adm-card{position:relative;width:100%;max-width:430px;padding:26px 22px 22px;border-radius:22px;background:rgba(10,18,44,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);text-align:center;display:grid;gap:12px;box-shadow:0 0 0 1px rgba(96,165,250,.35),0 20px 80px rgba(37,99,235,.35);animation:admin .7s cubic-bezier(.2,.9,.3,1.2) both}
.adm-card::before{content:"";position:absolute;inset:-2px;border-radius:24px;padding:2px;background:conic-gradient(from var(--a,0deg),#3b82f6,#f5b301,#7c3aed,#3b82f6);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:admspin 6s linear infinite;pointer-events:none}
@property --a{syntax:"<angle>";initial-value:0deg;inherits:false}
@keyframes admspin{to{--a:360deg}}
@keyframes admin{from{opacity:0;transform:translateY(24px) scale(.94)}to{opacity:1;transform:none}}
.adm-card.shake{animation:admshake .45s}
@keyframes admshake{20%,60%{transform:translateX(-9px)}40%,80%{transform:translateX(9px)}}
.adm-logo{border-radius:14px;overflow:hidden;animation:admfloat 4s ease-in-out infinite;box-shadow:0 0 30px rgba(59,130,246,.55)}
.adm-logo img{display:block;width:100%}
@keyframes admfloat{50%{transform:translateY(-5px)}}
.adm-t{font-size:22px;font-weight:800;letter-spacing:.14em;background:linear-gradient(90deg,#60a5fa,#fff,#f5b301);-webkit-background-clip:text;background-clip:text;color:transparent}
.adm-chip{justify-self:center;font-size:12px;padding:4px 12px;border-radius:99px;border:1px solid rgba(245,179,1,.6);color:#f5b301;background:rgba(245,179,1,.08);letter-spacing:.1em;text-transform:uppercase}
.adm-term{text-align:left;font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#7dd3fc;min-height:62px}
.adm-term div{animation:admline .4s both}
.adm-term .w{color:#fff;font-size:15px;font-weight:700}
@keyframes admline{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
.adm-form{display:grid;gap:10px;animation:admin .5s both}
.adm-in{width:100%;text-align:center;font-size:22px;letter-spacing:.2em;text-transform:uppercase;padding:13px;border-radius:14px;border:1px solid rgba(96,165,250,.45);background:rgba(2,6,23,.7);color:#fff;outline:none;transition:.2s}
.adm-in:focus{border-color:#60a5fa;box-shadow:0 0 0 3px rgba(59,130,246,.3),0 0 24px rgba(59,130,246,.45)}
.adm-in.bad{border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.25)}
.adm-btn{position:relative;overflow:hidden;border:0;border-radius:14px;padding:13px;font-weight:800;font-size:16px;letter-spacing:.06em;color:#fff;cursor:pointer;background:linear-gradient(90deg,#2563eb,#7c3aed)}
.adm-btn::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.4),transparent);animation:admshine 2.6s infinite}
@keyframes admshine{to{left:140%}}
.adm-btn:disabled{opacity:.6}
.adm-ok{display:grid;gap:10px;justify-items:center;animation:admin .5s both}
.adm-ok .c{width:74px;height:74px;border-radius:50%;display:grid;place-items:center;font-size:40px;color:#22c55e;border:3px solid #22c55e;box-shadow:0 0 40px rgba(34,197,94,.6);animation:admpop .6s cubic-bezier(.2,1.6,.4,1) both}
@keyframes admpop{from{transform:scale(0)}to{transform:scale(1)}}
.adm-ok b{color:#22c55e;letter-spacing:.18em}
.adm-back{color:#94a3b8;font-size:13px;text-decoration:underline}
`;
export default function AdminAcceso({ nombre, rango }) {
  const [lin, setLin] = useState([]), [listo, setListo] = useState(false), [placa, setPlaca] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [ok, setOk] = useState(false), [sacude, setSacude] = useState(false), ref = useRef(false);
  useEffect(() => {
    sonar(SND.boot, "triangle");
    const guion = ["> Iniciando panel de Staff…", "> Verificando credenciales…", `Bienvenido, ${rango} ${nombre}`];
    const ts = guion.map((t, i) => setTimeout(() => { setLin((l) => [...l, t]); if (i === guion.length - 1) setListo(true); }, 450 + i * 700));
    return () => ts.forEach(clearTimeout);
  }, []);
  const entrar = async (e) => {
    e.preventDefault(); if (ref.current || !placa.trim()) return; ref.current = true; setBusy(true); setErr("");
    const r = await fetch("/api/admin/entrar", { method: "POST", body: JSON.stringify({ placa }) }), j = await r.json().catch(() => ({}));
    if (!r.ok) { sonar(SND.no, "sawtooth"); setErr(j.error || "Placa incorrecta"); setSacude(true); setTimeout(() => setSacude(false), 500); ref.current = false; setBusy(false); return; }
    sonar(SND.ok, "triangle"); setOk(true); setTimeout(() => location.reload(), 1500);
  };
  return (<div className="adm-ov"><style>{CSS}</style><div className="adm-grid" /><div className="adm-orb o1" /><div className="adm-orb o2" /><div className="adm-orb o3" />
    <div className={"adm-card" + (sacude ? " shake" : "")}>
      <div className="adm-logo"><img src="/admin-logo.jpg" alt="VE:RP" /></div>
      <div className="adm-t">ADMINISTRACIÓN</div>
      <div className="adm-chip">Acceso exclusivo del Staff</div>
      <div className="adm-term">{lin.map((t, i) => <div key={i} className={i === 2 ? "w" : ""}>{t}</div>)}</div>
      {listo && !ok && <form className="adm-form" onSubmit={entrar}>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>Escribe tu <b style={{ color: "#fff" }}>placa de Staff</b> <span style={{ opacity: 0.7 }}>(no es la de la MDT)</span></div>
        <input className={"adm-in" + (err ? " bad" : "")} autoFocus value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="PLACA" autoComplete="off" autoCapitalize="characters" />
        {err && <div style={{ color: "#f87171" }}>{err}</div>}
        <button className="adm-btn" disabled={busy}>{busy ? "VERIFICANDO…" : "ENTRAR AL PANEL"}</button></form>}
      {ok && <div className="adm-ok"><div className="c">✓</div><b>ACCESO CONCEDIDO</b><div style={{ color: "#94a3b8" }}>Abriendo Administración…</div></div>}
      <Link href="/" className="adm-back">Volver al portal</Link>
    </div></div>);
}
