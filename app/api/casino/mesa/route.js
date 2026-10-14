import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { tieneTelefono } from "@/lib/redes";
import { appVisible, saldoCasino } from "@/lib/reserva";
import { apuestaMax, casinoAbierto, MIN } from "@/lib/casino";
import { cobrar, liquidar, estadoCasino } from "@/lib/mesa";
import { validarApuestas, premioRuleta, valorMano, esBJ, NOMBRES, PASOS, EDGE } from "@/lib/juegos";
export const dynamic = "force-dynamic";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s }), ri = (n) => crypto.randomInt(n), rf = () => crypto.randomInt(1e9) / 1e9;
const barajar = () => { const a = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Ruleta española (0-36, un solo cero), Blackjack y Hipódromo. El servidor decide TODO; el casino debe poder pagar el premio máximo (apuestaMax) o está cerrado.
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401); const d = await db();
  if (!tieneTelefono(u) || !(await appVisible(d, u, "casino"))) return bad("El casino no está disponible", 403);
  const b = await req.json().catch(() => ({})), fondo = await saldoCasino(d), mx = apuestaMax(fondo), abierto = casinoAbierto(fondo), out = async (x) => NextResponse.json({ ok: true, ...x, ...(await estadoCasino(d, u.id)) });
  const cierre = "🔒 El casino está cerrado por el momento: se quedó sin fondos. Vuelve cuando Administración le asigne más.";
  const bj = d.collection("bj"), hip = d.collection("hipodromo");
  const vista = (g) => ({ p: g.p, c: g.fin ? g.c : [g.c[0]], vp: valorMano(g.p).total, vc: g.fin ? valorMano(g.c).total : null, fin: g.fin, monto: g.monto, doble: !!g.doble, res: g.res || null, puedeDoblar: !g.fin && g.p.length === 2 && !g.doble && g.monto * 2 <= mx });
  async function cerrarBJ(g, premio) { // resuelve y paga una sola vez
    const r = await bj.updateOne({ _id: u.id, fin: false }, { $set: { fin: true, p: g.p, c: g.c, doble: g.doble, monto: g.monto, deck: g.deck, res: { pendiente: true } } }); if (!r.modifiedCount) return (await bj.findOne({ _id: u.id }));
    const res = await liquidar(d, u, { apuesta: g.monto, premio, deposito: g.dep, juego: "Blackjack" }); g.fin = true; g.res = res; await bj.updateOne({ _id: u.id }, { $set: { res } }); return g;
  }
  switch (b.a) {
    case "ruleta": {
      if (!abierto) return bad(cierre, 409); const ap = validarApuestas(b.apuestas); if (!ap) return bad("Apuestas inválidas (mínimo $100 cada una)"); const total = ap.reduce((s, x) => s + x.m, 0); if (total > mx) return bad(`Máximo por giro: $${mx.toLocaleString("es")} (lo que el fondo del casino puede pagar)`);
      const e = await cobrar(d, u, b.pago, total); if (e) return bad(e); const n = ri(37), premio = premioRuleta(n, ap), r = await liquidar(d, u, { apuesta: total, premio, deposito: b.deposito, juego: "Ruleta" }); return out({ num: n, total, ...r });
    }
    case "bj_estado": { const g = await bj.findOne({ _id: u.id }); return out({ juego: g && !g.fin ? vista(g) : null }); }
    case "bj_start": {
      const ya = await bj.findOne({ _id: u.id }); if (ya && !ya.fin) return out({ juego: vista(ya) });
      if (!abierto) return bad(cierre, 409); const monto = Math.floor(Number(b.monto)); if (!(monto >= MIN && monto <= mx)) return bad(`La apuesta va de $${MIN} a $${mx.toLocaleString("es")}`);
      const e = await cobrar(d, u, b.pago, monto); if (e) return bad(e); const deck = barajar(), g = { _id: u.id, monto, pago: b.pago, dep: b.deposito, p: [deck.pop(), deck.pop()], c: [], fin: false, doble: false, deck, at: new Date() }; g.c = [deck.pop(), deck.pop()];
      await bj.replaceOne({ _id: u.id }, g, { upsert: true });
      if (esBJ(g.p) || esBJ(g.c)) { const premio = esBJ(g.p) && esBJ(g.c) ? monto : esBJ(g.p) ? Math.floor(monto * 2.5) : 0; return out({ juego: vista(await cerrarBJ(g, premio)) }); }
      return out({ juego: vista(g) });
    }
    case "bj_pedir": case "bj_plantarse": case "bj_doblar": {
      const g = await bj.findOne({ _id: u.id }); if (!g || g.fin) return bad("No tienes una mano en juego");
      if (b.a === "bj_doblar") { if (g.p.length !== 2 || g.doble || g.monto * 2 > mx) return bad("No puedes doblar ahora"); const e = await cobrar(d, u, g.pago, g.monto, false); if (e) return bad(e); g.monto *= 2; g.doble = true; }
      if (b.a !== "bj_plantarse") { g.p.push(g.deck.pop()); const v = valorMano(g.p).total; if (v > 21) return out({ juego: vista(await cerrarBJ(g, 0)) }); if (b.a === "bj_pedir" && v < 21) { await bj.updateOne({ _id: u.id, fin: false }, { $set: { p: g.p, deck: g.deck } }); return out({ juego: vista(g) }); } }
      while (valorMano(g.c).total < 17) g.c.push(g.deck.pop()); // la casa se planta en 17
      const vp = valorMano(g.p).total, vc = valorMano(g.c).total, premio = vc > 21 || vp > vc ? g.monto * 2 : vp === vc ? g.monto : 0; return out({ juego: vista(await cerrarBJ(g, premio)) });
    }
    case "hip_card": { // programa de la carrera: 6 caballos con su cuota
      const ps = NOMBRES.map((n) => [n, rf()]).sort((a, c) => a[1] - c[1]).slice(0, 6).map(([n]) => n), w = ps.map(() => 1 + rf() * 4), sw = w.reduce((a, c) => a + c, 0);
      const card = ps.map((n, i) => { const p = w[i] / sw; return { n, p, cuota: Math.max(1.2, Math.round((EDGE / p) * 10) / 10) }; });
      await hip.replaceOne({ _id: u.id }, { _id: u.id, card, at: new Date() }, { upsert: true }); return out({ card: card.map((c) => ({ n: c.n, cuota: c.cuota })) });
    }
    case "hip_correr": {
      if (!abierto) return bad(cierre, 409); const monto = Math.floor(Number(b.monto)), cab = Math.floor(Number(b.caballo)); if (!(monto >= MIN && monto <= mx)) return bad(`La apuesta va de $${MIN} a $${mx.toLocaleString("es")}`); if (!(cab >= 0 && cab < 6)) return bad("Elige un caballo");
      const doc = await hip.findOneAndDelete({ _id: u.id }); const card = doc?.card || doc?.value?.card; if (!card) return bad("La carrera ya corrió: abre el programa de nuevo");
      const e = await cobrar(d, u, b.pago, monto); if (e) { await hip.replaceOne({ _id: u.id }, { _id: u.id, card, at: new Date() }, { upsert: true }); return bad(e); }
      let r = rf(), gan = 0; for (let i = 0; i < 6; i++) { r -= card[i].p; if (r <= 0) { gan = i; break; } gan = i; }
      const T = card.map((_, i) => (i === gan ? 1 : 1.03 + rf() * 0.3)), fase = T.map(() => rf() * 6), frames = []; const mxp = T.map(() => 0);
      for (let k = 0; k <= PASOS; k++) frames.push(T.map((t, i) => { const x = k / PASOS, v = Math.min(1 / t, x / t + Math.sin(fase[i] + k * 0.35) * 0.045 * x * (1 - x) * 4); mxp[i] = Math.max(mxp[i], v); return Math.round(mxp[i] * 1000) / 1000; }));
      const premio = cab === gan ? Math.floor(monto * card[cab].cuota) : 0, res = await liquidar(d, u, { apuesta: monto, premio, deposito: b.deposito, juego: "Hipódromo" });
      return out({ frames, ganador: gan, caballo: cab, cuota: card[cab].cuota, ...res });
    }
    default: return bad("Acción inválida");
  }
}
