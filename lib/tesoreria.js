// Tesorería del Estado. Recibe el ITBMS (7%) de todo lo que se compra en el Mercado legal. El mercado negro (Dark Web) no paga impuestos.
// Si el dueño de un negocio decide NO pagar el impuesto, ese 7% se queda con él y queda anotado como "evadido".
// Colecciones: config { _id: "tesoreria", saldo } y tesoreria (libro de ingresos y egresos).
export const ITBMS = 0.07;
export const iva = (monto) => Math.round(Number(monto) * ITBMS);
export async function saldoTesoreria(d) { return (await d.collection("config").findOne({ _id: "tesoreria" }))?.saldo || 0; }
export async function ingresarTesoreria(d, monto, concepto, origen = "") {
  if (!(monto > 0)) return;
  await d.collection("config").updateOne({ _id: "tesoreria" }, { $inc: { saldo: monto } }, { upsert: true });
  await d.collection("tesoreria").insertOne({ tipo: "ingreso", monto, concepto, origen, at: new Date() });
}
// Saca dinero de la tesorería solo si alcanza. Devuelve true/false.
export async function egresarTesoreria(d, monto, concepto, destino = "") {
  if (!(monto > 0)) return false;
  const r = await d.collection("config").updateOne({ _id: "tesoreria", saldo: { $gte: monto } }, { $inc: { saldo: -monto } });
  if (!r.modifiedCount) return false;
  await d.collection("tesoreria").insertOne({ tipo: "egreso", monto, concepto, origen: destino, at: new Date() });
  return true;
}
