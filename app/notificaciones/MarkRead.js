"use client";
import { useRouter } from "next/navigation";
export default function MarkRead() {
  const r = useRouter();
  return <button className="btn g" onClick={async () => { await fetch("/api/notificaciones", { method: "POST" }); r.refresh(); }}>Marcar todas como leídas</button>;
}
