"use client";
import { useState } from "react";
import { UserPlus } from "lucide-react";
export default function Form() {
  const [e, setE] = useState("");
  async function go(ev) { ev.preventDefault(); const r = await fetch("/api/cedula", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(ev.target))) }); r.ok ? (location.href = "/") : setE((await r.json()).error); }
  return (<form className="card" onSubmit={go}><h2>Crea tu cédula</h2><p className="mut">Aún no tienes identidad en Venezuela RP. Completa tus datos para entrar.</p>
    <label>Nombres</label><input name="nombres" required maxLength={40} /><label>Apellidos</label><input name="apellidos" required maxLength={40} />
    <label>Fecha de nacimiento</label><input name="nac" type="date" required /><label>Usuario de Roblox</label><input name="roblox" required maxLength={30} />
    {e && <p style={{ color: "var(--bad)" }}>{e}</p>}<button className="btn" style={{ width: "100%" }}><UserPlus size={18} />Crear cédula</button></form>);
}
