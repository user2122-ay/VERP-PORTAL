"use client";
import { useState } from "react";
// Pantalla que bloquea toda la página cuando el personaje muere de sed o de hambre.
export default function Moriste({ causa, estado, motivo, discord }) {
  const [vista, setVista] = useState(estado === "pendiente" ? "ticket" : "inicio"), [razon, setRazon] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const llamar = async (accion, extra = {}) => { setBusy(true); setErr(""); const r = await fetch("/api/muerte", { method: "POST", body: JSON.stringify({ accion, ...extra }) }), j = await r.json().catch(() => ({})); setBusy(false); if (!r.ok) { setErr(j.error || "Error"); return false; } return true; };
  const Ticket = () => <div className="card" style={{ borderColor: "#18e0f0" }}><b>Apelación enviada al Staff</b><p>Para tratar tu caso <b>abre un ticket en el Discord de la comunidad</b> y habla con el equipo.</p>{discord && <a className="btn" href={discord} target="_blank" rel="noreferrer">Abrir el Discord</a>}</div>;
  return (<main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16, background: "#050816" }}><div style={{ width: "min(520px,100%)", display: "grid", gap: 12 }}>
    <div className="card" style={{ borderColor: "#e5334a", boxShadow: "0 0 40px #e5334a55", textAlign: "center" }}><h1 style={{ margin: 0, color: "#ff4d5e" }}>Moriste de {causa}</h1><p className="mut">Tu personaje murió porque pasaron 24 horas sin {causa === "sed" ? "beber agua" : "comer"}. Esto significa <b>CK</b>.</p></div>
    {estado === "denegada" && <div className="card"><b>Tu apelación fue denegada</b><p className="mut">Motivo del Staff: {motivo}</p></div>}
    {vista === "ticket" ? <Ticket /> : vista === "apelar" ? <form className="card" onSubmit={async (e) => { e.preventDefault(); if (await llamar("apelar", { razon })) setVista("ticket"); }}><b>Apelar el CK</b>
      <p className="mut">Apela solo si fue por algo ajeno a ti (por ejemplo, se fue la luz o el internet). Cuéntale al Staff qué pasó.</p><textarea rows={5} value={razon} onChange={(e) => setRazon(e.target.value)} placeholder="Explica por qué no pudiste comer o beber..." required minLength={20} />
      {err && <p style={{ color: "var(--bad)" }}>{err}</p>}<div style={{ display: "flex", gap: 8 }}><button className="btn" disabled={busy}>Enviar apelación</button><button type="button" className="btn g" onClick={() => setVista("inicio")}>Volver</button></div></form>
    : vista === "nuevo" ? <div className="card"><b>Crear otro usuario</b><p className="mut">Si moriste por descuido, empieza de nuevo. Se borrará tu cédula, tu dinero, tu inventario y todo lo de este personaje, y empezarás con <b>$15.000</b>.</p>
      {err && <p style={{ color: "var(--bad)" }}>{err}</p>}<div style={{ display: "flex", gap: 8 }}><button className="btn r" disabled={busy} onClick={async () => { if (await llamar("nuevo")) location.href = "/registro"; }}>Sí, crear otro usuario</button><button className="btn g" onClick={() => setVista("inicio")}>Cancelar</button></div></div>
    : <div className="card" style={{ display: "grid", gap: 8 }}>{estado !== "pendiente" && <button className="btn" onClick={() => setVista("apelar")}>Apelar CK</button>}<button className="btn g" onClick={() => setVista("nuevo")}>Crear otro usuario</button><a className="btn g" href="/api/auth/logout">Salir</a></div>}</div></main>);
}
