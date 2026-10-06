"use client";
import { ShoppingCart } from "lucide-react";
export default function Buy({ id }) {
  async function go() { const r = await fetch("/api/comprar", { method: "POST", body: JSON.stringify({ id }) }); const j = await r.json(); alert(r.ok ? "Compra realizada" : j.error); if (r.ok) location.reload(); }
  return <button className="btn" style={{ width: "100%", marginTop: 8 }} onClick={go}><ShoppingCart size={18} />Comprar</button>;
}
