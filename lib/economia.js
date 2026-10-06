// Impuesto por transferencia: 1 USD, o 2 USD cuando la inflación del sistema llega a 50%.
// La inflación se cambia en Mongo: colección "config", documento { _id: "economia", inflacion: 25 }
export async function impuesto(d) {
  const c = await d.collection("config").findOne({ _id: "economia" }), inflacion = Number(c?.inflacion ?? 25);
  return { inflacion, fee: inflacion >= 50 ? 2 : 1 };
}
