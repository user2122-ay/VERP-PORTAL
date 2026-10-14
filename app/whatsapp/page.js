import Shell from "@/components/Shell";
import Chat from "./Chat";
import Link from "next/link";
import { needUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appVisible } from "@/lib/reserva";
import { LogoSlot, LogoRuleta, LogoBJ, LogoHip, LogoDados } from "@/components/Iconos";
import { CHIP_PRECIO, tieneTelefono, WA, esDesechable } from "@/lib/redes";
export const dynamic = "force-dynamic";
const Falta = ({ t, p }) => <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}><b>{t}</b><p className="mut">{p}</p><a className="btn" href="/mercado?c=Telefon%C3%ADa">Ir al Mercado</a></div>;
const T = { flex: "1 1 150px", maxWidth: 260, aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", marginBottom: 0 };
const Logo = () => <svg viewBox="0 0 64 64" width="96" height="96" style={{ filter: "drop-shadow(0 0 10px #25D36688)" }}><circle cx="32" cy="32" r="30" fill="#25D366" /><path d="M19 46l2.6-8.4A13.5 13.5 0 1 1 28 43.6z" fill="#fff" /><path d="M26.5 26c.8 4.4 4.2 7.6 8.6 8.6l2.2-2.2-3.2-2-1.6 1.4c-2.2-1-3.4-2.2-4.4-4.4l1.4-1.6-2-3.2z" fill="#25D366" /></svg>;
export default async function P({ searchParams }) {
  const u = await needUser();
  if (!tieneTelefono(u)) return <Shell user={u}><Falta t="Necesitas un teléfono" p="Compra un celular en el Mercado (sección Telefonía) para entrar a esta opción." /></Shell>;
  if (searchParams?.app === "wa") return (<Shell user={u}>{!u.chip && !esDesechable(u) ? <Falta t="Necesitas una línea telefónica" p={`Compra tu chip en el Mercado por $${CHIP_PRECIO}. Te asignan un número +58 con tu cédula.`} /> : <Chat />}</Shell>);
  const d = await db(), cas = await appVisible(d, u, "casino"), tra = await appVisible(d, u, "trading");
  return (<Shell user={u}><h2 style={{ textAlign: "center" }}>Teléfono</h2>
    <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
      <Link href="/tikverp" className="card" style={T}><img src="/tikverp-logo.png" alt="VE TikTok" style={{ height: 96, filter: "drop-shadow(0 0 10px #2f8cffaa)" }} /><b style={{ fontSize: 20 }}>VE TikTok</b></Link>
      <Link href="/whatsapp?app=wa" className="card" style={T}><Logo /><b style={{ fontSize: 20 }}>{WA}</b></Link>
      {cas && [["tragamonedas", "Tragamonedas", <LogoSlot />], ["ruleta", "Ruleta", <LogoRuleta />], ["blackjack", "Blackjack", <LogoBJ />], ["hipodromo", "Hipódromo", <LogoHip />], ["dados", "Dados", <LogoDados />]].map(([k, n, l]) => <Link key={k} href={"/casino/" + k} className="card" style={T}>{l}<b style={{ fontSize: 20 }}>{n}</b></Link>)}
      {tra && <Link href="/trading" className="card" style={T}><svg viewBox="0 0 64 64" width="96" height="96" style={{ filter: "drop-shadow(0 0 10px #22c55eaa)" }}><rect x="6" y="8" width="52" height="48" rx="9" fill="#0f2a1c" stroke="#22c55e" strokeWidth="3" /><path d="M13 44l11-12 8 7 15-19" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><path d="M40 20h7v7" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg><b style={{ fontSize: 20 }}>Trading</b></Link>}</div></Shell>);
}
