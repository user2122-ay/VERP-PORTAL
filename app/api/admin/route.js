import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { adminUser } from "@/lib/admin";
import { LUGARES } from "@/lib/zonas";
const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const CATS = ["Concesionario", "Propiedades", "Licencias", "Objetos", "Armas"], INICIAL = 5000;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), str = (s, n = 80) => String(s || "").trim().slice(0, n), up = (s, n = 40) => str(s, n).replace(/\s+/g, " ").toUpperCase();
const oid = (s) => { try { return new ObjectId(String(s)); } catch { return null; } };
export async function GET(req) {
  const a = await adminUser(); if (!a) return err("Sin permiso", 403);
  const p = new URL(req.url).searchParams, d = await db(), users = d.collection("users"), uid = p.get("uid");
  if (uid) {
    const x = await users.findOne({ id: uid }); if (!x) return err("Usuario no existe", 404);
    return NextResponse.json({ user: { id: x.id, name: x.name, balance: x.balance || 0, cedula: x.cedula || null, chip: x.chip?.num || null, cuentas: Object.fromEntries(Object.entries(x.cuentas || {}).map(([k, c]) => [k, { saldo: c.saldo }])), inventory: (x.inventory || []).map((i) => ({ name: i.name, category: i.category, price: i.price, at: i.at })) } });
  }
  const q = str(p.get("q"), 40); if (!q) return NextResponse.json({ users: [] });
  const rx = new RegExp(esc(q), "i"), dg = q.replace(/\D/g, "").replace(/^0+/, "");
  const r = await users.find({ $or: [{ id: q }, { name: rx }, { "cedula.roblox": rx }, { "cedula.nombres": rx }, { "cedula.apellidos": rx }, ...(dg ? [{ "cedula.num": dg }] : [])] }).limit(10).toArray();
  return NextResponse.json({ users: r.map((x) => ({ id: x.id, name: x.name, cedula: x.cedula ? { num: x.cedula.num, nombres: x.cedula.nombres, apellidos: x.cedula.apellidos, roblox: x.cedula.roblox } : null })) });
}
export async function POST(req) {
  const a = await adminUser(); if (!a) return err("Sin permiso", 403);
  const b = await req.json(), d = await db(), users = d.collection("users"), at = new Date();
  const razon = str(b.razon, 300);
  // Toda acción administrativa (salvo marcar un reporte como resuelto) exige razón y queda en la colección "audit".
  if (b.a !== "done" && razon.length < 3) return err("La razón es obligatoria");
  const log = (act, objetivo, detalle) => d.collection("audit").insertOne({ by: a.id, byName: a.name, rank: a.rank, act, objetivo, razon, detalle, at });
  const t = b.uid ? await users.findOne({ id: str(b.uid, 30) }) : null, quien = t ? `${t.name} (${t.id})` : null;
  if (b.uid && !t) return err("Usuario no existe", 404);
  switch (b.a) {
    case "editCedula": {
      if (!t.cedula) return err("Ese usuario no tiene cédula");
      const c = b.cedula || {}, set = {}, antes = {};
      for (const k of ["nombres", "apellidos", "edoCivil", "roblox"]) if (c[k] !== undefined && str(c[k])) { set[`cedula.${k}`] = k === "roblox" ? str(c[k], 30) : up(c[k]); antes[k] = t.cedula[k]; }
      if (c.lugar) { if (!LUGARES[c.lugar]) return err("Lugar de nacimiento inválido"); set["cedula.lugar"] = c.lugar; antes.lugar = t.cedula.lugar; }
      if (c.nac) { const n = new Date(c.nac); if (isNaN(n)) return err("Fecha inválida"); set["cedula.nac"] = n; antes.nac = t.cedula.nac; }
      if (!Object.keys(set).length) return err("No hay cambios");
      await users.updateOne({ id: t.id }, { $set: set }); await log("editCedula", quien, { antes, despues: set }); break;
    }
    case "dinero": {
      const m = Math.floor(Number(b.monto)), sg = b.tipo === "quitar" ? -1 : 1, dest = b.destino || "efectivo"; if (!(m > 0) || m > 1e9) return err("Monto inválido");
      if (dest !== "efectivo" && !t.cuentas?.[dest]) return err("El usuario no tiene esa cuenta");
      const k = dest === "efectivo" ? "balance" : `cuentas.${dest}.saldo`, f = { id: t.id }; if (sg < 0) f[k] = { $gte: m };
      if (!(await users.updateOne(f, { $inc: { [k]: sg * m } })).modifiedCount) return err("Saldo insuficiente para quitar");
      await d.collection("tx").insertOne({ user: t.id, type: "admin", item: `Ajuste administrativo (${dest})`, amount: sg * m, at });
      await d.collection("notifs").insertOne({ uid: t.id, title: sg > 0 ? "Saldo añadido" : "Saldo descontado", body: `Un administrador ${sg > 0 ? "agregó" : "quitó"} $${m.toLocaleString("es")} (${dest}).`, at, read: false });
      await log(sg > 0 ? "darDinero" : "quitarDinero", quien, { monto: m, destino: dest }); break;
    }
    case "invAgregar": {
      const id = oid(b.itemId), it = id && (await d.collection("items").findOne({ _id: id })); if (!it) return err("Artículo no existe", 404);
      await users.updateOne({ id: t.id }, { $push: { inventory: { name: it.name, category: it.category, price: it.price, at, admin: true } } });
      await d.collection("notifs").insertOne({ uid: t.id, title: "Artículo recibido", body: `Un administrador agregó ${it.name} a tu inventario.`, at, read: false });
      await log("invAgregar", quien, { item: it.name }); break;
    }
    case "invQuitar": {
      const n = new Date(b.at); if (isNaN(n)) return err("Artículo inválido");
      const r = await users.updateOne({ id: t.id }, { $pull: { inventory: { name: str(b.name, 120), at: n } } }); if (!r.modifiedCount) return err("No se encontró ese artículo", 404);
      await log("invQuitar", quien, { item: str(b.name, 120) }); break;
    }
    case "ck": {
      if (b.confirm !== "CK") return err('Escribe "CK" para confirmar'); if (t.id === a.id) return err("No puedes aplicarte CK a ti mismo");
      const num = t.chip?.num, snap = { cedula: t.cedula ? { num: t.cedula.num, nombres: t.cedula.nombres, apellidos: t.cedula.apellidos, roblox: t.cedula.roblox } : null, efectivo: t.balance, cuentas: Object.fromEntries(Object.entries(t.cuentas || {}).map(([k, c]) => [k, c.saldo])), articulos: (t.inventory || []).length, chip: num || null };
      await users.updateOne({ id: t.id }, { $unset: { cedula: "", chip: "", wa: "", cuentas: "", push: "", verif: "", tarjeta: "", cvc: "", venc: "" }, $set: { balance: INICIAL, inventory: [] } });
      await Promise.all([d.collection("tx").deleteMany({ user: t.id }), d.collection("notifs").deleteMany({ uid: t.id }), d.collection("pendientes").deleteMany({ $or: [{ from: t.id }, { to: t.id }] }),
        ...(num ? [d.collection("wa_msgs").deleteMany({ $or: [{ de: num }, { para: num }] }), d.collection("wa_estados").deleteMany({ num })] : [])]);
      await log("CK", quien, snap); break;
    }
    case "addItem": {
      const price = Number(b.price), cat = str(b.category, 30), imp = Number(b.impuesto || 0);
      if (!str(b.name) || !Number.isFinite(price) || price < 0) return err("Nombre o precio inválido"); if (!CATS.includes(cat)) return err("Categoría inválida");
      if (cat === "Propiedades" && !str(b.ubicacion)) return err("Las propiedades necesitan ubicación (ej: Caracas 405)");
      const doc = { name: str(b.name), category: cat, price, desc: str(b.desc, 400), brand: str(b.brand), year: str(b.year, 10), clase: str(b.clase, 30), ubicacion: str(b.ubicacion, 80), impuesto: Number.isFinite(imp) && imp > 0 ? imp : 0, img: str(b.img, 500), stock: b.stock ? Math.floor(Number(b.stock)) || -1 : -1 };
      await d.collection("items").insertOne(doc); await log("addItem", doc.name, { price, category: cat }); break;
    }
    case "setPrice": {
      const id = oid(b.id), price = Number(b.price); if (!id || !Number.isFinite(price) || price < 0) return err("Datos inválidos");
      const it = await d.collection("items").findOneAndUpdate({ _id: id }, { $set: { price } }); if (!it) return err("Artículo no existe", 404);
      await log("setPrice", it.name, { antes: it.price, despues: price }); break;
    }
    case "delItem": {
      const id = oid(b.id), it = id && (await d.collection("items").findOneAndDelete({ _id: id })); if (!it) return err("Artículo no existe", 404);
      await log("delItem", it.name, { price: it.price }); break;
    }
    case "done": {
      const id = oid(b.id); if (!id) return err("ID inválido");
      await d.collection("reports").updateOne({ _id: id }, { $set: { estado: "resuelto" } });
      await d.collection("audit").insertOne({ by: a.id, byName: a.name, rank: a.rank, act: "reporte911", objetivo: String(id), razon: "Reporte resuelto", at }); break;
    }
    default: return err("Acción desconocida");
  }
  return NextResponse.json({ ok: true });
}
