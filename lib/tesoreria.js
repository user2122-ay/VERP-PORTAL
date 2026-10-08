// Tesorería del Estado. Recibe el ITBMS de todo lo que se compra en el Mercado legal y los impuestos de los bancos. El mercado negro (Dark Web) no paga impuestos.
// El Ministro del Interior puede cambiar la tasa del ITBMS (por defecto 7%). Si el dueño de un negocio decide NO pagar el impuesto, queda anotado como "evadido".
// Colecciones: config { _id: "tesoreria", saldo, itbms } y tesoreria (libro de ingresos y egresos). Empieza con $3.000.000.
export const ITBMS = 0.07, SALDO_INICIAL = 3000000;
export const iva = (monto, tasa = ITBMS) => Math.round(Number(monto) * tasa);
let listo = false;
async function ensure(d) {
  if (listo) return; const c = d.collection("config"), t = await c.findOne({ _id: "tesoreria" });
  if (!t?.inicial) {
    await c.updateOne({ _id: "tesoreria" }, { $inc: { saldo: SALDO_INICIAL }, $set: { inicial: true } }, { upsert: true });
    await d.collection("tesoreria").insertOne({ tipo: "ingreso", monto: SALDO_INICIAL, concepto: "Fondo inicial del Estado", origen: "Fundación", at: new Date() });
  }
  listo = true;
}
export async function tasaITBMS(d) { await ensure(d); const t = await d.collection("config").findOne({ _id: "tesoreria" }); return typeof t?.itbms === "number" ? t.itbms : ITBMS; }
export async function setTasa(d, tasa) { await ensure(d); await d.collection("config").updateOne({ _id: "tesoreria" }, { $set: { itbms: tasa } }); }
export async function saldoTesoreria(d) { await ensure(d); return (await d.collection("config").findOne({ _id: "tesoreria" }))?.saldo || 0; }
export async function ingresarTesoreria(d, monto, concepto, origen = "") {
  if (!(monto > 0)) return; await ensure(d);
  await d.collection("config").updateOne({ _id: "tesoreria" }, { $inc: { saldo: monto } }, { upsert: true });
  await d.collection("tesoreria").insertOne({ tipo: "ingreso", monto, concepto, origen, at: new Date() });
}
// Saca dinero de la tesorería solo si alcanza. Devuelve true/false.
export async function egresarTesoreria(d, monto, concepto, destino = "") {
  if (!(monto > 0)) return false; await ensure(d);
  const r = await d.collection("config").updateOne({ _id: "tesoreria", saldo: { $gte: monto } }, { $inc: { saldo: -monto } });
  if (!r.modifiedCount) return false;
  await d.collection("tesoreria").insertOne({ tipo: "egreso", monto, concepto, origen: destino, at: new Date() });
  return true;
}
