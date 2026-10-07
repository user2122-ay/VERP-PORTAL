import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { esRol, nombreDe } from "@/lib/rol";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), money = (n) => "$" + Number(n).toLocaleString("es"), txt = (s, n = 400) => String(s || "").trim().slice(0, n);
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
const COMISION = 0.05; // cada oficial presente en el arresto recibe el 5% de la multa cobrada
async function policia() { const u = await apiUser(); return u?.cedula && (await esRol(u, "policia")) ? u : null; }
const pub = (x) => ({ id: x.id, label: `${x.cedula.nombres} ${x.cedula.apellidos} · ${x.cedula.roblox}`, num: x.cedula.num });

export async function GET(req) {
  const u = await policia(); if (!u) return bad("Sin permiso", 403);
  const p = new URL(req.url).searchParams, m = p.get("m"), d = await db(), us = d.collection("users");
  if (m === "buscar") {
    const q = txt(p.get("q"), 40); if (q.length < 2) return NextResponse.json({ users: [] });
    const rx = new RegExp(esc(q), "i"), dg = q.replace(/\D/g, "").replace(/^0+/, "");
    return NextResponse.json({ users: (await us.find({ cedula: { $exists: true }, $or: [{ "cedula.roblox": rx }, { "cedula.nombres": rx }, { "cedula.apellidos": rx }, ...(dg ? [{ "cedula.num": dg }] : [])] }).limit(10).toArray()).map(pub) });
  }
  if (m === "ficha") {
    const x = await us.findOne({ id: txt(p.get("id"), 30), cedula: { $exists: true } }); if (!x) return bad("No existe", 404);
    const ar = await d.collection("arrestos").find({ sujeto: x.id }).sort({ at: -1 }).limit(30).toArray(), ex = await d.collection("expedientes").find({ sujetos: x.id }).sort({ at: -1 }).limit(20).toArray();
    return NextResponse.json({ cedula: x.cedula, linea: x.chip?.num || null, autos: (x.inventory || []).filter((i) => i.category === "Concesionario").map((i) => ({ name: i.name, placa: i.placa || "", robado: !!i.robado })),
      arrestos: ar.map((a) => ({ id: String(a._id), cargos: a.cargos, multa: a.multa, cobrado: a.cobrado, minutos: a.minutos, por: a.porName, at: a.at })), expedientes: ex.map((e) => ({ id: String(e._id), titulo: e.titulo, estado: e.estado })) });
  }
  if (m === "exp") {
    const l = await d.collection("expedientes").find().sort({ at: -1 }).limit(40).toArray();
    return NextResponse.json({ exps: l.map((e) => ({ id: String(e._id), titulo: e.titulo, desc: e.desc, estado: e.estado, creador: e.creadorName, at: e.at, sujetos: e.sujetosN || [], notas: e.notas || [] })) });
  }
  if (m === "rep") {
    const a = await d.collection("reports").find().sort({ at: -1 }).limit(40).toArray(), b = await d.collection("reportes").find().sort({ at: -1 }).limit(40).toArray();
    const r = [...a.map((x) => ({ src: "e", id: String(x._id), titulo: `911 · ${x.tipo}`, det: `${x.zona}${x.calle ? " · " + x.calle : ""} — ${x.desc}`, por: x.nombre, resuelto: x.estado === "resuelto", seg: x.seg || [], at: x.at })),
      ...b.map((x) => ({ src: "v", id: String(x._id), titulo: `${x.tipo}: ${x.modelo}`, det: `Color ${x.color || "—"} · Placa ${x.placa || "—"}${x.specs ? " · " + x.specs : ""}`, img: x.img, por: x.denuncia || "", resuelto: x.estado === "resuelto", seg: x.seg || [], at: x.at }))].sort((x, y) => +new Date(y.at) - +new Date(x.at));
    return NextResponse.json({ reps: r });
  }
  return bad("Consulta inválida");
}

export async function POST(req) {
  const u = await policia(); if (!u) return bad("Sin permiso", 403);
  const b = await req.json(), d = await db(), us = d.collection("users"), at = new Date(), yo = nombreDe(u);
  switch (b.accion) {
    case "expNuevo": {
      const titulo = txt(b.titulo, 100); if (titulo.length < 3) return bad("Escribe un título");
      const s = b.sujeto ? await us.findOne({ id: txt(b.sujeto, 30), cedula: { $exists: true } }) : null;
      await d.collection("expedientes").insertOne({ titulo, desc: txt(b.desc, 1000), estado: "abierto", creador: u.id, creadorName: yo, sujetos: s ? [s.id] : [], sujetosN: s ? [pub(s).label] : [], notas: [], at }); return NextResponse.json({ ok: true });
    }
    case "expNota": case "expEstado": case "expSujeto": {
      const id = oid(b.id); if (!id) return bad("Expediente inválido"); const c = d.collection("expedientes");
      if (b.accion === "expNota") { const t = txt(b.txt); if (!t) return bad("Nota vacía"); await c.updateOne({ _id: id }, { $push: { notas: { by: yo, txt: t, at } } }); }
      else if (b.accion === "expEstado") await c.updateOne({ _id: id }, { $set: { estado: b.estado === "cerrado" ? "cerrado" : "abierto" } });
      else { const s = await us.findOne({ id: txt(b.sujeto, 30), cedula: { $exists: true } }); if (!s) return bad("Ciudadano no existe"); await c.updateOne({ _id: id }, { $addToSet: { sujetos: s.id, sujetosN: pub(s).label } }); }
      return NextResponse.json({ ok: true });
    }
    case "arresto": {
      const s = await us.findOne({ id: txt(b.sujeto, 30), cedula: { $exists: true } }); if (!s) return bad("Elige al sujeto arrestado");
      const cargos = txt(b.cargos, 400), multa = Math.floor(Number(b.multa) || 0), minutos = Math.max(0, Math.floor(Number(b.minutos) || 0));
      if (cargos.length < 3) return bad("Escribe los cargos"); if (multa < 0 || multa > 1000000) return bad("Multa inválida (máximo $1.000.000)");
      const nombres = [...new Set(txt(b.oficiales, 300).split(/[\s,;]+/).filter(Boolean))].slice(0, 9);
      const ofs = nombres.length ? await us.find({ $or: nombres.map((n) => ({ "cedula.roblox": new RegExp("^" + esc(n) + "$", "i") })) }).toArray() : [];
      const faltan = nombres.filter((n) => !ofs.some((o) => o.cedula.roblox.toLowerCase() === n.toLowerCase())); if (faltan.length) return bad(`No encuentro a: ${faltan.join(", ")} (usuario de Roblox)`);
      const ids = [...new Set([u.id, ...ofs.map((o) => o.id)])].filter((i) => i !== s.id);
      let rest = multa; const fuentes = [["balance", s.balance || 0], ...Object.keys(s.cuentas || {}).filter((k) => k !== "com").map((k) => [`cuentas.${k}.saldo`, s.cuentas[k].saldo || 0])];
      for (const [f, av] of fuentes) { const t = Math.min(rest, av); if (t > 0 && (await us.updateOne({ id: s.id, [f]: { $gte: t } }, { $inc: { [f]: -t } })).modifiedCount) rest -= t; }
      const cobrado = multa - rest, com = Math.floor(cobrado * COMISION);
      if (com > 0) for (const o of ids) { await us.updateOne({ id: o }, { $inc: { balance: com } }); await d.collection("tx").insertOne({ user: o, type: "comision", item: `Comisión por arresto de ${pub(s).label}`, amount: com, at }); await d.collection("notifs").insertOne({ uid: o, title: "Comisión por arresto", body: `Recibiste ${money(com)} (5% de ${money(cobrado)}) en efectivo.`, at, read: false }); }
      await d.collection("arrestos").insertOne({ sujeto: s.id, sujetoN: pub(s).label, cargos, multa, cobrado, minutos, oficiales: ids, comision: com, por: u.id, porName: yo, at });
      await d.collection("notifs").insertOne({ uid: s.id, title: "Has sido arrestado", body: `Cargos: ${cargos}.${cobrado ? ` Se cobró una multa de ${money(cobrado)}.` : ""}${rest ? ` Quedó sin pagar ${money(rest)}.` : ""}`, at, read: false });
      return NextResponse.json({ ok: true, cobrado, comision: com, oficiales: ids.length });
    }
    case "repNota": case "repEstado": {
      const id = oid(b.id); if (!id) return bad("Reporte inválido"); const c = d.collection(b.src === "v" ? "reportes" : "reports");
      if (b.accion === "repNota") { const t = txt(b.txt); if (!t) return bad("Nota vacía"); await c.updateOne({ _id: id }, { $push: { seg: { by: yo, txt: t, at } } }); }
      else await c.updateOne({ _id: id }, { $set: { estado: b.resuelto ? "resuelto" : "pendiente" }, $push: { seg: { by: yo, txt: b.resuelto ? "Marcó el problema como RESUELTO" : "Reabrió el reporte", at } } });
      return NextResponse.json({ ok: true });
    }
  }
  return bad("Acción inválida");
}
