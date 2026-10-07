// Placas VEN-000 y registro de matrículas (colección "placas"). El registro dice quién es el dueño oficial de cada auto.
export const normPlaca = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
// Crea una placa libre (VEN-482) y la registra. Si se agotan las de 3 dígitos pasa a 4.
export async function nuevaPlaca(d, datos = {}) {
  const col = d.collection("placas");
  for (let i = 0; i < 80; i++) {
    const dig = i < 50 ? 3 : 4, n = String(Math.floor(Math.random() * 10 ** dig)).padStart(dig, "0");
    try { await col.insertOne({ _id: "VEN" + n, placa: "VEN-" + n, modelo: "", color: "", dueno: null, duenoN: null, robado: false, estado: "", at: new Date(), ...datos }); return "VEN-" + n; }
    catch (e) { if (e.code !== 11000) throw e; }
  }
  throw new Error("No quedan placas libres");
}
// Registra (o actualiza) una placa que ya existe fuera del sistema. No cambia el dueño oficial si ya estaba registrado.
export async function registrarPlaca(d, placa, datos = {}) {
  const key = normPlaca(placa); if (!key) return;
  const { robado = false, estado = "", ...ins } = datos;
  await d.collection("placas").updateOne({ _id: key }, { $set: { robado, estado }, $setOnInsert: { placa: String(placa).toUpperCase(), dueno: null, duenoN: null, modelo: "", color: "", at: new Date(), ...ins } }, { upsert: true });
}
// Cuando el auto se vende en la Dark Web, el dueño anterior deja de figurar como propietario.
export const traspasarPlaca = (d, placa) => placa ? d.collection("placas").updateOne({ _id: normPlaca(placa) }, { $set: { dueno: null, duenoN: null, robado: true, estado: "Traspasado en el mercado negro", traspaso: new Date() } }) : null;
