import Shell from "@/components/Shell";
import TikVerp from "./TikVerp";
import { needUser } from "@/lib/auth";
import { tieneTelefono } from "@/lib/redes";
export const dynamic = "force-dynamic";
export const metadata = { title: "TikVerp · VE:RP" };
export default async function P({ searchParams }) {
  const u = await needUser();
  if (!tieneTelefono(u)) return <Shell user={u}><div className="card" style={{ maxWidth: 420, margin: "0 auto" }}><b>Necesitas un teléfono</b><p className="mut">Compra un celular en el Mercado (sección Telefonía) para entrar a TikVerp.</p><a className="btn" href="/mercado?c=Telefon%C3%ADa">Ir al Mercado</a></div></Shell>;
  return <Shell user={u}><TikVerp v={searchParams?.v || ""} /></Shell>;
}
