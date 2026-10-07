import Shell from "@/components/Shell";
import Chat from "./Chat";
import { needUser } from "@/lib/auth";
import { CHIP_PRECIO } from "@/lib/redes";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser();
  return (<Shell user={u}>{u.chip ? <Chat /> : <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}><b>Necesitas una línea telefónica</b><p className="mut">Compra tu chip en el Mercado por ${CHIP_PRECIO}. Te asignan un número +58 aleatorio.</p><a className="btn" href="/mercado">Ir al Mercado</a></div>}</Shell>);
}
