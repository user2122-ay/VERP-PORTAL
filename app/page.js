import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BANCOS } from "@/lib/bancos";
import Link from "next/link";
import { Contact, Landmark, Store, Package, Siren } from "lucide-react";
import Cuerpo from "./Cuerpo";
import { getFull } from "@/lib/roblox";
export const dynamic = "force-dynamic";
// Para sumar módulos nuevos al panel basta con agregar una línea aquí: [ruta, título, descripción, icono]
const MODULOS = [["/cedula", "Cédula", "Tu identidad", Contact], ["/banco", "Banco", "Cuentas y transferencias", Landmark], ["/mercado", "Mercado", "Tarjetas, chips y más", Store], ["/inventario", "Inventario", "Tus pertenencias", Package], ["/emergencias", "Emergencias 911", "Reportar al MDT", Siren]];
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
export default async function P() {
  const u = await needUser(), d = await db(), cu = u.cuentas || {}, h = (new Date().getUTCHours() + 20) % 24, hola = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  const bancos = Object.keys(BANCOS).reduce((a, k) => a + (cu[k]?.saldo || 0), 0), sin = await d.collection("notifs").countDocuments({ uid: u.id, read: false });
  // Avatar de cuerpo completo (se guarda 12 horas para no pedirlo en cada visita)
  let img = u.cuerpoImg || u.cedula.avatar || null;
  if (u.cedula.robloxId && (!u.cuerpoImg || Date.now() - +new Date(u.cuerpoImgAt || 0) > 432e5)) { const n = await getFull(u.cedula.robloxId); if (n) { img = n; await d.collection("users").updateOne({ id: u.id }, { $set: { cuerpoImg: n, cuerpoImgAt: new Date() } }); } }
  const ahora = Date.now(), cp = u.cuerpo || {}, ser = (e) => ({ n: e?.n ?? 100, t: new Date(e?.t || ahora).toISOString() });
  return (<Shell user={u}><div style={{ maxWidth: 1100, margin: "0 auto" }}>
    <div className="hero"><img src="/banner.jpg" alt="VE:RP" className="hero-b" /><p style={{ margin: 0, opacity: 0.85 }}>{hola},</p><h2 style={{ margin: "2px 0 14px" }}>{u.cedula.nombres.split(" ")[0]} {u.cedula.apellidos.split(" ")[0]}</h2>
      <small style={{ opacity: 0.8 }}>Patrimonio total</small><div className="big">{$(u.balance + bancos)}</div>
      <div className="stats"><div><small>Efectivo</small><b>{$(u.balance)}</b></div><div><small>En bancos</small><b>{$(bancos)}</b></div><div><small>Avisos sin leer</small><b>{sin}</b></div><div><small>Rango</small><b>{u.rank ? u.rank.replace("_", " ") : "Ciudadano"}</b></div></div></div>
    <div className="tiles">{MODULOS.map(([h, t, s, I]) => <Link key={h} href={h} className="tile"><I size={26} className="neon" /><b>{t}</b><span className="mut">{s}</span></Link>)}</div>
    <Cuerpo comida={ser(cp.comida)} agua={ser(cp.agua)} img={img} ahora={ahora} /></div></Shell>);
}
