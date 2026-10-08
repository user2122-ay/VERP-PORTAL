"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PushAsk from "./PushAsk";
import { canReview } from "@/lib/roles";
import { tieneVpn } from "@/lib/vpn";
import { LayoutDashboard, Contact, Store, Siren, Landmark, Bell, Package, MessageCircle, Briefcase, ShieldCheck, Sun, Moon, LogOut, Globe, Skull, Shield } from "lucide-react";
const L = [["/", "Panel", LayoutDashboard], ["/cedula", "Cédula", Contact], ["/banco", "Banco", Landmark], ["/mercado", "Mercado", Store], ["/inventario", "Inventario", Package], ["/whatsapp", "WhatsApp", MessageCircle], ["/notificaciones", "Avisos", Bell], ["/emergencias", "911", Siren]];
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
  const items = [...L, ...(vpn ? [["/darkweb", "Dark Web", Globe]] : []), ...(user.delictivo || user.rank === "FUNDACION" ? [["/delictivo", "Delictivo", Skull]] : []), ...(user.agente || user.dev ? [["/mdt", "MDT", Shield]] : []), ...(canReview(user.rank) ? [["/admin", "Administración", ShieldCheck]] : [])];
  return (<><div className="top"><img src="/logo.png" alt="VE:RP" />
    <nav className="nav">{items.map(([h, t, I]) => <Link key={h} href={h} className={p === h ? "on" : ""}><I size={18} className="neon" />{t}</Link>)}</nav>
    <button className="btn g" onClick={toggle} aria-label="Cambiar tema"><Sun size={18} className="neon" /></button>
    <a className="btn g" href="/api/auth/logout" aria-label="Salir"><LogOut size={18} className="neon" /></a></div>
    <main className="wrap"><PushAsk />{children}</main></>);
}
