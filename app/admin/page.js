import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { canAdmin } from "@/lib/roles";
import { staffRank } from "@/lib/admin";
import Admin from "./Admin";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser(), rank = await staffRank(u); if (!canAdmin(rank)) redirect("/");
  const d = await db();
  const items = (await d.collection("items").find().sort({ _id: -1 }).toArray()).map((i) => ({ id: String(i._id), name: i.name, category: i.category, price: i.price }));
  const reps = (await d.collection("reports").find({ estado: { $ne: "resuelto" } }).sort({ at: -1 }).limit(30).toArray()).map((r) => ({ id: String(r._id), t: `${r.tipo} · ${r.zona} · ${r.nombre}`, d: r.desc, e: r.estado }));
  const audit = (await d.collection("audit").find().sort({ at: -1 }).limit(100).toArray()).map((x) => ({ id: String(x._id), at: x.at.toISOString(), by: x.byName, rank: x.rank, act: x.act, obj: x.objetivo || x.name || x.uid || "", razon: x.razon || "" }));
  return <Shell user={{ ...u, rank }}><Admin rank={rank} items={items} reps={reps} audit={audit} /></Shell>;
}
