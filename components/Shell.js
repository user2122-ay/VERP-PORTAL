"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { canAdmin } from "@/lib/roles";
import { LayoutDashboard, Contact, Store, Siren, ShieldCheck, Sun, Moon, LogOut } from "lucide-react";
const L = [["/", "Panel", LayoutDashboard], ["/cedula", "Cédula", Contact], ["/mercado", "Mercado", Store], ["/emergencias", "911", Siren]];
export default function Shell({ user, children }) {
  const p = usePathname();
  function toggle(e) {
    const d = document.documentElement, n = d.dataset.theme === "light" ? "dark" : "light";
    const go = () => { d.dataset.theme = n; localStorage.t = n; };
    if (!document.startViewTransition) return go();
    const x = e.clientX, y = e.clientY, r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(go).ready.then(() => d.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 650, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }));
  }
  const items = canAdmin(user.rank) ? [...L, ["/admin", "Admin", ShieldCheck]] : L;
  return (<><div className="top"><img src="/logo.png" alt="VE:RP" />
    <nav className="nav">{items.map(([h, t, I]) => <Link key={h} href={h} className={p === h ? "on" : ""}><I size={18} className="neon" />{t}</Link>)}</nav>
    <button className="btn g" onClick={toggle} aria-label="Cambiar tema"><Sun size={18} className="neon" /></button>
    <a className="btn g" href="/api/auth/logout" aria-label="Salir"><LogOut size={18} className="neon" /></a></div>
    <main className="wrap">{children}</main></>);
}
