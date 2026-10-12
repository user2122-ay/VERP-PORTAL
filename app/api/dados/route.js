import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { tieneTelefono } from "@/lib/redes";
import { pagoKey, pagarA, metodosDe } from "@/lib/pago";
import { appVisible, impuestoGanancia } from "@/lib/reserva";
import { nombreDe } from "@/lib/rol";
import { duelo, MIN_D, MAX_D, VENCE_MIN, MAX_ABIERTAS } from "@/lib/dados";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
async function acceso() { const u = await apiUser(); if (!u?.cedula) return [null, bad("Sin sesión", 401)]; const d = await db(); if (!tieneTelefono(u) || !(await appVisible(d, u, "casino"))) return [null, bad("No disponible", 403)]; return [{ u, d }]; }
// Reto vencido (30 min sin que lo acepten): se devuelve la apuesta a quien lo creó.
async function vencer(d) {
  for (const r of await d.collection("dados").find({ estado: "abierto", at: { $lt: new Date(Date.now() - VENCE_MIN * 6e4) } }).limit(20).toArray()) {
    if ((await d.collection("dados").updateOne({ _id: r._id, estado: "abierto" }, { $set: { estado: "vencido" } })).modifiedCount) await pagarA(d, r.from, r.pago, r.monto);
  }
}
export async function GET() {
  const [x, e] = await acceso(); if (e) return e; const { u, d } = x; await vencer(d); const c = d.collection("dados");
  const ab = await c.find({ estado: "abierto", $or: [{ para: null }, { para: u.id }, { from: u.id }] }).sort({ at: -1 }).limit(30).toArray();
  const hist = await c.find({ estado: "jugado", $or: [{ from: u.id }, { rival: u.id }] }).sort({ jugadoAt: -1 }).limit(12).toArray();
  return NextResponse.json({ metodos: metodosDe(u), abiertas: ab.map((r) => ({ id: String(r._id), de: r.fromName, monto: r.monto, mio: r.from === u.id, paraMi: r.para === u.id, para: r.paraName || null, vence: new Date(+new Date(r.at) + VENCE_MIN * 6e4).toISOString() })),
    historial: hist.map((r) => { const soyA = r.from === u.id; return { id: String(r._id), rival: soyA ? r.rivalName : r.fromName, monto: r.monto, mios: soyA ? r.dadosA : r.dadosB, suyos: soyA ? r.dadosB : r.dadosA, gane: r.ganador === u.id, neto: r.neto, imp: r.imp, at: r.jugadoAt }; }) });
}
export async function POST(req) {
  const [x, e] = await acceso(); if (e) return e; const { u, d } = x, b = await req.json().catch(() => ({})), c = d.collection("dados"), us = d.collection("users");
  if (b.accion === "crear") {
    const monto = Math.floor(Number(b.monto)); if (!(monto >= MIN_D && monto <= MAX_D)) return bad(`La apuesta va de $${MIN_D} a $${MAX_D.toLocaleString("es")}`);
    if ((await c.countDocuments({ from: u.id, estado: "abierto" })) >= MAX_ABIERTAS) return bad(`Máximo ${MAX_ABIERTAS} retos abiertos a la vez`);
    let para = null, paraName = null; const rx = String(b.para || "").trim();
    if (rx) { const t = await us.findOne({ cedula: { $exists: true }, $or: [{ "cedula.roblox": { $regex: `^${rx.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }, { "cedula.num": rx }] }); if (!t) return bad("No encontré a ese jugador (usa su usuario de Roblox o su cédula)"); if (t.id === u.id) return bad("No puedes retarte a ti mismo"); para = t.id; paraName = nombreDe(t); }
    const pk = pagoKey(u, b.pago); if (!pk) return bad("Elige con qué pagar"); if (!(await us.updateOne({ id: u.id, [pk]: { $gte: monto } }, { $inc: { [pk]: -monto } })).modifiedCount) return bad("Saldo insuficiente");
    await c.insertOne({ from: u.id, fromName: nombreDe(u), monto, pago: b.pago || "efectivo", dep: b.deposito || "efectivo", para, paraName, estado: "abierto", at: new Date() });
    if (para) await d.collection("notifs").insertOne({ uid: para, title: "Te retaron a los dados", body: `${nombreDe(u)} te reta a una apuesta de $${monto.toLocaleString("es")} en Casino → Dados.`, at: new Date(), read: false });
    return NextResponse.json({ ok: true, msg: "Reto creado: tu apuesta quedó reservada. Si nadie lo acepta en 30 minutos se te devuelve." });
  }
  const id = oid(b.id), r = id && (await c.findOne({ _id: id })); if (!r) return bad("Ese reto ya no existe", 404);
  if (b.accion === "cancelar") {
    if (r.from !== u.id) return bad("Solo quien creó el reto puede cancelarlo", 403);
    if (!(await c.updateOne({ _id: id, estado: "abierto" }, { $set: { estado: "cancelado" } })).modifiedCount) return bad("Ya no se puede cancelar");
    await pagarA(d, r.from, r.pago, r.monto); return NextResponse.json({ ok: true, msg: "Reto cancelado: te devolvimos la apuesta" });
  }
  if (b.accion === "aceptar") {
    if (r.from === u.id) return bad("No puedes aceptar tu propio reto"); if (r.para && r.para !== u.id) return bad("Ese reto es para otra persona", 403);
    const pk = pagoKey(u, b.pago); if (!pk) return bad("Elige con qué pagar");
    if (!(await c.updateOne({ _id: id, estado: "abierto" }, { $set: { estado: "jugando", rival: u.id } })).modifiedCount) return bad("Alguien más ya lo aceptó o venció");
    if (!(await us.updateOne({ id: u.id, [pk]: { $gte: r.monto } }, { $inc: { [pk]: -r.monto } })).modifiedCount) { await c.updateOne({ _id: id }, { $set: { estado: "abierto" }, $unset: { rival: "" } }); return bad("Saldo insuficiente"); }
    const t = duelo(), gan = t.gana === "a" ? r.from : u.id, pozo = r.monto * 2, imp = await impuestoGanancia(d, r.monto, "Impuesto a ganancias de dados"), neto = pozo - imp;
    await pagarA(d, gan, gan === r.from ? r.dep : b.deposito, neto);
    await c.updateOne({ _id: id }, { $set: { estado: "jugado", rivalName: nombreDe(u), dadosA: t.a, dadosB: t.b, ganador: gan, neto, imp, jugadoAt: new Date() } });
    const m = `$${r.monto.toLocaleString("es")}`; await d.collection("tx").insertMany([{ user: r.from, type: "dados", item: `Dados vs ${nombreDe(u)}: ${gan === r.from ? "ganaste" : "perdiste"} ${m}`, amount: gan === r.from ? neto - r.monto : -r.monto, at: new Date() }, { user: u.id, type: "dados", item: `Dados vs ${r.fromName}: ${gan === u.id ? "ganaste" : "perdiste"} ${m}`, amount: gan === u.id ? neto - r.monto : -r.monto, at: new Date() }]);
    await d.collection("notifs").insertOne({ uid: r.from, title: gan === r.from ? "¡Ganaste en los dados!" : "Perdiste en los dados", body: `${nombreDe(u)} aceptó tu reto de ${m}: tú sacaste ${t.a[0] + t.a[1]}, él ${t.b[0] + t.b[1]}.`, at: new Date(), read: false });
    const f = await us.findOne({ id: u.id }); return NextResponse.json({ ok: true, mios: t.b, suyos: t.a, gane: gan === u.id, neto, imp, rival: r.fromName, monto: r.monto, metodos: metodosDe(f) });
  }
  return bad("Acción inválida");
}
