"use client";
import { ShoppingCart } from "lucide-react";
export default function BuyCard({ k, owned, url = "/api/tarjeta", msg = "¡Listo! Tu tarjeta ha sido entregada. Ya aparece en tu banco." }) {
  async function go() { const r = await fetch(url, { method: "POST", body: JSON.stringify({ banco: k }) }), j = await r.json(); alert(r.ok ? msg : j.error); if (r.ok) location.reload(); }
  return <button className="btn" disabled={owned} style={{ width: "100%", marginTop: 8 }} onClick={go}><ShoppingCart size={18} />{owned ? "Ya la tienes" : "Comprar"}</button>;
}
