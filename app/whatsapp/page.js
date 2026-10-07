import Shell from "@/components/Shell";
import Chat from "./Chat";
import Plan from "./Plan";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CHIP_PRECIO, tieneTelefono } from "@/lib/redes";
import { planesDe } from "@/lib/negocios";
export const dynamic = "force-dynamic";
const Falta = ({ t, p }) => <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}><b>{t}</b><p className="mut">{p}</p><a className="btn" href="/mercado">Ir al Mercado</a></div>;
export default async function P() {
  const u = await needUser();
  return (<Shell user={u}>{!tieneTelefono(u) ? <Falta t="Necesitas un teléfono" p="Compra un celular en el Mercado (sección Telefonía). WhatsApp e Instagram solo funcionan con teléfono y chip." />
    : !u.chip ? <Falta t="Necesitas una línea telefónica" p={`Compra tu chip en el Mercado por $${CHIP_PRECIO}. Te asignan un número +58 con tu cédula.`} />
    : !u.plan ? <Plan planes={await planesDe(await db())} /> : <Chat />}</Shell>);
}
