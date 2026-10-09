import Shell from "@/components/Shell";
import Comprar from "../mercado/PagoModal";
import Dark from "./Dark";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { metodosDe } from "@/lib/pago";
import { NEGOCIOS, ensureNegocios } from "@/lib/negocios";
import { esRol } from "@/lib/rol";
import { tieneVpn } from "@/lib/vpn";
import { factorHoy } from "@/lib/mnegro";
import { comprarPendientes } from "@/lib/dwauto";
import { Lock } from "lucide-react";
import { esBolsa } from "@/lib/cultivo";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser();
  if (!tieneVpn(u)) return (<Shell user={u}><div className="card" style={{ maxWidth: 520, margin: "40px auto", textAlign: "center", borderColor: "var(--bad)" }}><Lock size={48} color="#ff4d5e" /><h2>Acceso denegado</h2><p className="mut">Necesitas una VPN para entrar a la Dark Web. Compra el acceso (dura 5 días) en la Tienda del Mercado.</p><span className="tag" style={{ color: "var(--bad)" }}>Conexión no segura · Acceso bloqueado</span></div></Shell>);
  const d = await db(); await ensureNegocios(d); await comprarPendientes(d); const mn = await factorHoy(d);
  const t = await d.collection("negocios").findOne({ _id: "taller" }), dueño = t?.owner ? await d.collection("users").findOne({ id: t.owner }, { projection: { name: 1, cedula: 1 } }) : null;
  const autos = (u.inventory || []).map((i, k) => ({ i: k, name: i.name, at: new Date(i.at).toISOString(), category: i.category, placa: i.placa || "", robado: !!i.robado, price: Number(i.price) || 0, loc: i.loc, ret: !!(i.retenido?.hasta && +new Date(i.retenido.hasta) > Date.now()) })).filter((x) => x.category === "Concesionario" && x.loc !== "casa" && !x.ret);
  const ls = await d.collection("dw").find({ estado: "abierta" }).sort({ at: -1 }).limit(60).toArray();
  const listas = ls.map((l) => ({ id: String(l._id), tipo: l.tipo, car: l.car.name, img: l.car.img || "", placa: l.car.placa || "", color: l.car.color || "", precio: l.precio, vendedor: l.sellerName, mio: l.seller === u.id, part: l.seller === u.id || l.buyer === u.id }));
  const hoy = {}; for (const c of await d.collection("cultivo_compras").find({ uid: u.id, at: { $gte: new Date(Date.now() - 864e5) } }).toArray()) hoy[c.tipo] = (hoy[c.tipo] || 0) + 1;
  const bolsas = (u.inventory || []).filter((i) => esBolsa(i) && i.loc !== "casa" && !(i.retenido?.hasta && +new Date(i.retenido.hasta) > Date.now())).map((i) => ({ name: i.name, at: new Date(i.at).toISOString(), cant: i.cant, img: i.img || "" }));
  return (<Shell user={u}><div className="dk" style={{ maxWidth: 1000, margin: "0 auto" }}><h2 style={{ color: "var(--ac)" }}>Dark Web</h2><p className="mut">Conexión segura por VPN. Todo lo que pasa aquí queda entre nosotros.</p>
    <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}><img src={NEGOCIOS.taller.img} alt="" style={{ width: "100%", borderRadius: 12 }} />
      <div><b style={{ fontSize: 20 }}>{NEGOCIOS.taller.nombre}</b><div className="mut">{NEGOCIOS.taller.edita}. Compras autos robados a los delictivos (negociando por chat) y los vendes a la plataforma. Se paga con Tarjeta de Comerciante.</div><div className="big" style={{ fontSize: 26 }}>${NEGOCIOS.taller.precio.toLocaleString("es")}</div>
        {t?.owner ? <span className="tag">{t.owner === u.id ? "Eres el dueño" : `Dueño: ${dueño?.cedula ? dueño.cedula.nombres.split(" ")[0] + " " + dueño.cedula.apellidos.split(" ")[0] : dueño?.name || "—"}`}</span>
          : <Comprar url="/api/negocios" body={{ accion: "comprar", key: "taller" }} metodos={metodosDe(u)} msg="¡Taller comprado! Las ofertas de autos llegarán aquí." label="Comprar taller" />}</div></div>
    <Dark mercado={{ factor: mn.factor, mood: mn.mood, proxima: mn.proxima }} yo={u.id} delictivo={await esRol(u, "delictivo")} dueño={t?.owner === u.id} autos={autos} listas={listas} metodos={metodosDe(u)} cultivo={{ hoy, bolsas }} /></div></Shell>);
}
