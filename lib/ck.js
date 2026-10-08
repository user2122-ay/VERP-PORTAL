// CK: borra el personaje (cédula, dinero, cuentas, inventario, línea, chats, estados...). La persona podrá registrar un personaje nuevo con el dinero inicial.
export const INICIAL = 15000;
export async function aplicarCK(d, t) {
  const num = t.chip?.num;
  await d.collection("users").updateOne({ id: t.id }, { $unset: { cedula: "", chip: "", wa: "", plan: "", cuentas: "", push: "", verif: "", tarjeta: "", cvc: "", venc: "", cuerpo: "", muerte: "" }, $set: { balance: INICIAL, inventory: [] } });
  await Promise.all([d.collection("tx").deleteMany({ user: t.id }), d.collection("notifs").deleteMany({ uid: t.id }), d.collection("pendientes").deleteMany({ $or: [{ from: t.id }, { to: t.id }] }),
    ...(num ? [d.collection("wa_msgs").deleteMany({ $or: [{ de: num }, { para: num }] }), d.collection("wa_estados").deleteMany({ num })] : [])]);
}
