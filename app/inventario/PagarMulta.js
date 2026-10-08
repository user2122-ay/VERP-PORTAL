"use client";
import Comprar from "../mercado/PagoModal";
export default function PagarMulta({ id, monto, metodos }) { return <Comprar url="/api/multas" body={{ id }} metodos={metodos} total={monto} totalLabel="Total a pagar" label="Pagar multa" msg="Multa pagada." />; }
