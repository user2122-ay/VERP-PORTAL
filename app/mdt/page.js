import Shell from "@/components/Shell";
import Mdt from "./Mdt";
import { needUser } from "@/lib/auth";
import { agenteDe } from "@/lib/mdt";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser({ noCedula: true }); if (!agenteDe(u)) redirect("/");
  return <Shell user={u}><Mdt /></Shell>;
}
