"use client";
import { useState } from "react";
import { Tag } from "lucide-react";
// Revender un artículo por menos de lo que pagaste (va a Mercado → Segunda mano).
export default function Revender({ name, at, pagado, metodos }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  async function enviar(e) {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); setBusy(true);
    const r = await fetch("/api/usados", { method: "POST", body: JSON.stringify({ accion: "publicar", name, at, precio: f.precio, pago: f.pago }) }), j = await r.json().catch(() => ({})); setBusy(false);
    if (r.ok) { alert("Publicado en Segunda mano"); location.reload(); } else alert(j.error || "Error");
  }
  return (<><button className="btn g" style={{ width: "100%", marginTop: 8 }} onClick={() => setOpen(true)}><Tag size={16} />Revender</button>
    {open && <div className="modal" onClick={() => setOpen(false)}><form className="card" style={{ width: "min(380px,100%)" }} onClick={(e) => e.stopPropagation()} onSubmit={enviar}><h3 style={{ margin: 0 }}>Revender {name}</h3><p className="mut">Pagaste ${Number(pagado).toLocaleString("es")}. Tienes que venderlo por menos. Sale de tu inventario y aparece en Mercado → Segunda mano.</p>
      <label>Precio de venta ($)</label><input name="precio" type="number" min="1" max={pagado - 1} required autoFocus /><label>Cobrar en</label><select name="pago">{metodos.map((m) => <option key={m.k} value={m.k}>{m.label}</option>)}</select>
      <button className="btn" style={{ width: "100%" }} disabled={busy}>Publicar</button><button type="button" className="btn g" style={{ width: "100%", marginTop: 8 }} onClick={() => setOpen(false)}>Cancelar</button></form></div>}</>);
}
