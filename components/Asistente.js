"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
// Mascota original de VE:RP (azul, suave, pseudo-3D con CSS). Si pones tu propia imagen en public/asistente.png se usa en lugar del dibujo.
const AL = 130; // alto del muñeco
function Blob({ talk, wave, look, size = 84, img }) {
  const s = { transform: `perspective(420px) rotateY(${look.x * 12}deg) rotateX(${-look.y * 8}deg)` }, W = Math.round(AL * .637);
  if (img) return (<div className={"as-blob" + (talk ? " as-talk" : "")} style={{ width: W, height: AL, position: "relative", ...s }}>
    <div className={"as-fig" + (wave ? " as-wv" : "")}>
      <img src="/asistente.png" alt="" draggable={false} style={{ width: W, height: AL, display: "block", pointerEvents: "none" }} />
      <i className="as-oj" style={{ left: "26.3%", top: "31.3%" }} /><i className="as-oj" style={{ left: "57.1%", top: "25.6%" }} />
    </div>
  </div>);
  return (<div className={"as-blob" + (talk ? " as-talk" : "")} style={{ width: size, height: size, ...s }}>
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs><radialGradient id="asg" cx="35%" cy="28%" r="80%"><stop offset="0" stopColor="#d9f3ff" /><stop offset=".45" stopColor="#8fd3f6" /><stop offset="1" stopColor="#4aa3dc" /></radialGradient><radialGradient id="ash" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#000" stopOpacity=".28" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx="50" cy="94" rx="26" ry="5" fill="url(#ash)" />
      <path className={wave ? "as-arm as-wave" : "as-arm"} d="M80 56 Q94 46 90 34" stroke="#6fbfee" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M20 56 Q8 62 12 72" stroke="#6fbfee" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M50 8 C78 8 90 30 88 56 C86 80 70 90 50 90 C30 90 14 80 12 56 C10 30 22 8 50 8Z" fill="url(#asg)" />
      <ellipse cx="34" cy="28" rx="11" ry="6" fill="#fff" opacity=".55" transform="rotate(-25 34 28)" />
      <g className="as-eyes"><ellipse cx={38 + look.x * 3} cy={50 + look.y * 3} rx="4.5" ry="6" fill="#16384f" /><ellipse cx={62 + look.x * 3} cy={50 + look.y * 3} rx="4.5" ry="6" fill="#16384f" /></g>
      <ellipse cx="29" cy="62" rx="6" ry="3.5" fill="#ff9fb4" opacity=".55" /><ellipse cx="71" cy="62" rx="6" ry="3.5" fill="#ff9fb4" opacity=".55" />
      <path d={talk ? "M44 65 Q50 75 56 65Z" : "M43 65 Q50 72 57 65"} fill={talk ? "#16384f" : "none"} stroke="#16384f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>);
}
const DICHOS = ["¿Sigues ahí?", "Oye, ¿me estás ignorando?", "Toma esto.", "Despierta, ciudadano.", "¿Te aburres? Pregúntame algo.", "Aquí va un regalito."];
const COSAS = ["papel", "estrella", "gota", "corazon", "confeti"];
function Cosa({ t }) {
  const c = { papel: <circle cx="12" cy="12" r="9" fill="#f4f4f4" stroke="#aaa" strokeWidth="1.5" />, estrella: <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.5 6.8L12 17l-6.2 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="#ffd54a" />, gota: <path d="M12 2C8 8 5 11 5 15a7 7 0 0014 0c0-4-3-7-7-13z" fill="#4aa3dc" />, corazon: <path d="M12 21C4 14 2 10 2 7a5 5 0 0110-1 5 5 0 0110 1c0 3-2 7-10 14z" fill="#ff6b8a" />, confeti: <><rect x="3" y="4" width="6" height="10" fill="#7ee081" transform="rotate(20 6 9)" /><rect x="13" y="8" width="6" height="10" fill="#ff9f43" transform="rotate(-25 16 13)" /></> }[t];
  return <svg viewBox="0 0 24 24" width="30" height="30">{c}</svg>;
}
const SZ = 84; // ancho del muñeco (el alto es AL)
export default function Asistente() {
  const ruta = usePathname(), [est, setEst] = useState(null), [abierto, setAbierto] = useState(false), [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(""), [busy, setBusy] = useState(false),
    [globo, setGlobo] = useState(""), [look, setLook] = useState({ x: 0, y: 0 }), [wave, setWave] = useState(false), [img, setImg] = useState(false), [pos, setPos] = useState(null), [camina, setCamina] = useState(false), [tiros, setTiros] = useState([]),
    [quieto, setQuieto] = useState(false), [drag, setDrag] = useState(false), fin = useRef(null), vistos = useRef(new Set()), R = useRef({ pos: null, act: Date.now(), tiros: 0, abierto: false, quieto: false });
  R.current.abierto = abierto; R.current.quieto = quieto;
  const cargar = async () => { try { const j = await (await fetch("/api/asistente", { cache: "no-store" })).json(); if (!j.visible) { setEst(false); return; } setEst(j); setMsgs((m) => (m.length ? m : j.historial.map((x) => ({ r: x.r, t: x.t })))); const n = (j.avisos || []).find((a) => !vistos.current.has(a.k)); if (n) { vistos.current.add(n.k); setGlobo(n.t); setTimeout(() => setGlobo(""), 9000); } } catch { setEst(false); } };
  useEffect(() => { cargar(); const i = setInterval(cargar, 60000); return () => clearInterval(i); }, []);
  useEffect(() => { try { setQuieto(localStorage.asQuieto === "1" || matchMedia("(prefers-reduced-motion: reduce)").matches); } catch {} fetch("/asistente.png", { method: "HEAD" }).then((r) => setImg(r.ok && /image/.test(r.headers.get("content-type") || ""))).catch(() => {}); }, []);
  const cuando = (v) => { setQuieto(v); try { localStorage.asQuieto = v ? "1" : "0"; } catch {} };
  // Puntos de referencia: posición inicial (esquina inferior derecha) y actividad del usuario.
  useEffect(() => { if (!est) return; const W = innerWidth, H = innerHeight, p = { x: W - SZ - 14, y: H - AL - 14 }; R.current.pos = p; setPos(p);
    const mv = (e) => setLook({ x: Math.max(-1, Math.min(1, (e.clientX / innerWidth - .8) * 2.5)), y: Math.max(-1, Math.min(1, (e.clientY / innerHeight - .8) * 2.5)) }), act = () => { R.current.act = Date.now(); R.current.tiros = 0; };
    addEventListener("mousemove", mv); for (const k of ["pointerdown", "keydown", "scroll", "touchstart"]) addEventListener(k, act, { passive: true });
    return () => { removeEventListener("mousemove", mv); for (const k of ["pointerdown", "keydown", "scroll", "touchstart"]) removeEventListener(k, act); }; }, [!!est]);
  // Pasea por la pantalla cuando el chat está cerrado; si estás inactivo te lanza cosas.
  useEffect(() => { if (!est) return; let t1, t2;
    const pasea = () => { const r = R.current; if (!r.abierto && !r.quieto && !document.hidden && Date.now() > (r.pausa || 0)) { const W = innerWidth, H = innerHeight, p = { x: 10 + Math.random() * Math.max(0, W - SZ - 20), y: 70 + Math.random() * Math.max(0, H - AL - 80) }; r.pos = p; setPos(p); setCamina(true); setTimeout(() => setCamina(false), 3600); } t1 = setTimeout(pasea, 7000 + Math.random() * 7000); };
    const tira = () => { const r = R.current; if (!r.abierto && !r.quieto && !document.hidden && r.pos && Date.now() - r.act > 45000 && r.tiros < 4) { r.tiros++; const W = innerWidth, H = innerHeight, id = Date.now() + Math.random(), cx = r.pos.x + SZ / 2, cy = r.pos.y + SZ / 2, tx = Math.random() * W, ty = Math.random() * H;
        setTiros((a) => [...a.slice(-6), { id, x: cx, y: cy, dx: tx - cx, dy: ty - cy, t: COSAS[Math.floor(Math.random() * COSAS.length)], rot: Math.floor(Math.random() * 720) }]); setTimeout(() => setTiros((a) => a.filter((z) => z.id !== id)), 1700);
        setGlobo(DICHOS[Math.floor(Math.random() * DICHOS.length)]); setTimeout(() => setGlobo(""), 3500); } t2 = setTimeout(tira, 9000 + Math.random() * 8000); };
    t1 = setTimeout(pasea, 4000); t2 = setTimeout(tira, 12000); return () => { clearTimeout(t1); clearTimeout(t2); }; }, [!!est]);
  useEffect(() => { if (!est) return; setWave(true); const t = setTimeout(() => setWave(false), 2200); if (est.anon) setGlobo(ruta === "/registro" ? "¿Te ayudo a registrarte?" : ruta === "/login" ? "¿Problemas para entrar? Pregúntame." : ""); return () => clearTimeout(t); }, [ruta, est?.anon]);
  useEffect(() => { fin.current?.scrollIntoView({ block: "end" }); }, [msgs, abierto]);
  if (!est || !pos) return null;
  // Arrastrar: se agarra y se suelta donde quieras; un toque corto abre o cierra el chat.
  const empezar = (e) => { if (e.button > 0) return; const r = R.current, o = { dx: e.clientX - r.pos.x, dy: e.clientY - r.pos.y, x0: e.clientX, y0: e.clientY, mov: false };
    const mv = (ev) => { if (!o.mov && Math.hypot(ev.clientX - o.x0, ev.clientY - o.y0) < 6) return; if (!o.mov) { o.mov = true; setDrag(true); setGlobo(""); setCamina(false); } const p = { x: Math.max(0, Math.min(innerWidth - SZ, ev.clientX - o.dx)), y: Math.max(0, Math.min(innerHeight - AL, ev.clientY - o.dy)) }; r.pos = p; setPos(p); };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); r.act = Date.now(); if (o.mov) { r.pausa = Date.now() + 30000; setTimeout(() => setDrag(false), 30); } else { setAbierto((v) => !v); setGlobo(""); } };
    addEventListener("pointermove", mv); addEventListener("pointerup", up); addEventListener("pointercancel", up); };
  const enviar = async (m) => { m = (m ?? txt).trim(); if (!m || busy) return; setTxt(""); setBusy(true); setMsgs((x) => [...x, { r: "u", t: m }]); try { const j = await (await fetch("/api/asistente", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ msg: m, ruta }) })).json(); setMsgs((x) => [...x, { r: "a", t: j.r || j.error || "Algo falló.", link: j.link }]); } catch { setMsgs((x) => [...x, { r: "a", t: "No pude conectar. Intenta otra vez." }]); } setBusy(false); };
  const sug = est.anon ? ["¿Cómo me registro?", "No puedo iniciar sesión"] : est.rango ? ["¿Qué tengo pendiente?", "Pendientes del staff", "¿Cómo apruebo un trabajo?", "¿En qué artículo está el PG?"] : ["¿Qué tengo pendiente?", "¿Cómo funciona la comida?", "¿En qué artículo está el PG?", "¿Qué recuerdas?"];
  const p = pos, izq = p.x < innerWidth / 2, ancho = innerWidth >= 700, lado = ancho ? (izq ? { right: 14 } : { left: 14 }) : { right: 14 };
  return (<>
    <style>{`.as-mas{position:fixed;left:0;top:0;z-index:9999;width:${SZ}px;transition:transform 3.4s cubic-bezier(.45,.05,.3,1)}.as-mas.as-ab{transition:transform .5s ease}
.as-in{cursor:grab;touch-action:none;user-select:none}.as-dr .as-in{cursor:grabbing}.as-dr{transition:none!important}.as-dr .as-blob{animation:none}
.as-fig{position:relative;width:100%;height:100%;transform-origin:50% 100%;animation:asfig 3.6s ease-in-out infinite}.as-fig.as-wv{animation:aswv .5s ease-in-out 5}
.as-oj{position:absolute;width:7.6%;height:4.8%;transform:translate(-50%,-50%) scaleY(0);border-radius:50%;background:#c3e4f6;animation:asoj 4.8s infinite;pointer-events:none}
@keyframes asfig{0%,100%{transform:rotate(-1.6deg) scale(1,1)}50%{transform:rotate(1.6deg) scale(1.015,.985)}}@keyframes aswv{0%,100%{transform:rotate(0) translateY(0)}50%{transform:rotate(7deg) translateY(-4px)}}@keyframes asoj{0%,93%,100%{transform:translate(-50%,-50%) scaleY(0)}96%{transform:translate(-50%,-50%) scaleY(1)}}.as-in.as-hop{animation:ashop .55s ease-in-out infinite}.as-hop .as-fig{animation:aswv .5s ease-in-out infinite}
.as-blob{cursor:pointer;animation:asb 3.2s ease-in-out infinite;transition:transform .15s;filter:drop-shadow(0 6px 8px rgba(0,0,0,.3))}.as-talk{animation:ast .35s ease-in-out infinite}
.as-eyes{transform-origin:50px 50px;animation:asblink 4.5s infinite}.as-wave{transform-origin:80px 56px;animation:asw .5s ease-in-out 4}
@keyframes ashop{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-14px) rotate(5deg)}}@keyframes asb{0%,100%{translate:0 0}50%{translate:0 -6px}}@keyframes ast{0%,100%{scale:1}50%{scale:1.06 .96}}@keyframes asblink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}@keyframes asw{0%,100%{transform:rotate(0)}50%{transform:rotate(-28deg)}}
.as-t{position:fixed;left:0;top:0;z-index:9998;pointer-events:none;animation:astiro 1.6s ease-in forwards}@keyframes astiro{0%{transform:translate(0,0) rotate(0) scale(.6);opacity:1}85%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot)) scale(1.1);opacity:0}}
.as-g{position:absolute;bottom:100%;margin-bottom:6px;width:max-content;max-width:230px;background:var(--card);color:var(--tx);border:1px solid var(--bd);border-radius:14px;padding:8px 11px;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer;font-size:14px}
.as-p{position:fixed;bottom:14px;z-index:9999;width:min(340px,calc(100vw - 28px));height:min(460px,calc(100vh - 28px));display:flex;flex-direction:column;background:var(--card);color:var(--tx);border:1px solid var(--bd);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.35);overflow:hidden;font-size:14px}
.as-h{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:linear-gradient(135deg,#4aa3dc,#8fd3f6);color:#06263a;font-weight:700}.as-h button{background:none;border:0;cursor:pointer;color:inherit;font-size:12px;margin-left:8px}.as-h .x{font-size:18px}
.as-m{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:7px}.as-b{max-width:85%;padding:7px 10px;border-radius:12px;white-space:pre-wrap;line-height:1.35}.as-a{background:var(--bg);border:1px solid var(--bd);color:var(--tx);align-self:flex-start}.as-u{background:var(--ac);color:#fff;align-self:flex-end}
.as-s{display:flex;flex-wrap:wrap;gap:5px;padding:0 10px 6px}.as-s button{font-size:12px;padding:3px 8px;border-radius:99px;border:1px solid var(--bd);background:none;color:var(--tx);cursor:pointer}
.as-i{display:flex;gap:6px;padding:8px;border-top:1px solid var(--bd)}.as-i input{flex:1;min-width:0}`}</style>
    {tiros.map((z) => <div key={z.id} className="as-t" style={{ left: z.x - 15, top: z.y - 15, "--dx": z.dx + "px", "--dy": z.dy + "px", "--rot": z.rot + "deg" }}><Cosa t={z.t} /></div>)}
    {abierto && (<div className="as-p" style={lado}><div className="as-h"><span>Li'l Monkey{est.rango ? " · " + est.rango : ""} · beta</span><span><button onClick={() => cuando(!quieto)} title="Que se mueva o se quede quieta">{quieto ? "Dejar que pasee" : "Dejarla quieta"}</button><button className="x" onClick={() => setAbierto(false)} aria-label="Cerrar">×</button></span></div>
      <div className="as-m">{!msgs.length && <div className="as-b as-a">{est.anon ? "Hola, te ayudo con el registro y el inicio de sesión." : `Hola${est.nombre ? ", " + est.nombre.split(" ")[0] : ""}. Soy Li'l Monkey. Pregúntame cómo funciona algo del portal o en qué artículo de la normativa está una regla. Dime “recuerda que…” y lo anoto.`}</div>}
        {msgs.map((m, i) => (<div key={i} className={"as-b " + (m.r === "u" ? "as-u" : "as-a")}>{m.t}{m.link && <><br /><a href={m.link} style={{ color: m.r === "u" ? "#fff" : "var(--ac)", textDecoration: "underline" }}>Ir ahí</a></>}</div>))}{busy && <div className="as-b as-a">…</div>}<div ref={fin} /></div>
      <div className="as-s">{sug.map((s) => <button key={s} onClick={() => enviar(s)}>{s}</button>)}</div>
      <form className="as-i" onSubmit={(e) => { e.preventDefault(); enviar(); }}><input value={txt} onChange={(e) => setTxt(e.target.value)} maxLength={300} placeholder="Escribe aquí…" /><button className="btn" disabled={busy}>Enviar</button></form></div>)}
    <div className={"as-mas" + (drag ? " as-dr" : "")} style={{ transform: `translate(${p.x}px,${p.y}px)` }}>
      {!abierto && globo && <div className="as-g" style={izq ? { left: 0 } : { right: 0 }} onClick={() => { setAbierto(true); setGlobo(""); }}>{globo}</div>}
      <div className={"as-in" + (camina && !abierto && !drag ? " as-hop" : "")} onPointerDown={empezar} role="button" aria-label="Li'l Monkey (arrástrala para moverla)"><Blob talk={busy} wave={wave} look={look} img={img} size={SZ} /></div>
    </div></>);
}
