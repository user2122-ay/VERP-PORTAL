"use client";
import { useState } from "react";
import Comprar from "./PagoModal";
// Casas: pregunta el color antes de pagar.
export default function Buy({ id, metodos, colores, bloqueo, total }) {
  const [color, setColor] = useState(colores?.[0] || "");
  return (<>{colores && <label className="mut" style={{ display: "block", marginTop: 8 }}>Color de la casa<select value={color} onChange={(e) => setColor(e.target.value)}>{colores.map((c) => <option key={c}>{c}</option>)}</select></label>}<Comprar url="/api/comprar" body={{ id, color }} metodos={metodos} disabled={!!bloqueo} off={bloqueo} total={total} /></>);
}
