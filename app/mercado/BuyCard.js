"use client";
import Comprar from "./PagoModal";
export default function BuyCard({ k, owned, metodos, url = "/api/tarjeta", msg = "¡Listo! Tu tarjeta ha sido entregada. Ya aparece en tu banco." }) { return <Comprar url={url} body={{ banco: k }} metodos={metodos} msg={msg} disabled={owned} />; }
