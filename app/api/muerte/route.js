import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { nombreDe } from "@/lib/rol";
import { aplicarCK } from "@/lib/ck";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// Solo para personajes muertos por sed o hambre: apelar el CK (llega a Staff) o crear otro usuario.
export async function POST(req) {
  const u = await apiUser({ muerto: true }); if (!u?.muerte) return bad("Tu personaje está vivo", 403);
  const b = await req.json().catch(() => ({})), d = await db(), at = new Date();
  if (b.accion === "apelar") {
    const razon = String(b.razon || "").trim().slice(0, 700); if (razon.length < 20) return bad("Explica el motivo con detalle (mínimo 20 letras)");
    if (await d.collection("apelaciones").findOne({ uid: u.id, estado: "pendiente" })) return bad("Ya enviaste una apelación. Abre un ticket en el Discord de la comunidad para hablar con el equipo");
    await d.collection("apelaciones").insertOne({ uid: u.id, nombre: nombreDe(u), causa: u.muerte.causa, muerteAt: u.muerte.at, razon, estado: "pendiente", at });
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "nuevo") { await aplicarCK(d, u); await d.collection("apelaciones").updateMany({ uid: u.id, estado: "pendiente" }, { $set: { estado: "cerrada", resuelto: at } }); return NextResponse.json({ ok: true }); }
  return bad("Acción inválida");
}
