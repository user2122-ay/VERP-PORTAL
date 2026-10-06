import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { canAdmin } from "@/lib/roles";
import Admin from "./Admin";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser(); if (!canAdmin(u.rank)) redirect("/");
  const d = await db();
  const items = (await d.collection("items").find().sort({ _id: -1 }).toArray()).map((i) => ({ id: String(i._id), name: i.name, price: i.price }));
  const reps = (await d.collection("reports").find().sort({ at: -1 }).limit(30).toArray()).map((r) => ({ id: String(r._id), t: `${r.tipo} · ${r.zona} · ${r.nombre}`, d: r.desc, e: r.estado }));
  return <Shell user={u}><Admin rank={u.rank} items={items} reps={reps} /></Shell>;
}
