"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Maximize2 } from "lucide-react";
const MAX = 8;
// Mapa con zoom (botones +/−, rueda del mouse y pellizco en el celular) y arrastre. Las coordenadas salen en % del mapa.
// pin = punto que marca el ciudadano · pins = [{id,x,y,color}] llamados que se ven en la MDT · onTap({x,y}) · onPin(pin)
export default function ZoomMap({ pin, pins = [], onTap, onPin }) {
  const [v, setV] = useState({ s: 1, x: 0, y: 0 }), vr = useRef(v), box = useRef(), inner = useRef(), P = useRef(new Map()), st = useRef({});
  vr.current = v;
  const fit = (s, x, y) => { const r = box.current.getBoundingClientRect(); return { s, x: Math.min(0, Math.max(r.width - r.width * s, x)), y: Math.min(0, Math.max(r.height - r.height * s, y)) }; };
  const zoom = (f, cx, cy) => setV((o) => { const s = Math.min(MAX, Math.max(1, o.s * f)), k = s / o.s; return fit(s, cx - (cx - o.x) * k, cy - (cy - o.y) * k); });
  const mid = () => { const r = box.current.getBoundingClientRect(); return [r.width / 2, r.height / 2]; };
  useEffect(() => { const el = box.current, w = (e) => { e.preventDefault(); const r = el.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.3 : 0.77, e.clientX - r.left, e.clientY - r.top); }; el.addEventListener("wheel", w, { passive: false }); return () => el.removeEventListener("wheel", w); }, []);
  const base = (e) => { st.current = { moved: false, sx: e.clientX, sy: e.clientY, v0: vr.current, last: 0 }; };
  const down = (e) => { box.current.setPointerCapture(e.pointerId); P.current.set(e.pointerId, [e.clientX, e.clientY]); if (P.current.size === 1) base(e); else st.current.moved = true; };
  const move = (e) => {
    if (!P.current.has(e.pointerId)) return; P.current.set(e.pointerId, [e.clientX, e.clientY]); const a = [...P.current.values()], s = st.current;
    if (a.length >= 2) { const d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), r = box.current.getBoundingClientRect(); if (s.last) zoom(d / s.last, (a[0][0] + a[1][0]) / 2 - r.left, (a[0][1] + a[1][1]) / 2 - r.top); s.last = d; s.moved = true; return; }
    const dx = e.clientX - s.sx, dy = e.clientY - s.sy; if (Math.hypot(dx, dy) > 6) s.moved = true; if (s.moved) setV(fit(s.v0.s === vr.current.s ? s.v0.s : vr.current.s, s.v0.x + dx, s.v0.y + dy));
  };
  const up = (e) => {
    const solo = P.current.size === 1; P.current.delete(e.pointerId); st.current.last = 0;
    if (P.current.size === 1) { const [x, y] = [...P.current.values()][0]; base({ clientX: x, clientY: y }); st.current.moved = true; return; }
    if (!solo || st.current.moved || e.type === "pointercancel") return;
    const r = inner.current.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100; if (x < 0 || y < 0 || x > 100 || y > 100) return;
    if (onPin) { let b = null, bd = 22; for (const p of pins) { const d = Math.hypot(r.left + (p.x / 100) * r.width - e.clientX, r.top + (p.y / 100) * r.height - e.clientY); if (d < bd) { bd = d; b = p; } } if (b) return onPin(b); }
    if (onTap) onTap({ x: +x.toFixed(2), y: +y.toFixed(2) });
  };
  const btn = { background: "#000a", color: "#fff", border: 0, borderRadius: 8, width: 36, height: 36, display: "grid", placeItems: "center", cursor: "pointer" };
  return (<div className="zm" ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
    <div ref={inner} style={{ transform: `translate(${v.x}px,${v.y}px) scale(${v.s})` }}><img src="/mapa.jpg" alt="Mapa" draggable={false} />
      {pins.map((p) => <div key={p.id} className="pin" style={{ left: p.x + "%", top: p.y + "%", background: p.color || undefined, transform: `scale(${1 / v.s})` }} />)}
      {pin && <div className="pin" style={{ left: pin.x + "%", top: pin.y + "%", transform: `scale(${1 / v.s})` }} />}</div>
    <div className="zc" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
      <button type="button" style={btn} aria-label="Acercar" onClick={() => zoom(1.5, ...mid())}><Plus size={18} /></button><button type="button" style={btn} aria-label="Alejar" onClick={() => zoom(0.66, ...mid())}><Minus size={18} /></button>
      <button type="button" style={btn} aria-label="Ver todo el mapa" onClick={() => setV({ s: 1, x: 0, y: 0 })}><Maximize2 size={16} /></button></div>
    {v.s > 1 && <div className="zl2">x{v.s.toFixed(1)}</div>}</div>);
}
