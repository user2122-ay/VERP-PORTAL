import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickAutomatico } from "@/lib/erlcauto";
export const dynamic = "force-dynamic";
let c = { n: 0, t: 0 };
// Cantidad de miembros registrados (con cédula). Se guarda 30 segundos para no consultar la base en cada visita.
export async function GET() {
  try { await tickAutomatico(await db()); } catch {} // este aviso se consulta cada minuto desde la cabecera: aprovecha para mandar los mensajes automáticos de ER:LC
  if (Date.now() - c.t > 3e4) c = { n: await (await db()).collection("users").countDocuments({ cedula: { $exists: true } }), t: Date.now() };
  return NextResponse.json({ n: c.n });
}
