"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
// Sistema del cuerpo: tu avatar de Roblox con anillos de comida y agua. Se ve cada vez peor mientras no comes ni bebes.
const H = { comida: 24, agua: 24 }, niv = (e, h, ahora) => Math.max(0, e.n - ((ahora - +new Date(e.t)) / 36e5) * (100 / h));
const tiempo = (p, h) => { const m = Math.floor((p / 100) * h * 60); return `${Math.floor(m / 60)} h ${m % 60} min`; };
function Anillo({ p, color, icono, nombre }) {
  const r = 44, c = 2 * Math.PI * r, col = p < 25 ? "#ff4d5e" : color;
  return (<div className="cu-s"><div className="cu-pct">{Math.round(p)}%</div><div><div className="cu-ring"><svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r={r} fill="none" stroke="#ffffff1f" strokeWidth="9" /><circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(c * p) / 100} ${c}`} transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 1s linear" }} /></svg><span>{icono}</span></div><b className="cu-n">{nombre}</b></div></div>);
}
export default function Cuerpo({ comida, agua, img, ahora: a0, enfermo }) {
  const [ahora, setAhora] = useState(a0);
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 5000); return () => clearInterval(t); }, []);
  const c = niv(comida, H.comida, ahora), a = niv(agua, H.agua, ahora), p = Math.min(c, a), mal = 1 - p / 100, muerto = c <= 0 || a <= 0;
  useEffect(() => { if (muerto) location.reload(); }, [muerto]);
  const sick = enfermo && +new Date(enfermo.hasta) > ahora, aviso = sick ? `🤢 Estás enfermo por comer algo vencido (${enfermo.causa}). Se te pasa en ${tiempo(((+new Date(enfermo.hasta) - ahora) / 36e5 / 2) * 100, 2)}.` : a < 25 ? "¡Tienes muchísima sed! Bebe agua ya." : c < 25 ? "¡Tienes muchísima hambre! Come algo ya." : a < 50 ? "Empiezas a tener sed." : c < 50 ? "Empiezas a tener hambre." : null;
  return (<div className="cu"><div className="cu-top"><Anillo p={c} color="#d4a017" icono="🍖" nombre="Comida" /><Anillo p={a} color="#18e0f0" icono="💧" nombre="Agua" /></div>
    {img ? <img className="cu-av" src={img} alt="Tu personaje" referrerPolicy="no-referrer" style={{ filter: `grayscale(${mal * 0.9}) sepia(${mal * 0.35 + (sick ? 0.5 : 0)}) hue-rotate(${sick ? 40 : 0}deg) brightness(${1 - mal * 0.45})`, animation: `${p < 35 ? "cu-tiembla .3s" : "cu-flota 3.5s ease-in-out"} infinite`, transformOrigin: "50% 100%" }} /> : <div className="cu-av mut" style={{ display: "grid", placeItems: "center" }}>Sin avatar</div>}
    <div className="cu-pie">{aviso && <div style={{ color: "#ff6b7a", fontWeight: 700 }}>{aviso}</div>}<div className="mut">Sin beber morirías en {tiempo(a, H.agua)} · sin comer en {tiempo(c, H.comida)}</div><div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}><Link href="/mercado?c=Comida%20y%20bebida" className="btn">Comprar comida y agua</Link><Link href="/inventario?v=comida" className="btn g">Mi comida y nevera</Link></div></div></div>);
}
