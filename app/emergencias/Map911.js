"use client";
import { useState } from "react";
import { Siren, MapPin, Send } from "lucide-react";
import { zona } from "@/lib/zonas";
const T = ["Robo de vehículo", "Robo a mano armada", "Disparos", "Accidente", "Persona sospechosa", "Incendio", "Otro"];
export default function Map911() {
  const [p, setP] = useState(null), [m, setM] = useState("");
  const tap = (e) => { const r = e.currentTarget.getBoundingClientRect(); setP({ x: +(((e.clientX - r.left) / r.width) * 100).toFixed(2), y: +(((e.clientY - r.top) / r.height) * 100).toFixed(2) }); };
  async function send(ev) {
    ev.preventDefault(); if (!p) return setM("Toca el mapa para marcar la ubicación.");
    const b = Object.fromEntries(new FormData(ev.target)); const r = await fetch("/api/emergencias", { method: "POST", body: JSON.stringify({ ...b, ...p }) });
    const j = await r.json(); setM(r.ok ? "Reporte enviado. Una unidad fue notificada." : j.error); if (r.ok) { setP(null); ev.target.reset(); }
  }
  return (<form onSubmit={send}><h2><Siren className="neon" /> Reportar emergencia</h2>
    <div className="map" onClick={tap}><img src="/mapa.jpg" alt="Mapa" draggable={false} />{p && <div className="pin" style={{ left: p.x + "%", top: p.y + "%" }} />}</div>
    <p className="mut"><MapPin size={14} className="neon" /> {p ? `Zona: ${zona(p.x, p.y)}` : "Toca el mapa para marcar la ubicación exacta"}</p>
    <div className="card"><label>Tipo</label><select name="tipo">{T.map((t) => <option key={t}>{t}</option>)}</select>
      <label>Calle o sector</label><input name="calle" maxLength={80} /><label>Descripción</label><textarea name="desc" rows={3} required maxLength={400} placeholder="¿Qué está ocurriendo? Sé específico" />
      <p className="mut">Los reportes falsos tienen consecuencias en el rol.</p>{m && <p>{m}</p>}<button className="btn r" style={{ width: "100%" }}><Send size={18} />Enviar reporte</button></div></form>);
}
