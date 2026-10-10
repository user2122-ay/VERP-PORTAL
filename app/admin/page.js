import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { canAdmin, canReview, canStaff, RANK_LABEL } from "@/lib/roles";
import { staffRank, adminFresca } from "@/lib/admin";
import { nombreDe } from "@/lib/rol";
import AdminAcceso from "./Acceso";
import Admin from "./Admin";
import { sembrar } from "@/lib/catalogo";
import { configAuto } from "@/lib/erlcauto";
export const dynamic = "force-dynamic";
export default async function P() {
  const u = await needUser(), rank = await staffRank(u); if (!canReview(rank)) redirect("/");
  if (u.dev && !u.staffPlaca) await (await db()).collection("users").updateOne({ id: u.id }, { $set: { staffPlaca: "DEV-001" } }); // al Developer se le asigna la placa de Staff DEV-001 automáticamente
  if (!adminFresca(u)) return <Shell user={{ ...u, rank }}><AdminAcceso nombre={nombreDe(u)} rango={RANK_LABEL[rank] || rank} /></Shell>;
  const d = await db(); await sembrar(d);
  const it = (i) => ({ id: String(i._id), name: i.name, category: i.category, price: i.price, impuesto: i.impuesto || 0, ubicacion: i.ubicacion || "", tipo: i.tipo || "" });
  const items = [...(await d.collection("items").find({ category: { $ne: "Propiedades" } }).sort({ _id: -1 }).toArray()), ...(await d.collection("items").find({ category: "Propiedades" }).sort({ ubicacion: 1 }).limit(2000).toArray())].map(it);
  const reps = (await d.collection("reports").find({ estado: { $ne: "resuelto" } }).sort({ at: -1 }).limit(30).toArray()).map((r) => ({ id: String(r._id), t: `${r.tipo} · ${r.zona} · ${r.nombre}`, d: r.desc, e: r.estado }));
  const audit = (await d.collection("audit").find().sort({ at: -1 }).limit(100).toArray()).map((x) => ({ id: String(x._id), at: x.at.toISOString(), by: x.byName, rank: x.rank, act: x.act, obj: x.objetivo || x.name || x.uid || "", razon: x.razon || "" }));
  const apelaciones = (await d.collection("apelaciones").find({ estado: "pendiente" }).sort({ at: 1 }).limit(50).toArray()).map((r) => ({ id: String(r._id), nombre: r.nombre, causa: r.causa, razon: r.razon, at: r.at.toISOString() }));
  const robos = (await d.collection("robos").find({ estado: "pendiente" }).sort({ at: 1 }).limit(50).toArray()).map((r) => ({ id: String(r._id), user: r.userName, modelo: r.modelo, color: r.color, placa: r.placa, specs: r.specs, img: r.img }));
  const full = canAdmin(rank), us = d.collection("users"), auto = full ? await configAuto(d) : null;
  const staff = canStaff(rank) ? (await us.find({ $or: [{ staff: { $nin: [null, ""] } }, { dev: true }] }).limit(100).toArray()).map((x) => ({ id: x.id, name: x.name, rango: x.dev ? "DEVELOPER" : x.staff, placa: x.staffPlaca || "" })) : [];
  const agentes = full ? (await us.find({ agente: { $exists: true } }).limit(200).toArray()).map((x) => ({ id: x.id, name: x.name, nombre: x.cedula ? `${x.cedula.nombres} ${x.cedula.apellidos}` : "", ...x.agente })) : [];
  const ap = await d.collection("config").findOne({ _id: "apertura" }), apertura = ap ? { tipo: ap.tipo, por: ap.por, at: new Date(ap.at).toISOString(), servidor: ap.servidor || "abierto" } : { servidor: "abierto" };
  const trabajos = (await d.collection("trabajos").find({ estado: "pendiente" }).sort({ at: 1 }).limit(50).toArray()).map((r) => ({ id: String(r._id), user: r.userName, roblox: r.roblox, trabajo: r.trabajoN, tarifa: r.tarifa, horas: r.horas, total: r.total, ev: r.ev, at: r.at.toISOString() }));
  return <Shell user={{ ...u, rank }}><Admin trabajos={trabajos} auto={auto} apertura={apertura} rank={rank} items={full ? items : []} reps={full ? reps : []} audit={full ? audit : []} robos={robos} apelaciones={apelaciones} staff={staff} canStaff={canStaff(rank)} agentes={agentes} /></Shell>;
}
