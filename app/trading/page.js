import Shell from "@/components/Shell";
import Trading from "./Trading";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tieneTelefono } from "@/lib/redes";
import { metodosDe } from "@/lib/pago";
import { appVisible, ecoCfg } from "@/lib/reserva";
export const dynamic = "force-dynamic";
export const metadata = { title: "Trading · VE:RP" };
const Falta = ({ t, p }) => <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}><b>{t}</b><p className="mut">{p}</p></div>;
export default async function P() {
  const u = await needUser(), d = await db();
  if (!tieneTelefono(u)) return <Shell user={u}><Falta t="Necesitas un teléfono" p="Compra un celular en el Mercado (Telefonía)." /></Shell>;
  if (!(await appVisible(d, u, "trading"))) return <Shell user={u}><Falta t="Trading no disponible" p="Todavía está en beta." /></Shell>;
  const c = await ecoCfg(d);
  return <Shell user={u}><Trading metodos={metodosDe(u)} hold={u.trading?.hold || {}} imp={c.impGan} beta={c.trading === "beta"} /></Shell>;
}
