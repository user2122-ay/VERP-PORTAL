"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { abrev } from "@/lib/abrev";
import { usePathname } from "next/navigation";
import PushAsk from "./PushAsk";
import { canReview } from "@/lib/roles";
import { tieneVpn } from "@/lib/vpn";
import { LayoutDashboard, Contact, Store, Siren, Landmark, Bell, Package, Smartphone, Briefcase, ShieldCheck, Sun, Moon, LogOut, Globe, Skull, Shield, Users } from "lucide-react";
const L = [["/", "Panel", LayoutDashboard], ["/cedula", "Cédula", Contact], ["/banco", "Banco", Landmark], ["/mercado", "Mercado", Store], ["/inventario", "Inventario", Package], ["/trabajos", "Trabajos", Briefcase], ["/whatsapp", "Teléfono", Smartphone], ["/notificaciones", "Avisos", Bell], ["/emergencias", "911", Siren]];
// Miembros registrados en la página (se actualiza solo cada minuto)
function Miembros() {
  const [n, setN] = useState(null);
  useEffect(() => { let on = true; const f = () => fetch("/api/miembros").then((r) => r.json()).then((j) => on && setN(j.n)).catch(() => {}); f(); const t = setInterval(f, 6e4); return () => { on = false; clearInterval(t); }; }, []);
  return n == null ? null : <span className="miembros" title={`${n.toLocaleString("es")} miembros registrados`}><Users size={14} />{abrev(n)}</span>;
}
export default function Shell({ user, children }) {
  const p = usePathname();
  function toggle(e) {
    const d = document.documentElement, n = d.dataset.theme === "light" ? "dark" : "light";
    const go = () => { d.dataset.theme = n; localStorage.t = n; };
    if (!document.startViewTransition) return go();
    const x = e.clientX, y = e.clientY, r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(go).ready.then(() => d.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 650, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }));
  }
  const vpn = tieneVpn(user);
  const items = [...L, ...(vpn ? [["/darkweb", "Dark Web", Globe]] : []), ...(vpn || user.rank === "FUNDACION" ? [["/delictivo", "Delictivo", Skull]] : []), ...(user.agente || user.dev ? [["/mdt", "MDT", Shield]] : []), ...(canReview(user.rank) ? [["/admin", "Administración", ShieldCheck]] : [])];
  return (<><div className="top"><img src="/logo.png" alt="VE:RP" /><Miembros />
    <nav className="nav">{items.map(([h, t, I]) => <Link key={h} href={h} className={p === h ? "on" : ""}><I size={18} className="neon" />{t}</Link>)}</nav>
    <button className="btn g" onClick={toggle} aria-label="Cambiar tema"><Sun size={18} className="neon" /></button>
    <a className="btn g" href="/api/auth/logout" aria-label="Salir"><LogOut size={18} className="neon" /></a></div>
    <main className="wrap"><PushAsk />{children}</main></>);
}
