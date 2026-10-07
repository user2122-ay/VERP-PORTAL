"use client";
import Comprar from "./PagoModal";
export default function Buy({ id, metodos }) { return <Comprar url="/api/comprar" body={{ id }} metodos={metodos} />; }
