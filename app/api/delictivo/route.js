import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { esRol, nombreDe } from "@/lib/rol";
import { nuevaPlaca, registrarPlaca } from "@/lib/placa";
import { enviarPush } from "@/lib/push";
import { estaRetenido } from "@/lib/decomiso";
import { tieneVpn } from "@/lib/vpn";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), money = (n) => "$" + Number(n).toLocaleString("es");
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
const https = (s) => { try { const h = new URL(s); return h.protocol === "https:" ? h.href : null; } catch { return null; } };
const avisar = async (d, uid, title, body) => { await d.collection("notifs").insertOne({ uid, title, body, at: new Date(), read: false }); await enviarPush(uid, { title, body, url: "/notificaciones" }); };
const LIM = 200000;
// Lo que una persona lleva encima (lo guardado en casa NO se puede robar).
const llevaEncima = (t) => (t.inventory || []).filter((i) => i.loc !== "casa" && !["Propiedades", "Licencias"].includes(i.category) && i.sku !== "vpn" && !estaRetenido(i)).map((i) => ({ name: i.name, at: new Date(i.at).toISOString(), category: i.category, placa: i.placa || "", img: i.img || "" }));

export async function GET(req) { // buscador de ciudadanos para asaltar
  const u = await apiUser(); if (!u?.cedula) return bad("Sin permiso", 403);
  if (!tieneVpn(u)) return bad("Necesitas una VPN para entrar a la parte delictiva", 403);
  const sp = new URL(req.url).searchParams, ver = sp.get("ver");
  if (ver) { const t = await (await db()).collection("users").findOne({ id: ver, cedula: { $exists: true } }); if (!t || t.id === u.id) return bad("Ciudadano inválido"); return NextResponse.json({ efectivo: t.balance || 0, items: llevaEncima(t) }); }
  const q = String(sp.get("q") || "").trim().slice(0, 40); if (q.length < 2) return NextResponse.json({ users: [] });
  const rx = new RegExp(esc(q), "i"), dg = q.replace(/\D/g, "").replace(/^0+/, "");
  const r = await (await db()).collection("users").find({ id: { $ne: u.id }, cedula: { $exists: true }, $or: [{ "cedula.roblox": rx }, { "cedula.nombres": rx }, { "cedula.apellidos": rx }, ...(dg ? [{ "cedula.num": dg }] : [])] }).limit(8).toArray();
  return NextResponse.json({ users: r.map((x) => ({ id: x.id, label: `${x.cedula.nombres} ${x.cedula.apellidos} · ${x.cedula.roblox}` })) });
}

export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json(), d = await db(), us = d.collection("users"), at = new Date(), yo = nombreDe(u);
  if (b.accion === "asaltar") {
    if (!tieneVpn(u)) return bad("Necesitas una VPN para entrar a la parte delictiva", 403);
    const t = await us.findOne({ id: String(b.to), cedula: { $exists: true } }); if (!t || t.id === u.id) return bad("Ciudadano inválido");
    const e = Math.max(0, Math.floor(+b.efectivo || 0)), tj = Math.max(0, Math.floor(+b.tarjeta || 0)), disp = llevaEncima(t), pedidos = (Array.isArray(b.items) ? b.items : []).slice(0, 10).map((s) => disp.find((x) => x.name === s.name && x.at === s.at)).filter(Boolean), objetos = pedidos.length > 0, vehiculos = pedidos.some((x) => x.category === "Concesionario");
    if (e > LIM || tj > LIM) return bad(`El monto máximo por asalto es ${money(LIM)}`); if (e > (t.balance || 0)) return bad("No lleva tanto efectivo encima"); if (!e && !tj && !pedidos.length) return bad("Elige qué quieres robar");
    const ev = b.evidencia ? https(b.evidencia) : null; if (b.evidencia && !ev) return bad("La evidencia debe ser un link https (Discord)"); if (vehiculos && !ev) return bad("Para robar un vehículo debes subir la foto del robo (link de Discord)");
    const c = d.collection("asaltos"); if (await c.countDocuments({ from: u.id, to: t.id, estado: "pendiente" })) return bad("Ya tienes un asalto pendiente con esta persona");
    await c.insertOne({ from: u.id, fromName: yo, to: t.id, toName: nombreDe(t), efectivo: e, tarjeta: tj, objetos, vehiculos, items: pedidos, evidencia: ev, msg: String(b.msg || "").slice(0, 200), estado: "pendiente", at });
    await avisar(d, t.id, "Te están asaltando", `${yo} quiere robarte${e ? ` ${money(e)} en efectivo` : ""}${tj ? ` ${money(tj)} de tu tarjeta` : ""}${objetos ? " objetos" : ""}${vehiculos ? " un vehículo" : ""}. Entra a Avisos para aceptar o rechazar.`);
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "responder") { // la víctima acepta (eligiendo qué entrega) o rechaza
    const id = oid(b.id), c = d.collection("asaltos"), a = id && (await c.findOneAndUpdate({ _id: id, to: u.id, estado: "pendiente" }, { $set: { estado: "cerrando" } })); if (!a) return bad("Asalto no disponible", 404);
    if (!b.ok) { await c.updateOne({ _id: id }, { $set: { estado: "rechazado", resuelto: at } }); await avisar(d, a.from, "Asalto rechazado", `${yo} rechazó el asalto.`); return NextResponse.json({ ok: true }); }
    const res = [], ladron = await us.findOne({ id: a.from }), mueve = async (de, a2, campo, m) => { if (m > 0 && (await us.updateOne({ id: de, [campo]: { $gte: m } }, { $inc: { [campo]: -m } })).modifiedCount) { await us.updateOne({ id: a2 }, { $inc: { balance: m } }); return m; } return 0; };
    if (a.efectivo) { const m = await mueve(u.id, a.from, "balance", Math.min(a.efectivo, u.balance || 0)); if (m) res.push(`${money(m)} en efectivo`); }
    if (a.tarjeta && u.cuentas?.[b.pago]) { const m = await mueve(u.id, a.from, `cuentas.${b.pago}.saldo`, Math.min(a.tarjeta, u.cuentas[b.pago].saldo || 0)); if (m) res.push(`${money(m)} de tu tarjeta`); }
    for (const s of Array.isArray(b.items) ? b.items.slice(0, 10) : []) { // solo lo que el ladrón pidió y la víctima dejó marcado
      if (!(a.items || []).some((x) => x.name === s.name && x.at === s.at)) continue;
      const it = (u.inventory || []).find((i) => i.name === s.name && new Date(i.at).toISOString() === s.at && i.loc !== "casa"), veh = it?.category === "Concesionario";
      if (!it || it.sku === "vpn") continue;
      if (!(await us.updateOne({ id: u.id }, { $pull: { inventory: { name: it.name, at: it.at } } })).modifiedCount) continue;
      let pl = it.placa || null; if (veh) { if (!pl) pl = await nuevaPlaca(d, { modelo: it.name, dueno: u.id, duenoN: nombreDe(u) }); await registrarPlaca(d, pl, { modelo: it.name, color: it.color || "", dueno: u.id, duenoN: nombreDe(u), robado: true, estado: "Robado a su propietario" }); }
      await us.updateOne({ id: a.from }, { $push: { inventory: { ...it, at: new Date(), placa: pl, robado: true, robadoDe: nombreDe(u) } } });
      if (veh) await d.collection("reportes").insertOne({ tipo: "Vehículo robado (asalto)", modelo: it.name, color: it.color || "", placa: pl, specs: "", denuncia: nombreDe(u), estado: "pendiente", seg: [], at });
      res.push(it.name);
    }
    await c.updateOne({ _id: id }, { $set: { estado: "aceptado", resuelto: at, entregado: res } });
    await avisar(d, a.from, "Asalto completado", res.length ? `${nombreDe(u)} te entregó: ${res.join(", ")}.` : `${nombreDe(u)} aceptó, pero no entregó nada.`); await avisar(d, u.id, "Asalto aceptado", res.length ? `Entregaste: ${res.join(", ")}.` : "No entregaste nada.");
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "robo") { // solicitud al staff para robar un auto de la calle
    if (!tieneVpn(u)) return bad("Necesitas una VPN para entrar a la parte delictiva", 403);
    const img = https(b.img), modelo = String(b.modelo || "").trim().slice(0, 60), color = String(b.color || "").trim().slice(0, 30), pl = String(b.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8), specs = String(b.specs || "").trim().slice(0, 400);
    if (!img) return bad("Sube la foto del robo (link https de Discord)"); if (!modelo || !color || pl.length < 5 || !specs) return bad("Completa modelo, color, matrícula y especificaciones");
    if ((await d.collection("robos").countDocuments({ user: u.id, estado: "pendiente" })) >= 3) return bad("Ya tienes 3 solicitudes pendientes");
    await d.collection("robos").insertOne({ user: u.id, userName: yo, img, modelo, color, placa: pl, specs, estado: "pendiente", at }); return NextResponse.json({ ok: true });
  }
  return bad("Acción inválida");
}
