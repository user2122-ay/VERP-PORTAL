import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BANCOS } from "@/lib/bancos";
import Link from "next/link";
import { Contact, Landmark, Store, Package, MessageCircle, Siren } from "lucide-react";
export const dynamic = "force-dynamic";
// Para sumar módulos nuevos al panel basta con agregar una línea aquí: [ruta, título, descripción, icono]
const MODULOS = [["/cedula", "Cédula", "Tu identidad", Contact], ["/banco", "Banco", "Cuentas y transferencias", Landmark], ["/mercado", "Mercado", "Tarjetas, chips y más", Store], ["/inventario", "Inventario", "Tus pertenencias", Package], ["/whatsapp", "VE WhatsApp", "Chats con tus contactos", MessageCircle], ["/emergencias", "Emergencias 911", "Reportar al MDT", Siren]];
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
export default async function P() {
  const u = await needUser(), d = await db(), cu = u.cuentas || {}, h = (new Date().getUTCHours() + 20) % 24, hola = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  const bancos = Object.keys(BANCOS).reduce((a, k) => a + (cu[k]?.saldo || 0), 0), sin = await d.collection("notifs").countDocuments({ uid: u.id, read: false });
  const mov = await d.collection("tx").find({ user: u.id }).sort({ at: -1 }).limit(5).toArray(), av = await d.collection("notifs").find({ uid: u.id }).sort({ at: -1 }).limit(4).toArray();
  return (<Shell user={u}><div style={{ maxWidth: 1100, margin: "0 auto" }}>
    <div className="hero"><img src="/ve-logo.png" alt="" /><p style={{ margin: 0, opacity: 0.85 }}>{hola},</p><h2 style={{ margin: "2px 0 14px" }}>{u.cedula.nombres.split(" ")[0]} {u.cedula.apellidos.split(" ")[0]}</h2>
      <small style={{ opacity: 0.8 }}>Patrimonio total</small><div className="big">{$(u.balance + bancos)}</div>
      <div className="stats"><div><small>Efectivo</small><b>{$(u.balance)}</b></div><div><small>En bancos</small><b>{$(bancos)}</b></div><div><small>Avisos sin leer</small><b>{sin}</b></div><div><small>Rango</small><b>{u.rank ? u.rank.replace("_", " ") : "Ciudadano"}</b></div></div></div>
    <div className="tiles">{MODULOS.map(([h, t, s, I]) => <Link key={h} href={h} className="tile"><I size={26} className="neon" /><b>{t}</b><span className="mut">{s}</span></Link>)}</div>
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
      <div className="card"><b>Movimientos recientes</b>{mov.length ? mov.map((m) => <div key={String(m._id)} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid var(--bd)" }}><span>{m.item}</span><b style={{ color: m.amount < 0 ? "var(--bad)" : "var(--ok)", whiteSpace: "nowrap" }}>{m.amount < 0 ? "-" : "+"}{$(Math.abs(m.amount))}</b></div>) : <p className="mut">Sin movimientos aún.</p>}<Link href="/banco" className="mut">Ver banco →</Link></div>
      <div className="card"><b>Avisos</b>{av.length ? av.map((n) => <div key={String(n._id)} style={{ padding: "8px 0", borderTop: "1px solid var(--bd)", opacity: n.read ? 0.65 : 1 }}><b>{n.title}</b><div className="mut">{n.body}</div></div>) : <p className="mut">No tienes avisos.</p>}<Link href="/notificaciones" className="mut">Ver todos →</Link></div></div></div></Shell>);
}
