import Shell from "@/components/Shell";
import TikVerp from "./TikVerp";
import { needUser } from "@/lib/auth";
import { tieneTelefono } from "@/lib/redes";
import { TIKTOK_SOLO_DEV } from "@/lib/tikverp";
export const dynamic = "force-dynamic";
export const metadata = { title: "VE TikTok · VE:RP" };
export default async function P({ searchParams }) {
  const u = await needUser();
  if (TIKTOK_SOLO_DEV && !u.dev) return <Shell user={u}><div className="card" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}><b>🛠️ VE TikTok está en mantenimiento</b><p className="mut">Lo estamos arreglando (los videos y fotos se vencían). Tus rachas y tu perfil no se pierden: volverá pronto.</p><a className="btn" href="/whatsapp">Volver al teléfono</a></div></Shell>;
  if (!tieneTelefono(u)) return <Shell user={u}><div className="card" style={{ maxWidth: 420, margin: "0 auto" }}><b>Necesitas un teléfono</b><p className="mut">Compra un celular en el Mercado (sección Telefonía) para entrar a VE TikTok.</p><a className="btn" href="/mercado?c=Telefon%C3%ADa">Ir al Mercado</a></div></Shell>;
  return <Shell user={u}><TikVerp v={searchParams?.v || ""} /></Shell>;
}
