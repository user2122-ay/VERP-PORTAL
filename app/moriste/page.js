import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Moriste from "./Moriste";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser({ muerto: true }); if (!u.muerte) redirect("/");
  const ap = await (await db()).collection("apelaciones").findOne({ uid: u.id, muerteAt: u.muerte.at }, { sort: { at: -1 } });
  return <Moriste causa={u.muerte.causa} estado={ap?.estado || null} motivo={ap?.estado === "denegada" ? ap.motivo : null} discord={process.env.NEXT_PUBLIC_DISCORD_INVITE || ""} />;
}
