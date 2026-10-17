"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
// Mascota original de VE:RP (azul, suave, pseudo-3D con CSS). Si pones tu propia imagen en public/asistente.png se usa en lugar del dibujo.
function Blob({ talk, wave, look, size = 84, img }) {
  const s = { transform: `perspective(420px) rotateY(${look.x * 16}deg) rotateX(${-look.y * 12}deg)` };
  return (<div className={"as-blob" + (talk ? " as-talk" : "")} style={{ width: size, height: size, ...s }}>
    {img ? <img src="/asistente.png" alt="" width={size} height={size} style={{ objectFit: "contain" }} /> :
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs><radialGradient id="asg" cx="35%" cy="28%" r="80%"><stop offset="0" stopColor="#d9f3ff" /><stop offset=".45" stopColor="#8fd3f6" /><stop offset="1" stopColor="#4aa3dc" /></radialGradient><radialGradient id="ash" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#000" stopOpacity=".28" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx="50" cy="94" rx="26" ry="5" fill="url(#ash)" />
      <path className={wave ? "as-arm as-wave" : "as-arm"} d="M80 56 Q94 46 90 34" stroke="#6fbfee" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M20 56 Q8 62 12 72" stroke="#6fbfee" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M50 8 C78 8 90 30 88 56 C86 80 70 90 50 90 C30 90 14 80 12 56 C10 30 22 8 50 8Z" fill="url(#asg)" />
      <ellipse cx="34" cy="28" rx="11" ry="6" fill="#fff" opacity=".55" transform="rotate(-25 34 28)" />
      <g className="as-eyes"><ellipse cx={38 + look.x * 3} cy={50 + look.y * 3} rx="4.5" ry="6" fill="#16384f" /><ellipse cx={62 + look.x * 3} cy={50 + look.y * 3} rx="4.5" ry="6" fill="#16384f" /><circle cx={39.5 + look.x * 3} cy={47.5 + look.y * 3} r="1.6" fill="#fff" /><circle cx={63.5 + look.x * 3} cy={47.5 + look.y * 3} r="1.6" fill="#fff" /></g>
      <ellipse cx="29" cy="62" rx="6" ry="3.5" fill="#ff9fb4" opacity=".55" /><ellipse cx="71" cy="62" rx="6" ry="3.5" fill="#ff9fb4" opacity=".55" />
      <path d={talk ? "M44 65 Q50 75 56 65Z" : "M43 65 Q50 72 57 65"} fill={talk ? "#16384f" : "none"} stroke="#16384f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>}
  </div>);
}
export default function Asistente() {
  const ruta = usePathname(), [est, setEst] = useState(null), [abierto, setAbierto] = useState(false), [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(""), [busy, setBusy] = useState(false),
    [globo, setGlobo] = useState(""), [look, setLook] = useState({ x: 0, y: 0 }), [wave, setWave] = useState(false), [img, setImg] = useState(false), fin = useRef(null), vistos = useRef(new Set());
  const cargar = async () => { try { const j = await (await fetch("/api/asistente", { cache: "no-store" })).json(); if (!j.visible) { setEst(false); return; } setEst(j); setMsgs((m) => (m.length ? m : j.historial.map((x) => ({ r: x.r, t: x.t })))); const n = (j.avisos || []).find((a) => !vistos.current.has(a.k)); if (n) { vistos.current.add(n.k); setGlobo(n.t); setTimeout(() => setGlobo(""), 9000); } } catch { setEst(false); } };
  useEffect(() => { cargar(); const i = setInterval(cargar, 60000); return () => clearInterval(i); }, []);
  useEffect(() => { fetch("/asistente.png", { method: "HEAD" }).then((r) => setImg(r.ok && /image/.test(r.headers.get("content-type") || ""))).catch(() => {}); }, []);
  useEffect(() => { if (!est) return; const mv = (e) => setLook({ x: Math.max(-1, Math.min(1, (e.clientX / innerWidth - .8) * 2.5)), y: Math.max(-1, Math.min(1, (e.clientY / innerHeight - .8) * 2.5)) }); addEventListener("mousemove", mv); return () => removeEventListener("mousemove", mv); }, [est]);
  useEffect(() => { if (!est) return; setWave(true); const t = setTimeout(() => setWave(false), 2200); if (est.anon) setGlobo(ruta === "/registro" ? "¿Te ayudo a registrarte?" : ruta === "/login" ? "¿Problemas para entrar? Pregúntame." : ""); return () => clearTimeout(t); }, [ruta, est?.anon]);
  useEffect(() => { fin.current?.scrollIntoView({ block: "end" }); }, [msgs, abierto]);
  if (!est) return null;
  const enviar = async (m) => { m = (m ?? txt).trim(); if (!m || busy) return; setTxt(""); setBusy(true); setMsgs((x) => [...x, { r: "u", t: m }]); try { const j = await (await fetch("/api/asistente", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ msg: m, ruta }) })).json(); setMsgs((x) => [...x, { r: "a", t: j.r || j.error || "Algo falló.", link: j.link }]); } catch { setMsgs((x) => [...x, { r: "a", t: "No pude conectar. Intenta otra vez." }]); } setBusy(false); };
  const sug = est.anon ? ["¿Cómo me registro?", "No puedo iniciar sesión"] : ["¿Qué tengo pendiente?", "¿Cómo funciona la comida?", "¿Cómo funciona el trading?", "¿Qué recuerdas?"];
  return (<>
    <style>{`.as-w{position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-size:14px}
.as-blob{cursor:pointer;animation:asb 3.2s ease-in-out infinite;transition:transform .15s;filter:drop-shadow(0 6px 8px rgba(0,0,0,.25))}.as-talk{animation:ast .35s ease-in-out infinite}
.as-eyes{transform-origin:50px 50px;animation:asblink 4.5s infinite}.as-wave{transform-origin:80px 56px;animation:asw .5s ease-in-out 4}
@keyframes asb{0%,100%{translate:0 0}50%{translate:0 -6px}}@keyframes ast{0%,100%{scale:1}50%{scale:1.06 .96}}@keyframes asblink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}@keyframes asw{0%,100%{transform:rotate(0)}50%{transform:rotate(-28deg)}}
.as-g{max-width:240px;background:var(--card,#fff);color:var(--fg,#111);border:1px solid rgba(120,160,200,.5);border-radius:14px 14px 4px 14px;padding:8px 11px;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}
.as-p{width:min(340px,calc(100vw - 28px));height:min(460px,70vh);display:flex;flex-direction:column;background:var(--card,#fff);color:var(--fg,#111);border:1px solid rgba(120,160,200,.5);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.35);overflow:hidden}
.as-h{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:linear-gradient(135deg,#4aa3dc,#8fd3f6);color:#06263a;font-weight:700}.as-h button{background:none;border:0;font-size:18px;cursor:pointer;color:inherit}
.as-m{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:7px}.as-b{max-width:85%;padding:7px 10px;border-radius:12px;white-space:pre-wrap;line-height:1.35}.as-a{background:rgba(120,160,200,.2);align-self:flex-start}.as-u{background:#4aa3dc;color:#06263a;align-self:flex-end}
.as-s{display:flex;flex-wrap:wrap;gap:5px;padding:0 10px 6px}.as-s button{font-size:12px;padding:3px 8px;border-radius:99px;border:1px solid rgba(120,160,200,.6);background:none;color:inherit;cursor:pointer}
.as-i{display:flex;gap:6px;padding:8px;border-top:1px solid rgba(120,160,200,.3)}.as-i input{flex:1;min-width:0}.as-be{font-size:10px;opacity:.7;padding:0 12px 4px}`}</style>
    <div className="as-w">
      {abierto && (<div className="as-p"><div className="as-h"><span>Asistente VE:RP · beta</span><button onClick={() => setAbierto(false)} aria-label="Cerrar">×</button></div>
        <div className="as-m">{!msgs.length && <div className="as-b as-a">{est.anon ? "Hola, te ayudo con el registro y el inicio de sesión." : `Hola${est.nombre ? ", " + est.nombre.split(" ")[0] : ""}. Pregúntame cómo funciona algo del portal. Dime “recuerda que…” y lo anoto.`}</div>}
          {msgs.map((m, i) => (<div key={i} className={"as-b " + (m.r === "u" ? "as-u" : "as-a")}>{m.t}{m.link && <><br /><a href={m.link} style={{ color: "inherit", textDecoration: "underline" }}>Ir ahí</a></>}</div>))}{busy && <div className="as-b as-a">…</div>}<div ref={fin} /></div>
        <div className="as-s">{sug.map((s) => <button key={s} onClick={() => enviar(s)}>{s}</button>)}</div>
        <form className="as-i" onSubmit={(e) => { e.preventDefault(); enviar(); }}><input value={txt} onChange={(e) => setTxt(e.target.value)} maxLength={300} placeholder="Escribe aquí…" /><button className="btn" disabled={busy}>Enviar</button></form></div>)}
      {!abierto && globo && <div className="as-g" onClick={() => { setAbierto(true); setGlobo(""); }}>{globo}</div>}
      <div onClick={() => { setAbierto((v) => !v); setGlobo(""); }} role="button" aria-label="Asistente"><Blob talk={busy} wave={wave} look={look} img={img} size={abierto ? 64 : 84} /></div>
    </div></>);
}
