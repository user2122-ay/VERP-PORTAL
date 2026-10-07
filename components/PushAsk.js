"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const b64 = (s) => { const r = atob((s + "=".repeat((4 - (s.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
async function subscribe() {
  const reg = await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready;
  const s = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(KEY) }));
  await fetch("/api/push", { method: "POST", body: JSON.stringify(s.toJSON()) });
}
export default function PushAsk() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!KEY || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "default" && !localStorage.pushNo) setShow(true);
    else if (Notification.permission === "granted" && !sessionStorage.pushOk) { sessionStorage.pushOk = 1; subscribe().catch(() => {}); }
  }, []);
  if (!show) return null;
  return (<div className="card" style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 12 }}><span><Bell size={16} /> ¿Recibir mensajes y avisos en este dispositivo aunque no estés en la web?</span>
    <span><button className="btn" onClick={async () => { setShow(false); if ((await Notification.requestPermission()) === "granted") subscribe().catch(() => {}); }}>Activar</button> <button className="btn g" onClick={() => { localStorage.pushNo = 1; setShow(false); }}>Ahora no</button></span></div>);
}
