import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { tieneTelefono } from "@/lib/redes";
import { pagoKey, pagarA, metodosDe } from "@/lib/pago";
import { appVisible, impuestoGanancia } from "@/lib/reserva";
import { nombreDe } from "@/lib/rol";
import { valorMano, esBJ } from "@/lib/juegos";
import { MIN_BJ, MAX_BJ, VENCE_MIN, MAX_ABIERTAS, ESPERA_MS, mazoNuevo, puntaje } from "@/lib/salasbj";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
const money = (n) => `$${Number(n).toLocaleString("es")}`;
async function acceso() { const u = await apiUser(); if (!u?.cedula) return [null, bad("Sin sesión", 401)]; const d = await db(); if (!tieneTelefono(u) || !(await appVisible(d, u, "casino"))) return [null, bad("No disponible", 403)]; return [{ u, d }]; }
const notif = (d, uid, title, body) => d.collection("notifs").insertOne({ uid, title, body, at: new Date(), read: false });
// Sala sin rival en 30 min: se devuelve la apuesta a quien la creó.
async function vencer(d) {
  const c = d.collection("bj_salas");
  for (const r of await c.find({ estado: "esperando", at: { $lt: new Date(Date.now() - VENCE_MIN * 6e4) } }).limit(20).toArray()) if ((await c.updateOne({ _id: r._id, estado: "esperando" }, { $set: { estado: "vencida" } })).modifiedCount) await pagarA(d, r.from, r.pagoA, r.monto);
}
async function resolver(d, s) {
  const c = d.collection("bj_salas"); if (!(await c.updateOne({ _id: s._id, estado: "jugando" }, { $set: { estado: "resolviendo" } })).modifiedCount) return;
  const pa = puntaje(s.a.c), pb = puntaje(s.b.c), at = new Date(), empate = pa === pb, m = money(s.monto); let gan = null, neto = 0, imp = 0;
  if (empate) { await pagarA(d, s.from, s.pagoA, s.monto); await pagarA(d, s.rival, s.pagoB, s.monto); }
  else { gan = pa > pb ? s.from : s.rival; imp = await impuestoGanancia(d, s.monto, "Impuesto a ganancias de blackjack (sala)"); neto = s.monto * 2 - imp; await pagarA(d, gan, gan === s.from ? s.depA : s.depB, neto); }
  await c.updateOne({ _id: s._id }, { $set: { estado: "terminada", empate, ganador: gan, neto, imp, finAt: at } });
  if (!empate) await d.collection("tx").insertMany([{ user: s.from, type: "blackjack", item: `Blackjack en sala vs ${s.rivalName}: ${gan === s.from ? "ganaste" : "perdiste"} ${m}`, amount: gan === s.from ? neto - s.monto : -s.monto, at }, { user: s.rival, type: "blackjack", item: `Blackjack en sala vs ${s.fromName}: ${gan === s.rival ? "ganaste" : "perdiste"} ${m}`, amount: gan === s.rival ? neto - s.monto : -s.monto, at }]);
  const t = (uid, otro) => (empate ? ["Empate en Blackjack", `Empataste con ${otro}: te devolvimos tu apuesta de ${m}.`] : gan === uid ? ["¡Ganaste en Blackjack!", `Le ganaste a ${otro} en la sala: recibes ${money(neto)}.`] : ["Perdiste en Blackjack", `${otro} te ganó la sala de ${m}.`]);
  await notif(d, s.from, ...t(s.from, s.rivalName)); await notif(d, s.rival, ...t(s.rival, s.fromName));
}
// Si alguien lleva más de 3 minutos sin jugar, su mano se planta sola; cuando los dos terminan se resuelve.
async function avanzar(d, s) {
  const c = d.collection("bj_salas"); if (!s || s.estado !== "jugando") return s;
  if (Date.now() - +new Date(s.ult) > ESPERA_MS) { await c.updateOne({ _id: s._id, estado: "jugando" }, { $set: { "a.fin": true, "b.fin": true } }); s = await c.findOne({ _id: s._id }); }
  if (s.estado === "jugando" && s.a.fin && s.b.fin) { await resolver(d, s); s = await c.findOne({ _id: s._id }); }
  return s;
}
function vista(s, uid) {
  const soyA = s.from === uid, yo = soyA ? s.a : s.b, el = soyA ? s.b : s.a, fin = s.estado === "terminada";
  return { id: String(s._id), estado: s.estado, monto: s.monto, rival: soyA ? s.rivalName : s.fromName, mias: yo.c, miTotal: valorMano(yo.c).total, miFin: !!yo.fin, suyasN: el.c.length, suyoFin: !!el.fin, suyas: fin ? el.c : null, suTotal: fin ? valorMano(el.c).total : null, gane: fin && s.ganador === uid, empate: !!(fin && s.empate), neto: s.neto || 0, imp: s.imp || 0, ventaja: Math.max(0, ESPERA_MS - (Date.now() - +new Date(s.ult))) };
}
export async function GET() {
  const [x, e] = await acceso(); if (e) return e; const { u, d } = x, c = d.collection("bj_salas"); await vencer(d);
  for (const s of await c.find({ estado: "jugando", ult: { $lt: new Date(Date.now() - ESPERA_MS) } }).limit(10).toArray()) await avanzar(d, s);
  const mia = { $or: [{ from: u.id }, { rival: u.id }] };
  const cur = (await c.findOne({ ...mia, estado: "jugando" })) || (await c.findOne({ ...mia, estado: "terminada", visto: { $ne: u.id } }, { sort: { finAt: -1 } }));
  const ab = await c.find({ estado: "esperando", $or: [{ para: null }, { para: u.id }, { from: u.id }] }).sort({ at: -1 }).limit(30).toArray();
  const hist = await c.find({ ...mia, estado: "terminada" }).sort({ finAt: -1 }).limit(8).toArray();
  return NextResponse.json({ metodos: metodosDe(u), activa: cur ? vista(await avanzar(d, cur), u.id) : null,
    abiertas: ab.map((r) => ({ id: String(r._id), de: r.fromName, monto: r.monto, mio: r.from === u.id, paraMi: r.para === u.id, para: r.paraName || null, vence: new Date(+new Date(r.at) + VENCE_MIN * 6e4).toISOString() })),
    historial: hist.map((r) => { const v = vista(r, u.id); return { id: v.id, rival: v.rival, monto: r.monto, gane: v.gane, empate: v.empate, neto: v.neto, at: r.finAt }; }) });
}
export async function POST(req) {
  const [x, e] = await acceso(); if (e) return e; const { u, d } = x, bd = await req.json().catch(() => ({})), c = d.collection("bj_salas"), us = d.collection("users");
  if (bd.accion === "crear") {
    const monto = Math.floor(Number(bd.monto)); if (!(monto >= MIN_BJ && monto <= MAX_BJ)) return bad(`La apuesta va de $${MIN_BJ} a $${MAX_BJ.toLocaleString("es")}`);
    if ((await c.countDocuments({ from: u.id, estado: "esperando" })) >= MAX_ABIERTAS) return bad(`Máximo ${MAX_ABIERTAS} salas abiertas a la vez`);
    if (await c.findOne({ $or: [{ from: u.id }, { rival: u.id }], estado: "jugando" })) return bad("Ya estás jugando una sala: termínala primero");
    let para = null, paraName = null; const rx = String(bd.para || "").trim();
    if (rx) { const t = await us.findOne({ cedula: { $exists: true }, $or: [{ "cedula.roblox": { $regex: `^${rx.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }, { "cedula.num": rx }] }); if (!t) return bad("No encontré a ese jugador (usa su usuario de Roblox o su cédula)"); if (t.id === u.id) return bad("No puedes invitarte a ti mismo"); para = t.id; paraName = nombreDe(t); }
    const pk = pagoKey(u, bd.pago); if (!pk) return bad("Elige con qué pagar"); if (!(await us.updateOne({ id: u.id, [pk]: { $gte: monto } }, { $inc: { [pk]: -monto } })).modifiedCount) return bad("Saldo insuficiente");
    await c.insertOne({ from: u.id, fromName: nombreDe(u), monto, pagoA: bd.pago || "efectivo", depA: bd.deposito || "efectivo", para, paraName, estado: "esperando", at: new Date() });
    if (para) await notif(d, para, "Te invitaron a una sala de Blackjack", `${nombreDe(u)} te invita a jugar Blackjack 1 vs 1 por ${money(monto)}. Entra a Casino → Blackjack → Sala 1 vs 1.`);
    return NextResponse.json({ ok: true, msg: para ? "Sala creada y enviamos la invitación. Tu apuesta quedó reservada." : "Sala creada: tu apuesta quedó reservada. Si nadie entra en 30 minutos se te devuelve." });
  }
  const id = oid(bd.id), s = id && (await c.findOne({ _id: id })); if (!s) return bad("Esa sala ya no existe", 404);
  if (bd.accion === "visto") { await c.updateOne({ _id: id }, { $addToSet: { visto: u.id } }); return NextResponse.json({ ok: true }); }
  if (bd.accion === "cancelar") {
    if (s.from !== u.id) return bad("Solo quien creó la sala puede cancelarla", 403);
    if (!(await c.updateOne({ _id: id, estado: "esperando" }, { $set: { estado: "cancelada" } })).modifiedCount) return bad("Ya no se puede cancelar");
    await pagarA(d, s.from, s.pagoA, s.monto); return NextResponse.json({ ok: true, msg: "Sala cancelada: te devolvimos la apuesta" });
  }
  if (bd.accion === "unirse") {
    if (s.from === u.id) return bad("No puedes entrar a tu propia sala"); if (s.para && s.para !== u.id) return bad("Esa sala es para otra persona", 403);
    if (await c.findOne({ $or: [{ from: u.id }, { rival: u.id }], estado: "jugando" })) return bad("Ya estás jugando una sala: termínala primero");
    const pk = pagoKey(u, bd.pago); if (!pk) return bad("Elige con qué pagar");
    if (!(await c.updateOne({ _id: id, estado: "esperando" }, { $set: { estado: "entrando", rival: u.id } })).modifiedCount) return bad("Alguien más ya entró o la sala venció");
    if (!(await us.updateOne({ id: u.id, [pk]: { $gte: s.monto } }, { $inc: { [pk]: -s.monto } })).modifiedCount) { await c.updateOne({ _id: id }, { $set: { estado: "esperando" }, $unset: { rival: "" } }); return bad("Saldo insuficiente"); }
    const mz = mazoNuevo(), a = [mz[0], mz[2]], b = [mz[1], mz[3]];
    await c.updateOne({ _id: id }, { $set: { estado: "jugando", rivalName: nombreDe(u), pagoB: bd.pago || "efectivo", depB: bd.deposito || "efectivo", mazo: mz.slice(4), a: { c: a, fin: esBJ(a) }, b: { c: b, fin: esBJ(b) }, ult: new Date(), inicio: new Date() } });
    await notif(d, s.from, "Entraron a tu sala de Blackjack", `${nombreDe(u)} entró a tu sala de ${money(s.monto)}. ¡A jugar!`);
    let f = await c.findOne({ _id: id }); f = await avanzar(d, f); return NextResponse.json({ ok: true, activa: vista(f, u.id) });
  }
  if (bd.accion === "pedir" || bd.accion === "plantarse") {
    if (s.estado !== "jugando") return bad("La sala no está en juego"); const soyA = s.from === u.id; if (!soyA && s.rival !== u.id) return bad("No estás en esa sala", 403);
    const k = soyA ? "a" : "b"; if (s[k].fin) return bad("Ya terminaste tu mano");
    let upd; if (bd.accion === "plantarse") upd = { [`${k}.fin`]: true, ult: new Date() };
    else { const mano = [...s[k].c, s.mazo[0]], t = valorMano(mano).total; upd = { [`${k}.c`]: mano, [`${k}.fin`]: t >= 21, mazo: s.mazo.slice(1), ult: new Date() }; }
    if (!(await c.updateOne({ _id: id, estado: "jugando", [`${k}.fin`]: false, mazo: s.mazo }, { $set: upd })).modifiedCount) return bad("Intenta de nuevo");
    let f = await c.findOne({ _id: id }); f = await avanzar(d, f); return NextResponse.json({ ok: true, activa: vista(f, u.id) });
  }
  return bad("Acción inválida");
}
