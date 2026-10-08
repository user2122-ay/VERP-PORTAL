"use client";
export default function Cancelar({ id }) {
  return <button className="btn g" style={{ width: "100%", marginTop: 8 }} onClick={async () => { if (!confirm("¿Quitar tu publicación y recuperar el objeto?")) return; const r = await fetch("/api/usados", { method: "POST", body: JSON.stringify({ accion: "cancelar", id }) }), j = await r.json().catch(() => ({})); if (r.ok) location.reload(); else alert(j.error || "Error"); }}>Cancelar mi publicación</button>;
}
