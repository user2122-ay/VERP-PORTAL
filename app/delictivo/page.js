import Shell from "@/components/Shell";
import Delictivo from "./Delictivo";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { esRol } from "@/lib/rol";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser(); if (!(await esRol(u, "delictivo"))) redirect("/");
  const d = await db(), as = await d.collection("asaltos").find({ from: u.id }).sort({ at: -1 }).limit(10).toArray(), rb = await d.collection("robos").find({ user: u.id }).sort({ at: -1 }).limit(10).toArray();
  const asaltos = as.map((a) => ({ id: String(a._id), t: a.toName, e: a.estado, at: a.at.toISOString(), ent: a.entregado || [] })), robos = rb.map((r) => ({ id: String(r._id), t: `${r.modelo} · ${r.placa}`, e: r.estado, m: r.motivo || "", at: r.at.toISOString() }));
  return <Shell user={u}><div className="dk" style={{ maxWidth: 760, margin: "0 auto" }}><Delictivo asaltos={asaltos} robos={robos} /></div></Shell>;
}
