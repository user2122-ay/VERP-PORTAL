"use client";
import { useState } from "react";
import Comprar from "./PagoModal";
// Casas: pregunta el color antes de pagar. Autos: un solo campo (el color) que se pide al pulsar Comprar.
const HEX = { Negro: "#111418", Blanco: "#f4f4f2", Plata: "#c0c4cc", "Gris grafito": "#4a4f58", Rojo: "#c8102e", Azul: "#1f4fd8", "Azul marino": "#14285a", Verde: "#1e7a4d", Amarillo: "#f2c200", Naranja: "#f07a1a", Dorado: "#c9a227", Vino: "#6d1230", Celeste: "#5cb8ff", Morado: "#6a3fb5", "Marrón": "#5b3a29" };
export default function Buy({ id, metodos, colores, bloqueo, total, auto, label, totalLabel }) {
  const [color, setColor] = useState(auto?.colores?.[0]?.n || colores?.[0] || "");
  const campo = auto ? { label: "¿De qué color quieres el auto?", valor: color, set: setColor, opciones: auto.colores.map((c) => c.n), hex: (n) => auto.colores.find((c) => c.n === n)?.hex || HEX[n] || "#888", nota: `Llegan colores nuevos a las ${new Date(auto.hasta).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}.` }
    : colores ? { label: "¿De qué color quieres la casa?", valor: color, set: setColor, opciones: colores } : null;
  return (<Comprar url="/api/comprar" body={{ id, color, detalles: [] }} metodos={metodos} disabled={!!bloqueo} off={bloqueo} total={total} label={label} totalLabel={totalLabel} campo={campo} />);
}
