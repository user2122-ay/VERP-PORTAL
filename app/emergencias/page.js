import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import Map911 from "./Map911";
export default async function P() { const u = await needUser(); return <Shell user={u}><Map911 /></Shell>; }
