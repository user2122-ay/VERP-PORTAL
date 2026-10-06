import { needUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Form from "./Form";
export default async function P() { const u = await needUser({ noCedula: true }); if (u.cedula) redirect("/"); return <div className="wrap" style={{ maxWidth: 440 }}><Form /></div>; }
