"use client";
import { useEffect } from "react";
// Animación: la tarjeta de comerciante entra en la maquinita y aparece "Pago aprobado".
export default function PosAnim({ onDone, texto = "Pago aprobado" }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return (<div className="modal" style={{ background: "#000c" }}><div className="pos"><div className="pos-card">VERP</div><div className="pos-body"><div className="pos-screen"><b className="pos-ok">✔ {texto}</b></div><div className="pos-keys">{Array.from({ length: 9 }, (_, i) => <span key={i} />)}</div></div></div></div>);
}
