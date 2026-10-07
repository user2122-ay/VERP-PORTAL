import webpush from "web-push";
import { db } from "./db";
let ok = null;
// Envía una notificación push a los dispositivos del usuario (si activó el permiso y hay llaves VAPID configuradas).
export async function enviarPush(uid, p) {
  try {
    if (ok === null) { ok = !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY); if (ok) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@verp.local", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY); }
    if (!ok) return;
    const col = (await db()).collection("users"), u = await col.findOne({ id: uid }, { projection: { push: 1 } });
    await Promise.all((u?.push || []).map((s) => webpush.sendNotification(s, JSON.stringify(p)).catch((e) => (e.statusCode === 404 || e.statusCode === 410) ? col.updateOne({ id: uid }, { $pull: { push: { endpoint: s.endpoint } } }) : null)));
  } catch {}
}
