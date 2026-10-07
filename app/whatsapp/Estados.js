"use client";
import { useState, useEffect } from "react";
import { Plus, X, Trash2 } from "lucide-react";
const hora = (d) => new Date(d).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
// Reduce la foto (máx. 900 px, JPEG) antes de subirla para que pese poco.
async function comprimir(file) {
  const b = await createImageBitmap(file), k = Math.min(1, 900 / Math.max(b.width, b.height)), cv = document.createElement("canvas");
  cv.width = Math.round(b.width * k); cv.height = Math.round(b.height * k); cv.getContext("2d").drawImage(b, 0, 0, cv.width, cv.height); return cv.toDataURL("image/jpeg", 0.7);
}
export default function Estados() {
  const [d, setD] = useState(null), [add, setAdd] = useState(false), [v, setV] = useState(null), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const load = async () => { const r = await fetch("/api/wa/estados"); if (r.ok) setD(await r.json()); };
  const post = async (b) => { const r = await fetch("/api/wa/estados", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); setErr(r.ok ? "" : j.error || "Error"); await load(); return r.ok; };
  useEffect(() => { load(); }, []);
  const it = v && v.g.items[v.i];
  useEffect(() => { if (it && !v.g.mio) fetch("/api/wa/estados", { method: "POST", body: JSON.stringify({ accion: "ver", id: it.id }) }); }, [it?.id]);
  const cerrar = () => { setV(null); load(); }, sig = () => (v.i < v.g.items.length - 1 ? setV({ ...v, i: v.i + 1 }) : cerrar());
  const subir = async (e) => {
    e.preventDefault(); const f = e.target, fd = new FormData(f), file = fd.get("file"), link = String(fd.get("link") || "").trim(), desc = fd.get("desc"); setBusy(true); let ok = false;
    try { if (link) ok = await post({ accion: "subir", url: link, desc }); else if (file && file.size) ok = await post({ accion: "subir", img: await comprimir(file), desc }); else setErr("Elige una imagen de tu galería o pega un link de Discord"); } catch { setErr("No se pudo leer la imagen"); }
    setBusy(false); if (ok) { f.reset(); setAdd(false); }
  };
  if (!d) return <p className="mut" style={{ padding: 14 }}>Cargando...</p>;
  const Fila = ({ g }) => <div className="wa-r" onClick={() => g.items.length && setV({ g, i: 0 })}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><div style={{ width: 42, height: 42, borderRadius: 99, border: `3px solid ${g.visto ? "var(--bd)" : "#12b886"}`, display: "grid", placeItems: "center", fontWeight: 700 }}>{g.nombre[0]}</div><div><b>{g.nombre}</b><div className="mut">{g.items.length ? `${g.items.length} · ${hora(g.items.at(-1).at)}` : "Toca + para subir un estado"}</div></div></div></div>;
  return (<>
    <div className="wa-r" style={{ cursor: "default" }}><div style={{ flex: 1 }} onClick={() => d.mio.items.length && setV({ g: d.mio, i: 0 })}><Fila g={{ ...d.mio, visto: true }} /></div><button className="btn g" onClick={() => setAdd(!add)} aria-label="Subir estado"><Plus size={18} /></button></div>
    {add && <form className="wa-r" style={{ display: "grid", gap: 8, cursor: "default" }} onSubmit={subir}><label className="mut">Foto de tu galería</label><input name="file" type="file" accept="image/*" /><label className="mut">o link de imagen de Discord</label><input name="link" placeholder="https://cdn.discordapp.com/..." /><input name="desc" maxLength={140} placeholder="Descripción (opcional)" /><button className="btn" disabled={busy}>{busy ? "Subiendo..." : "Publicar estado (24 h)"}</button></form>}
    {err && <p style={{ color: "var(--bad)", padding: "0 14px" }}>{err}</p>}
    {d.contactos.map((g) => <Fila key={g.num} g={g} />)}{!d.contactos.length && <p className="mut" style={{ padding: 14 }}>Tus contactos no tienen estados nuevos.</p>}
    {v && it && <div className="modal" style={{ background: "#000e" }} onClick={cerrar}><div style={{ width: "min(480px,100%)", color: "#fff", display: "grid", gap: 8 }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><b>{v.g.nombre} · {hora(it.at)} ({v.i + 1}/{v.g.items.length})</b><button className="btn g" onClick={cerrar}><X size={18} /></button></div>
      <img src={it.url || `/api/wa/estados?img=${it.id}`} alt="" referrerPolicy="no-referrer" onClick={sig} style={{ width: "100%", maxHeight: "62vh", objectFit: "contain", borderRadius: 12, cursor: "pointer" }} />
      {it.desc && <div style={{ textAlign: "center" }}>{it.desc}</div>}
      {v.g.mio && <div style={{ background: "#0d1526", color: "#fff", border: "1px solid #2a3b63", borderRadius: 14, padding: 14 }}><div style={{ fontWeight: 700, fontSize: 16 }}>Visto por {it.vistas.length}</div>
        <div style={{ maxHeight: "26vh", overflow: "auto", marginTop: 6 }}>{it.vistas.length ? it.vistas.map((x) => <div key={x.num} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: "#e8eefc" }}><span>{x.nombre}</span><span style={{ color: "#9fb0d0" }}>{hora(x.at)}</span></div>) : <div style={{ color: "#9fb0d0" }}>Nadie lo ha visto todavía.</div>}</div>
        <button className="btn" style={{ width: "100%", marginTop: 12, background: "#e5334a", color: "#fff", fontWeight: 700, fontSize: 15 }} onClick={async () => { await post({ accion: "borrar", id: it.id }); setV(null); }}><Trash2 size={18} />Borrar este estado</button></div>}</div></div>}</>);
}
