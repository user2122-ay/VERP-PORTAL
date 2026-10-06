import Shell from "@/components/Shell";
import MarkRead from "./MarkRead";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser(), l = await (await db()).collection("notifs").find({ uid: u.id }).sort({ at: -1 }).limit(50).toArray(), sin = l.filter((n) => !n.read).length;
  return (<Shell user={u}><div style={{ maxWidth: 560, margin: "0 auto" }}><h2>Notificaciones</h2>
    <p className="mut">{sin} sin leer · {l.length} total</p>{sin > 0 && <MarkRead />}
    {l.length ? l.map((n) => (<div key={String(n._id)} className="card" style={{ marginTop: 10, borderColor: n.read ? "var(--bd)" : "var(--ac)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>{n.title}</b><span className="mut">{new Date(n.at).toLocaleDateString("es")}</span></div><div className="mut">{n.body}</div></div>)) : <div className="card mut" style={{ marginTop: 10 }}>No tienes notificaciones.</div>}</div></Shell>);
}
