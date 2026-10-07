"use client";
import { useState } from "react";
import { Search, Plus, Trash2, Skull, Check } from "lucide-react";
const CATS = ["Concesionario", "Propiedades", "Licencias", "Objetos", "Armas"], CIVIL = ["SOLTERO", "CASADO", "DIVORCIADO", "VIUDO"], $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
const post = async (a, data) => { const r = await fetch("/api/admin", { method: "POST", body: JSON.stringify({ a, ...data }) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return false; } return true; };
const vals = (e) => { e.preventDefault(); return Object.fromEntries(new FormData(e.target)); };
const ask = (t) => { const r = prompt(t); if (r === null) return null; if (r.trim().length < 3) { alert("La razón es obligatoria (mínimo 3 letras)"); return null; } return r.trim(); };
const Razon = () => <input name="razon" placeholder="Razón (obligatoria)" required minLength={3} />;
function Usuarios({ items }) {
  const [q, setQ] = useState(""), [res, setRes] = useState(null), [u, setU] = useState(null);
  const abrir = async (id) => { const r = await fetch("/api/admin?uid=" + encodeURIComponent(id)); if (r.ok) setU((await r.json()).user); };
  const buscar = async (e) => { e.preventDefault(); const r = await fetch("/api/admin?q=" + encodeURIComponent(q)); if (r.ok) setRes((await r.json()).users); };
  const act = async (a, data) => { if (await post(a, { uid: u.id, ...data })) { alert("Listo"); if (a === "ck") { setU(null); setRes(null); } else abrir(u.id); } };
  const c = u?.cedula, banks = u ? Object.keys(u.cuentas) : [];
  return (<>
    <form className="card" onSubmit={buscar} style={{ display: "flex", gap: 8 }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por usuario de Discord, Roblox, nombre, cédula o ID" style={{ flex: 1 }} /><button className="btn"><Search size={18} />Buscar</button></form>
    {res && !res.length && <p className="mut">Sin resultados.</p>}
    {res && res.map((x) => <div key={x.id} className="card" style={{ cursor: "pointer", marginTop: 8 }} onClick={() => abrir(x.id)}><b>{x.name}</b> <span className="mut">{x.cedula ? `${x.cedula.nombres} ${x.cedula.apellidos} · V-${String(x.cedula.num).padStart(8, "0")} · ${x.cedula.roblox}` : "Sin cédula"}</span></div>)}
    {u && <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <div className="card"><b>{u.name}</b> <span className="mut">ID {u.id}{u.chip ? ` · Línea ${u.chip}` : ""}</span><div>Efectivo {$(u.balance)}{banks.map((k) => ` · ${k.toUpperCase()} ${$(u.cuentas[k].saldo)}`)}</div></div>
      {c && <form className="card" onSubmit={(e) => { const v = vals(e); act("editCedula", { cedula: { nombres: v.nombres, apellidos: v.apellidos, edoCivil: v.edoCivil, lugar: v.lugar, roblox: v.roblox, nac: v.nac }, razon: v.razon }); }}><b>Editar cédula</b>
        <input name="nombres" defaultValue={c.nombres} placeholder="Nombres" /><input name="apellidos" defaultValue={c.apellidos} placeholder="Apellidos" /><input name="nac" type="date" defaultValue={c.nac ? String(c.nac).slice(0, 10) : ""} />
        <select name="edoCivil" defaultValue={c.edoCivil}>{[...new Set([c.edoCivil, ...CIVIL])].map((x) => <option key={x}>{x}</option>)}</select><input name="lugar" defaultValue={c.lugar} placeholder="Lugar de nacimiento" /><input name="roblox" defaultValue={c.roblox} placeholder="Usuario de Roblox" /><Razon /><button className="btn">Guardar cambios</button></form>}
      <form className="card" onSubmit={(e) => act("dinero", vals(e))}><b>Dinero</b><select name="tipo"><option value="agregar">Agregar dinero</option><option value="quitar">Quitar dinero</option></select>
        <select name="destino"><option value="efectivo">Efectivo</option>{banks.map((k) => <option key={k} value={k}>Cuenta {k.toUpperCase()}</option>)}</select><input name="monto" type="number" min="1" placeholder="Monto" required /><Razon /><button className="btn">Aplicar</button></form>
      <div className="card"><b>Inventario ({u.inventory.length})</b>{u.inventory.map((i, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", margin: "6px 0" }}><span>{i.name} <span className="mut">{i.category} · {$(i.price)}</span></span>
        <button className="btn g" onClick={() => { const r = ask(`Razón para quitar "${i.name}":`); if (r) act("invQuitar", { name: i.name, at: i.at, razon: r }); }}><Trash2 size={16} /></button></div>)}{!u.inventory.length && <p className="mut">Vacío.</p>}
        <form onSubmit={(e) => act("invAgregar", vals(e))} style={{ display: "grid", gap: 8, marginTop: 8 }}><select name="itemId">{items.map((i) => <option key={i.id} value={i.id}>{i.name} · {$(i.price)}</option>)}</select><Razon /><button className="btn g"><Plus size={16} />Agregar al inventario</button></form></div>
      <form className="card" style={{ borderColor: "var(--bad)" }} onSubmit={(e) => { if (!confirm("CK: se borra TODO de este usuario, incluida la cédula. ¿Continuar?")) return e.preventDefault(); act("ck", vals(e)); }}><b style={{ color: "var(--bad)" }}>CK (character kill)</b>
        <p className="mut">Borra cédula, efectivo, cuentas, inventario, línea, chats y estados. El usuario podrá registrar un personaje nuevo.</p><input name="confirm" placeholder='Escribe "CK" para confirmar' required /><Razon /><button className="btn r"><Skull size={16} />Aplicar CK</button></form></div>}</>);
}
function Mercado({ items }) {
  const [cat, setCat] = useState(CATS[0]);
  return (<><form className="card" onSubmit={async (e) => { const v = vals(e), f = e.target; if (await post("addItem", v)) { alert("Agregado"); f.reset(); location.reload(); } }}><b>Nuevo artículo del mercado</b>
    <select name="category" value={cat} onChange={(e) => setCat(e.target.value)}>{CATS.map((x) => <option key={x}>{x}</option>)}</select><input name="name" placeholder="Nombre" required /><input name="price" type="number" min="0" placeholder="Precio" required /><textarea name="desc" placeholder="Descripción" rows={2} />
    {cat === "Propiedades" && <><input name="ubicacion" placeholder="Ubicación (ej: Caracas 405)" required /><input name="impuesto" type="number" min="0" placeholder="Impuesto mensual" /></>}
    {cat === "Concesionario" && <><input name="clase" placeholder="Clase (ej: Deportivo, SUV)" /><input name="brand" placeholder="Marca / modelo" /><input name="year" placeholder="Año" /></>}
    <input name="img" placeholder="URL de la foto (opcional)" /><input name="stock" type="number" min="1" placeholder="Stock (vacío = ilimitado)" /><Razon /><button className="btn"><Plus size={18} />Agregar</button></form>
    <div className="card" style={{ marginTop: 12 }}><b>Catálogo ({items.length})</b>{items.map((i) => <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", margin: "6px 0" }}><span>{i.name} <span className="mut">{i.category} · {$(i.price)}</span></span><span style={{ display: "flex", gap: 6 }}>
      <button className="btn g" onClick={async () => { const p = prompt("Nuevo precio:", i.price); if (p === null) return; const r = ask("Razón del cambio de precio:"); if (r && (await post("setPrice", { id: i.id, price: p, razon: r }))) location.reload(); }}>Precio</button>
      <button className="btn g" onClick={async () => { const r = ask(`Razón para eliminar "${i.name}":`); if (r && (await post("delItem", { id: i.id, razon: r }))) location.reload(); }}><Trash2 size={16} /></button></span></div>)}</div></>);
}
export default function Admin({ rank, items, reps, audit }) {
  const [tab, setTab] = useState("Usuarios");
  return (<div style={{ maxWidth: 900, margin: "0 auto" }}><h2>Panel de administración</h2><span className="tag">{rank.replace("_", " ")}</span>
    <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>{["Usuarios", "Mercado", "Auditoría", "Reportes 911"].map((t) => <button key={t} className={"btn " + (tab === t ? "" : "g")} onClick={() => setTab(t)}>{t}</button>)}</div>
    {tab === "Usuarios" && <Usuarios items={items} />}{tab === "Mercado" && <Mercado items={items} />}
    {tab === "Auditoría" && <div className="card"><b>Registro de auditoría (últimas 100 acciones)</b>{audit.map((x) => <div key={x.id} style={{ padding: "8px 0", borderTop: "1px solid var(--bd)" }}><b>{x.act}</b> · {x.obj}<div className="mut">{x.by} ({String(x.rank).replace("_", " ")}) · {new Date(x.at).toLocaleString("es")}</div><div>Razón: {x.razon}</div></div>)}{!audit.length && <p className="mut">Sin registros.</p>}</div>}
    {tab === "Reportes 911" && <div className="card"><b>Reportes 911</b>{reps.map((r) => <div key={r.id} style={{ margin: "8px 0" }}>{r.t}<div className="mut">{r.d} · {r.e}</div><button className="btn g" onClick={async () => { if (await post("done", { id: r.id })) location.reload(); }}><Check size={16} className="neon" />Resuelto</button></div>)}{!reps.length && <p className="mut">Sin reportes pendientes.</p>}</div>}</div>);
}
