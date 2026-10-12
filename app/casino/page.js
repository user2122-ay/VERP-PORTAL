import Shell from "@/components/Shell";
import Casino from "./Casino";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tieneTelefono } from "@/lib/redes";
import { metodosDe } from "@/lib/pago";
import { appVisible, ecoCfg } from "@/lib/reserva";
export const dynamic = "force-dynamic";
export const metadata = { title: "Casino · VE:RP" };
const Falta = ({ t, p }) => <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}><b>{t}</b><p className="mut">{p}</p></div>;
export default async function P() {
  const u = await needUser(), d = await db();
  if (!tieneTelefono(u)) return <Shell user={u}><Falta t="Necesitas un teléfono" p="Compra un celular en el Mercado (Telefonía)." /></Shell>;
  if (!(await appVisible(d, u, "casino"))) return <Shell user={u}><Falta t="Casino no disponible" p="Todavía está en beta." /></Shell>;
  return <Shell user={u}><Casino metodos={metodosDe(u)} imp={(await ecoCfg(d)).impGan} beta={(await ecoCfg(d)).casino === "beta"} /></Shell>;
}
