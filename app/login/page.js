"use client";
import { useState, useEffect } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
export default function Login() {
  const [ok, setOk] = useState(false), [err, setErr] = useState("");
  useEffect(() => {
    window.done = async (token) => { const r = await fetch("/api/captcha", { method: "POST", body: JSON.stringify({ token }) }); r.ok ? setOk(true) : setErr("Captcha inválido, intenta de nuevo."); };
    const s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; s.async = true; document.body.appendChild(s);
  }, []);
  return (<div className="wrap" style={{ maxWidth: 420, paddingTop: "12vh", textAlign: "center" }}>
    <img src="/logo.png" style={{ width: 220 }} alt="VE:RP" />
    <div className="card"><h2>Portal Ciudadano</h2><p className="mut">Verifica que eres humano y entra con tu cuenta de Discord.</p>
      <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-callback="done" style={{ display: "flex", justifyContent: "center" }} />
      {err && <p style={{ color: "var(--bad)" }}>{err}</p>}
      <a href={ok ? "/api/auth/login" : undefined} className="btn" style={{ opacity: ok ? 1 : .4, width: "100%", marginTop: 12 }}>{ok ? <LogIn size={18} /> : <ShieldCheck size={18} />} Entrar con Discord</a></div></div>);
}
