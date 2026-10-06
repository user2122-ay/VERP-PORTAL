"use client";
import { Plus, Trash2, Coins, Check } from "lucide-react";
async function call(a, data) { const r = await fetch("/api/admin", { method: "POST", body: JSON.stringify({ a, ...data }) }); const j = await r.json(); alert(r.ok ? "Listo" : j.error); if (r.ok) location.reload(); }
const f = (e) => { e.preventDefault(); return Object.fromEntries(new FormData(e.target)); };
export default function Admin({ rank, items, reps }) {
  const full = rank === "FUNDACION";
  return (<><h2>Panel de administración</h2><span className="tag">{rank.replace("_", " ")}</span>
    {full && <form className="card" onSubmit={(e) => call("addItem", f(e))}><b>Nuevo artículo (concesionario, casas, licencias)</b>
      <input name="name" placeholder="Nombre" required /><input name="brand" placeholder="Marca o ubicación" /><input name="year" placeholder="Año" />
      <input name="price" type="number" placeholder="Precio" required /><input name="img" placeholder="URL de la foto" />
      <select name="category"><option>Concesionario</option><option>Propiedades</option><option>Licencias</option><option>Objetos</option><option>Armas</option></select>
      <button className="btn"><Plus size={18} />Agregar</button></form>}
    <form className="card" onSubmit={(e) => call("money", f(e))}><b>Dar o quitar dinero</b><input name="uid" placeholder="ID de Discord" required /><input name="amount" type="number" placeholder="Monto (negativo para quitar)" required /><button className="btn"><Coins size={18} />Aplicar</button></form>
    <div className="card"><b>Reportes 911</b>{reps.map((r) => <div key={r.id} style={{ margin: "8px 0" }}>{r.t}<div className="mut">{r.d} · {r.e}</div>
      <button className="btn g" onClick={() => call("done", { id: r.id })}><Check size={16} className="neon" />Resuelto</button></div>)}</div>
    {full && <div className="card"><b>Catálogo</b>{items.map((i) => <div key={i.id} style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}><span>{i.name} · ${i.price}</span><button className="btn g" onClick={() => confirm("¿Borrar?") && call("delItem", { id: i.id })}><Trash2 size={16} className="neon" /></button></div>)}</div>}</>);
}
