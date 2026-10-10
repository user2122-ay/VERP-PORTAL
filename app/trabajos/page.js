import Shell from "@/components/Shell";
import Trabajos from "./Trabajos";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BANCOS } from "@/lib/bancos";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser(), d = await db();
  const mias = (await d.collection("trabajos").find({ user: u.id }).sort({ at: -1 }).limit(15).toArray()).map((r) => ({ id: String(r._id), trabajo: r.trabajoN, horas: r.horas, total: r.total, estado: r.estado, motivo: r.motivo || "", at: r.at.toISOString() }));
  const cuentas = [{ k: "efectivo", label: "Efectivo" }, ...Object.keys(u.cuentas || {}).filter((k) => BANCOS[k] && !BANCOS[k].comercial).map((k) => ({ k, label: `Tarjeta ${BANCOS[k].corto}` }))];
  return <Shell user={u}><Trabajos roblox={u.cedula?.roblox || ""} cuentas={cuentas} mias={mias} /></Shell>;
}
