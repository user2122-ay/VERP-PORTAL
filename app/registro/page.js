import { needUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Form from "./Form";
import Aviso from "@/components/Aviso";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser({ noCedula: true }); if (u.cedula) redirect("/");
  const v = u.verif ? { ok: !!u.verif.ok, code: u.verif.code, robloxName: u.verif.robloxName, avatar: u.verif.avatar || null } : null;
  return <div className="wrap" style={{ maxWidth: 460 }}><Form discord={u.name} initial={v} /><Aviso /></div>;
}
