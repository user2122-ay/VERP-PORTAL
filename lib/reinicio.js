// REINICIO TOTAL de la base de datos (solo el Developer, desde Administración → Reiniciar).
// Se QUEDAN: el catálogo del Mercado (items) y los negocios (sin dueño, para volver a comprarlos), la configuración (apertura, mensajes de ER:LC, etc.)
// y la Tesorería con exactamente $3.000.000. Todo lo demás se borra. Los usuarios nuevos reciben $15.000 de bienvenida al entrar (lo da el login).
import { SALDO_INICIAL } from "./tesoreria";
export const SALDO_BIENVENIDA = 15000;
// Colecciones que se vacían por completo.
export const BORRAR = ["tx", "notifs", "wa_msgs", "wa_estados", "robos", "apelaciones", "placas", "multas", "trabajos", "reports", "reportes", "expedientes", "dw", "asaltos", "allanamientos",
  "tv_audio", "tv_posts", "tv_perfiles", "tv_likes", "tv_follows", "tv_com", "revisiones", "pendientes", "decomisos", "arrestos", "usados", "ministerio_mejoras", "erlc_jail", "cultivo_compras", "counters", "audit", "tesoreria"];
// De cada usuario que se conserva (staff/Developer/agentes MDT) solo se queda su identidad y su cargo.
const MANTENER = ["_id", "id", "name", "avatar", "dev", "staff", "staffPlaca", "agente"];
const ES_STAFF = { $or: [{ staff: { $nin: [null, ""] } }, { dev: true }, { agente: { $exists: true } }] };
const CAMPOS_NEGOCIO = ["desde", "inversion", "ganado", "ventas", "perdido", "evadido", "impuestoPagado", "impNegocio", "morosoDesde", "clausuradoAt", "clausuraRazon", "clausuraMulta", "multaPagadaAt", "reabiertoAt", "limpioAt", "vendido", "vetado"];
export async function contarReinicio(d) {
  const info = {}; for (const c of BORRAR) info[c] = await d.collection(c).countDocuments({});
  const us = d.collection("users");
  info.usuarios = await us.countDocuments({}); info.staff = await us.countDocuments(ES_STAFF);
  info.negociosConDueno = await d.collection("negocios").countDocuments({ owner: { $nin: [null, ""] } });
  info.casasVendidas = await d.collection("items").countDocuments({ category: "Propiedades", stock: 0 });
  info.tesoreria = (await d.collection("config").findOne({ _id: "tesoreria" }))?.saldo || 0;
  return info;
}
export async function reiniciarTodo(d, { conservarStaff = true } = {}) {
  const res = {};
  for (const c of BORRAR) res[c] = (await d.collection(c).deleteMany({})).deletedCount;
  // Negocios: vuelven a estar a la venta (sin dueño, sin multas ni estadísticas). Se conservan sus planes y precios.
  res.negocios = (await d.collection("negocios").updateMany({}, { $set: { owner: null, estado: "normal", pagaImpuesto: true }, $unset: Object.fromEntries(CAMPOS_NEGOCIO.map((k) => [k, ""])) })).modifiedCount;
  // Casas vendidas vuelven al Mercado.
  res.casasRestauradas = (await d.collection("items").updateMany({ category: "Propiedades", stock: 0 }, { $set: { stock: 1 } })).modifiedCount;
  const us = d.collection("users");
  if (conservarStaff) {
    res.usuariosBorrados = (await us.deleteMany({ $nor: [ES_STAFF] })).deletedCount;
    res.staffConservado = (await us.updateMany(ES_STAFF, [
      { $replaceWith: { $arrayToObject: { $filter: { input: { $objectToArray: "$$ROOT" }, as: "kv", cond: { $in: ["$$kv.k", MANTENER] } } } } },
      { $set: { balance: SALDO_BIENVENIDA, inventory: [], createdAt: new Date() } },
      { $set: { agente: { $cond: [{ $ifNull: ["$agente", false] }, { rango: "$agente.rango", placa: "$agente.placa", depto: "$agente.depto" }, "$$REMOVE"] } } },
    ])).modifiedCount;
  } else res.usuariosBorrados = (await us.deleteMany({})).deletedCount;
  // Tesorería: exactamente $3.000.000 y el ITBMS vuelve al 7%.
  await d.collection("config").updateOne({ _id: "tesoreria" }, { $set: { saldo: SALDO_INICIAL, inicial: true }, $unset: { itbms: "" } }, { upsert: true });
  await d.collection("tesoreria").insertOne({ tipo: "ingreso", monto: SALDO_INICIAL, concepto: "Fondo inicial del Estado (reinicio)", origen: "Sistema", at: new Date() });
  res.tesoreria = SALDO_INICIAL;
  return res;
}
