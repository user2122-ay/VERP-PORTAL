"use client";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import PosAnim from "@/components/PosAnim";
// Botón de compra que pregunta con qué se paga: efectivo o cualquiera de las tarjetas del usuario.
export default function Comprar({ url, body, metodos, msg = "Compra realizada", disabled, label = "Comprar", off = "Ya lo tienes", total, totalLabel = "Total con ITBMS", campo = null }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [pos, setPos] = useState(false);
  const fin = () => { alert(msg); location.reload(); };
  async function pagar(k) {
    setBusy(true); const r = await fetch(url, { method: "POST", body: JSON.stringify({ ...body, pago: k }) }), j = await r.json().catch(() => ({})); setBusy(false);
    if (r.ok && k !== "efectivo") { setOpen(false); return setPos(true); }
    alert(r.ok ? msg : j.error || "Error"); if (r.ok) location.reload(); else setOpen(false);
  }
  return (<><button className="btn" disabled={disabled} style={{ width: "100%", marginTop: 8 }} onClick={() => setOpen(true)}><ShoppingCart size={18} />{disabled ? off : label}</button>
    {pos && <PosAnim onDone={fin} />}
    {open && <div className="modal" onClick={() => setOpen(false)}><div className="card" style={{ width: "min(380px,100%)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}><h3 style={{ margin: 0 }}>¿Con qué vas a pagar?</h3>{total ? <div className="mut">{totalLabel}: <b>${total.toLocaleString("es")}</b></div> : null}
      {campo && <label className="mut" style={{ display: "block", marginTop: 10 }}>{campo.label}<div style={{ display: "flex", gap: 8, alignItems: "center" }}>{campo.hex && <span style={{ width: 26, height: 26, borderRadius: "50%", background: campo.hex(campo.valor), border: "2px solid var(--bd)", flexShrink: 0 }} />}<select value={campo.valor} onChange={(e) => campo.set(e.target.value)} style={{ flex: 1 }}>{campo.opciones.map((o) => <option key={o}>{o}</option>)}</select></div>{campo.nota && <div style={{ fontSize: 12, marginTop: 4 }}>{campo.nota}</div>}</label>}
      {metodos.map((m) => <button key={m.k} className="btn g" disabled={busy} style={{ width: "100%", marginTop: 8, justifyContent: "space-between" }} onClick={() => pagar(m.k)}><span>{m.label}</span><b>${m.saldo.toLocaleString("es")}</b></button>)}
      <button className="btn g" style={{ width: "100%", marginTop: 8 }} onClick={() => setOpen(false)}>Cancelar</button></div></div>}</>);
}
