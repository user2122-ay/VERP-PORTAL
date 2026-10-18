import Shell from "@/components/Shell";
import Normativa from "./Normativa";
import { needUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser({ noCedula: true });
  return <Shell user={u}><Normativa /></Shell>;
}
