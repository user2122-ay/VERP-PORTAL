import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
export default async function P() {
  const u = await needUser(), c = u.cedula;
  return (<Shell user={u}><div className="ced"><img src="/logo.png" style={{ height: 34 }} alt="" /><p style={{ letterSpacing: 2, fontSize: 11, opacity: .7 }}>REPÚBLICA BOLIVARIANA DE VENEZUELA</p>
    <div style={{ display: "flex", gap: 14 }}>{u.avatar && <img src={u.avatar} width={90} height={90} style={{ borderRadius: 12 }} alt="" />}
      <div><small>Apellidos</small><div><b>{c.apellidos}</b></div><small>Nombres</small><div><b>{c.nombres}</b></div><small>Nacimiento</small><div><b>{c.nac}</b></div></div></div>
    <div style={{ marginTop: 14, fontFamily: "monospace", fontSize: 20, color: "#6fb3ff" }}>{c.num}</div><small style={{ opacity: .7 }}>Roblox: {c.roblox}</small></div></Shell>);
}
