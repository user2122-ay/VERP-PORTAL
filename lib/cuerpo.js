// Sistema del cuerpo: comida y agua bajan de forma lineal hasta 0% en HORAS horas desde la última vez que comiste o bebiste.
// Si cualquiera llega a 0% el personaje muere (CK) y se bloquea toda la página hasta apelar o crear otro usuario.
export const HORAS = { comida: 24, agua: 24 };
export const nivelDe = (e, h, ref = Date.now()) => (e ? Math.max(0, e.n - ((ref - +new Date(e.t)) / 36e5) * (100 / h)) : 100);
// El hambre y la sed SOLO corren con el servidor abierto (lo marca el panel de Apertura). Cerrado = las barras se quedan quietas y no se puede comer.
export async function servidorEstado(d) {
  const r = await d.collection("config").findOne({ _id: "apertura" }), cerrado = r?.servidor === "cerrado";
  return { abierto: !cerrado, desde: cerrado && r.cerradoDesde ? new Date(r.cerradoDesde) : null };
}
// Al abrir el servidor se corre la hora de "la última vez que comiste/bebiste" lo que estuvo cerrado, para que ese tiempo no cuente.
export async function descongelarCuerpo(d, ms) {
  if (!(ms > 0)) return; const col = d.collection("users");
  for (const k of ["comida", "agua"]) await col.updateMany({ [`cuerpo.${k}.t`]: { $type: "date" }, muerte: { $exists: false } }, [{ $set: { [`cuerpo.${k}.t`]: { $dateAdd: { startDate: `$cuerpo.${k}.t`, unit: "millisecond", amount: Math.round(ms) } } } }]);
}
const agotado = (e, h) => +new Date(e.t) + (e.n / (100 / h)) * 36e5;
export async function aplicarCuerpo(d, u) {
  if (!u?.cedula || u.dev || u.muerte) return u; // el Developer no se muere
  const ahora = new Date(), col = d.collection("users");
  if (!u.cuerpo) { const cuerpo = { comida: { n: 100, t: ahora }, agua: { n: 100, t: ahora } }; await col.updateOne({ id: u.id, cuerpo: { $exists: false } }, { $set: { cuerpo } }); return { ...u, cuerpo }; }
  if (!(await servidorEstado(d)).abierto) return u; // servidor cerrado: no baja nada y nadie muere
  const E = (x) => x || { n: 100, t: ahora }, tc = agotado(E(u.cuerpo.comida), HORAS.comida), ta = agotado(E(u.cuerpo.agua), HORAS.agua);
  if (Math.min(tc, ta) > +ahora) return u;
  const muerte = { causa: ta <= tc ? "sed" : "hambre", at: new Date(Math.min(tc, ta)) };
  await col.updateOne({ id: u.id, muerte: { $exists: false } }, { $set: { muerte } });
  return { ...u, muerte };
}
