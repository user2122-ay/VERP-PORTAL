import Shell from "@/components/Shell";
import Delictivo from "./Delictivo";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { esRol } from "@/lib/rol";
import { redirect } from "next/navigation";
import { tieneVpn } from "@/lib/vpn";
import { Lock } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser(); if (!(await esRol(u, "delictivo"))) redirect("/");
  if (!tieneVpn(u)) return (<Shell user={u}><div className="card" style={{ maxWidth: 520, margin: "40px auto", textAlign: "center", borderColor: "var(--bad)" }}><Lock size={48} color="#ff4d5e" /><h2>Acceso denegado</h2><p className="mut">Necesitas una VPN para entrar a la parte delictiva, la misma de la Dark Web. Compra el acceso (dura 5 días) en la Tienda del Mercado.</p><span className="tag" style={{ color: "var(--bad)" }}>Conexión no segura · Acceso bloqueado</span></div></Shell>);
  const d = await db(), as = await d.collection("asaltos").find({ from: u.id }).sort({ at: -1 }).limit(10).toArray(), rb = await d.collection("robos").find({ user: u.id }).sort({ at: -1 }).limit(10).toArray();
  const asaltos = as.map((a) => ({ id: String(a._id), t: a.toName, e: a.estado, at: a.at.toISOString(), ent: a.entregado || [] })), robos = rb.map((r) => ({ id: String(r._id), t: `${r.modelo} · ${r.placa}`, e: r.estado, m: r.motivo || "", at: r.at.toISOString() }));
  return <Shell user={u}><div className="dk" style={{ maxWidth: 760, margin: "0 auto" }}><Delictivo asaltos={asaltos} robos={robos} /></div></Shell>;
}
