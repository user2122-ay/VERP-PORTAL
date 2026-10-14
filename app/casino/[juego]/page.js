import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import Casino from "../Casino";
import Dados from "../Dados";
import { Ruleta, Blackjack, Hipodromo } from "../Mesas";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tieneTelefono } from "@/lib/redes";
import { metodosDe } from "@/lib/pago";
import { appVisible, ecoCfg, saldoCasino } from "@/lib/reserva";
import { apuestaMax, casinoAbierto } from "@/lib/casino";
export const dynamic = "force-dynamic";
const JUEGOS = { tragamonedas: "Tragamonedas", ruleta: "Ruleta Española", blackjack: "Blackjack", hipodromo: "Hipódromo", dados: "Dados 1 vs 1" };
export const generateMetadata = ({ params }) => ({ title: `${JUEGOS[params.juego] || "Casino"} · VE:RP` });
const Falta = ({ t, p }) => <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}><b>{t}</b><p className="mut">{p}</p></div>;
// Cada juego es su propia app del teléfono: /casino/tragamonedas, /casino/ruleta, /casino/blackjack, /casino/hipodromo y /casino/dados.
export default async function P({ params }) {
  if (!JUEGOS[params.juego]) notFound();
  const u = await needUser(), d = await db();
  if (!tieneTelefono(u)) return <Shell user={u}><Falta t="Necesitas un teléfono" p="Compra un celular en el Mercado (Telefonía)." /></Shell>;
  if (!(await appVisible(d, u, "casino"))) return <Shell user={u}><Falta t={`${JUEGOS[params.juego]} no disponible`} p="Todavía está en beta." /></Shell>;
  const cfg = await ecoCfg(d), f = await saldoCasino(d), m = { metodos: metodosDe(u), imp: cfg.impGan, abierto: casinoAbierto(f), max: apuestaMax(f) }, j = params.juego;
  return <Shell user={u}>{j === "tragamonedas" ? <Casino {...m} beta={cfg.casino === "beta"} /> : j === "ruleta" ? <Ruleta {...m} /> : j === "blackjack" ? <Blackjack {...m} /> : j === "hipodromo" ? <Hipodromo {...m} /> : <Dados metodos={m.metodos} imp={m.imp} />}</Shell>;
}
