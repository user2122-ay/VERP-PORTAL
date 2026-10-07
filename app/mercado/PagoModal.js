"use client";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";
// Botón de compra que pregunta con qué se paga: efectivo o cualquiera de las tarjetas del usuario.
export default function Comprar({ url, body, metodos, msg = "Compra realizada", disabled, label = "Comprar" }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  async function pagar(k) {
    setBusy(true); const r = await fetch(url, { method: "POST", body: JSON.stringify({ ...body, pago: k }) }), j = await r.json().catch(() => ({})); setBusy(false);
    alert(r.ok ? msg : j.error || "Error"); if (r.ok) location.reload(); else setOpen(false);
  }
  return (<><button className="btn" disabled={disabled} style={{ width: "100%", marginTop: 8 }} onClick={() => setOpen(true)}><ShoppingCart size={18} />{disabled ? "Ya la tienes" : label}</button>
    {open && <div className="modal" onClick={() => setOpen(false)}><div className="card" style={{ width: "min(380px,100%)" }} onClick={(e) => e.stopPropagation()}><h3 style={{ margin: 0 }}>¿Con qué vas a pagar?</h3>
      {metodos.map((m) => <button key={m.k} className="btn g" disabled={busy} style={{ width: "100%", marginTop: 8, justifyContent: "space-between" }} onClick={() => pagar(m.k)}><span>{m.label}</span><b>${m.saldo.toLocaleString("es")}</b></button>)}
      <button className="btn g" style={{ width: "100%", marginTop: 8 }} onClick={() => setOpen(false)}>Cancelar</button></div></div>}</>);
}
