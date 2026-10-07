import Shell from "@/components/Shell";
import Mdt from "./Mdt";
import { needUser } from "@/lib/auth";
import { esRol } from "@/lib/rol";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser(); if (!(await esRol(u, "policia"))) redirect("/");
  return <Shell user={u}><Mdt /></Shell>;
}
