// Cotización del mercado negro: la página paga los autos robados con un factor (x0.60 a x1.40) que se renueva cada 2 horas.
export const PERIODO_MS = 2 * 60 * 60 * 1000;
const estado = (f) => (f >= 1.15 ? "Demanda alta" : f >= 0.9 ? "Demanda estable" : f >= 0.75 ? "Demanda moderada" : "Demanda baja");
export async function factorHoy(d) {
  const ventana = Math.floor(Date.now() / PERIODO_MS), c = d.collection("config"), m = await c.findOne({ _id: "mnegro" });
  const sig = (ventana + 1) * PERIODO_MS;
  if (m?.ventana === ventana) return { ...m, mood: estado(m.factor), proxima: sig };
  const factor = Math.round((0.6 + Math.random() * 0.8) * 100) / 100;
  await c.updateOne({ _id: "mnegro" }, { $set: { ventana, factor, mood: estado(factor) } }, { upsert: true });
  return { ventana, factor, mood: estado(factor), proxima: sig };
}
export const factorActual = factorHoy;
