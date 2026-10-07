import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { enviarPush } from "@/lib/push";
import { impuesto } from "@/lib/economia";
import { BANCOS, ESPERA_MIN, feeInterbancario } from "@/lib/bancos";
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const nom = (x) => x.cedula.nombres.split(" ")[0] + " " + x.cedula.apellidos.split(" ")[0];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export async function POST(req) {
  const u = await apiUser(); if (!u?.cedula) return bad("Sin sesión", 401);
  const b = await req.json(), m = Math.floor(Number(b.monto)), nota = String(b.nota || "").trim().slice(0, 60), de = b.desde, a = b.hacia;
  if (!BANCOS[de] || !BANCOS[a] || BANCOS[de].comercial || BANCOS[a].comercial) return bad("Banco inválido");
  if (!u.cuentas?.[de]) return bad("No tienes tarjeta de ese banco");
  if (!(m > 0) || m > 1e9) return bad("Monto inválido");
  const ced = String(b.cedula || "").replace(/\D/g, "").replace(/^0+/, ""), rbx = String(b.roblox || "").trim();
  if (!ced || !rbx) return bad("Escribe la cédula y el usuario de Roblox del destinatario");
  const d = await db(), to = await d.collection("users").findOne({ "cedula.num": ced, "cedula.roblox": new RegExp(`^${esc(rbx)}$`, "i") });
  if (!to) return bad("No encontramos a ese ciudadano (revisa cédula y usuario de Roblox)", 404);
  if (to.id === u.id) return bad("No puedes transferirte a ti mismo");
  if (!to.cuentas?.[a]) return bad(`El destinatario aún no tiene tarjeta de ${BANCOS[a].corto}`);
  const { fee: f0, inflacion } = await impuesto(d), inter = de !== a, fee = inter ? feeInterbancario(f0) : f0, tot = m + fee, K = `cuentas.${de}.saldo`;
  const r = await d.collection("users").updateOne({ id: u.id, [K]: { $gte: tot } }, { $inc: { [K]: -tot } });
  if (!r.modifiedCount) return bad(`Saldo insuficiente en ${BANCOS[de].corto} (monto + impuesto de $${fee})`);
  const at = new Date(), n = nota ? ` · ${nota}` : "", $ = m.toLocaleString("es"), tipo = inter ? "interbancario" : "mismo banco";
  const txs = [{ user: u.id, type: "transferencia", item: `Enviado a ${nom(to)}${n} (${BANCOS[de].corto} → ${BANCOS[a].corto})`, amount: -m, at }, { user: u.id, type: "impuesto", item: `Impuesto ${tipo} (inflación ${inflacion}%)`, amount: -fee, at }];
  if (!inter) {
    await d.collection("users").updateOne({ id: to.id }, { $inc: { [`cuentas.${a}.saldo`]: m } });
    await d.collection("tx").insertMany([...txs, { user: to.id, type: "transferencia", item: `Recibido de ${nom(u)}${n} (${BANCOS[a].corto})`, amount: m, at }]);
    await d.collection("notifs").insertMany([{ uid: u.id, title: "Transferencia enviada", body: `Enviaste $${$} a ${nom(to)}. Impuesto: $${fee}.`, at, read: false }, { uid: to.id, title: "Transferencia recibida", body: `${nom(u)} te envió $${$}${n}.`, at, read: false }]);
    await enviarPush(to.id, { title: "Transferencia recibida", body: `${nom(u)} te envió $${$}.`, url: "/banco" });
    return NextResponse.json({ ok: true });
  }
  await d.collection("pendientes").insertOne({ from: u.id, to: to.id, banco: a, monto: m, nota, deNombre: nom(u), aNombre: nom(to), llega: new Date(Date.now() + ESPERA_MIN * 60000) });
  await d.collection("tx").insertMany(txs);
  await d.collection("notifs").insertMany([{ uid: u.id, title: "Transferencia en camino", body: `Tu transferencia de $${$} a ${nom(to)} (${BANCOS[a].corto}) tardará ${ESPERA_MIN} minutos en llegar. Impuesto interbancario: $${fee}.`, at, read: false }, { uid: to.id, title: "Transferencia en camino", body: `${nom(u)} te envió $${$}. Llegará a tu cuenta ${BANCOS[a].corto} en ${ESPERA_MIN} minutos.`, at, read: false }]);
  return NextResponse.json({ ok: true, espera: ESPERA_MIN });
}
