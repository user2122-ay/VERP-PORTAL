import Shell from "@/components/Shell";
import Transfer, { CopyCard, CardSecret } from "./Transfer";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tarjetaDe } from "@/lib/tarjeta";
import { impuesto } from "@/lib/economia";
export const dynamic = "force-dynamic";
const P_ = ({ l, t, w, h, bg }) => <i style={{ left: l, top: t, width: w, height: h, background: bg }} />;
const X = ({ l, t, r, b, s, c = "#fff", fw = 700, ls, children }) => <div className="t" style={{ left: l, top: t, right: r, bottom: b, fontSize: `${s}cqw`, color: c, fontWeight: fw, letterSpacing: ls }}>{children}</div>;
export default async function P() {
  const u = await needUser(), d = await db(), num = (await tarjetaDe(u)).num, { fee, inflacion } = await impuesto(d);
  const mov = await d.collection("tx").find({ user: u.id }).sort({ at: -1 }).limit(15).toArray(), c = u.cedula;
  return (<Shell user={u}><div style={{ maxWidth: 430, margin: "0 auto" }}>
    <p className="mut" style={{ margin: "0 0 10px" }}>Banca en línea · Hola, {c.nombres.split(" ")[0]}</p>
    <div className="bk"><div className="bkt" />
      <P_ l="62%" t="-6%" w="16%" h="44%" bg="#f5c518" /><P_ l="76%" t="14%" w="14%" h="32%" bg="#1e4fd8" /><P_ l="70%" t="42%" w="12%" h="24%" bg="#14a38b" /><P_ l="82%" t="44%" w="8%" h="14%" bg="#d7263d" />
      <img src="/ve-logo.png" alt="" className="t" style={{ left: "5%", top: "8%", height: "14%" }} />
      <X l="19%" t="9%" s={8.5}>BVC</X><X l="19%" t="22%" s={3} fw={400}>Banco de Venezuela Community</X>
      <X l="5%" t="34%" s={5}>USD</X>
      <X l="5%" t="52%" s={5.8} c="#0a1f3a" ls=".04em">{num.replace(/(\d{4})(?=\d)/g, "$1 ")}</X>
      <CardSecret />
      <X l="5%" t="80%" s={2.6} c="#4b5b70" fw={600}>TITULAR</X><X l="5%" t="86%" s={3.6} c="#0a1f3a">{c.nombres.split(" ")[0]} {c.apellidos.split(" ")[0]}</X>
      <img src="/ve-logo.png" alt="" className="t" style={{ right: "6%", bottom: "7%", width: "22%" }} /></div>
    <div className="card" style={{ marginTop: 14 }}><span className="mut">Saldo disponible</span><div className="big">${u.balance.toLocaleString("es")}</div></div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}><a href="#enviar" className="btn">Enviar</a><a href="#mov" className="btn g">Movimientos</a><CopyCard num={num} /></div>
    <div id="enviar" style={{ marginTop: 14 }}><Transfer fee={fee} inflacion={inflacion} /></div>
    <div id="mov" className="card"><b>Movimientos</b>{mov.length ? mov.map((m) => (<div key={String(m._id)} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid var(--bd)" }}>
      <div><div>{m.item}</div><div className="mut">{new Date(m.at).toLocaleDateString("es")}</div></div>
      <b style={{ color: m.amount < 0 ? "var(--bad)" : "var(--ok)", whiteSpace: "nowrap" }}>{m.amount < 0 ? "-" : "+"}${Math.abs(m.amount).toLocaleString("es")}</b></div>)) : <p className="mut">Sin movimientos aún.</p>}</div></div></Shell>);
}
