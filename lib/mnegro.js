// Humor diario de "la página" al comprar autos robados: cada día sale un multiplicador aleatorio (x0.60 a x1.40).
export async function factorHoy(d) {
  const dia = new Date().toISOString().slice(0, 10), c = d.collection("config"), m = await c.findOne({ _id: "mnegro" });
  if (m?.dia === dia) return m;
  const factor = Math.round((0.6 + Math.random() * 0.8) * 100) / 100;
  const mood = factor >= 1.15 ? "Hoy la página está generosa" : factor >= 0.9 ? "Hoy la página está normal" : factor >= 0.75 ? "Hoy la página está tacaña" : "Hoy la página está de malas";
  await c.updateOne({ _id: "mnegro" }, { $set: { dia, factor, mood } }, { upsert: true });
  return { dia, factor, mood };
}
