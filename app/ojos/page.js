import Shell from "@/components/Shell";
import Ojos from "./Ojos";
import { needUser } from "@/lib/auth";
import { adminFresca, staffRank } from "@/lib/admin";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser({ noCedula: true }); if (!["DEVELOPER", "FUNDACION", "JUNTA_DIRECTIVA"].includes(await staffRank(u))) redirect("/"); if (!adminFresca(u)) redirect("/admin"); // pide primero el acceso de Administración
  return <Shell user={u}><Ojos /></Shell>;
}
