import { db } from "./db";
import { BANCOS } from "./bancos";
import { enviarPush } from "./push";
// Entrega las transferencias entre bancos cuyo plazo (3 min) ya venció. Se llama en cada carga de página.
export async function liquidar() {
  const d = await db(), p = d.collection("pendientes");
  for (let i = 0; i < 25; i++) {
    const t = await p.findOneAndDelete({ llega: { $lte: new Date() } }); if (!t) break;
    await d.collection("users").updateOne({ id: t.to }, { $inc: { [`cuentas.${t.banco}.saldo`]: t.monto } });
    const at = new Date(), $ = t.monto.toLocaleString("es"), b = BANCOS[t.banco].corto;
    await d.collection("tx").insertOne({ user: t.to, type: "transferencia", item: `Recibido de ${t.deNombre}${t.nota ? " · " + t.nota : ""} (${b})`, amount: t.monto, at });
    await d.collection("notifs").insertMany([
      { uid: t.to, title: "Transferencia recibida", body: `${t.deNombre} te envió $${$} a tu cuenta ${b}.`, at, read: false },
      { uid: t.from, title: "Transferencia entregada", body: `Tu transferencia de $${$} ya llegó a ${t.aNombre}.`, at, read: false }]);
    await enviarPush(t.to, { title: "Transferencia recibida", body: `${t.deNombre} te envió $${$}.`, url: "/banco" });
  }
}
