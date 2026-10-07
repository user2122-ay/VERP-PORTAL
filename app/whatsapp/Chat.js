"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Plus, ArrowLeft, MessageCircle } from "lucide-react";
import { fmtTel } from "@/lib/redes";
export default function Chat() {
  const [d, setD] = useState({ yo: null, lista: [], chat: [] }), [sel, setSel] = useState(null), [txt, setTxt] = useState(""), [add, setAdd] = useState(false), [err, setErr] = useState(""), [nom, setNom] = useState(""), end = useRef(null), selR = useRef(null);
  selR.current = sel;
  const load = async () => { const r = await fetch(`/api/wa?con=${encodeURIComponent(selR.current || "")}`); if (r.ok) setD(await r.json()); };
  useEffect(() => { const t = setInterval(() => !document.hidden && load(), 3000); return () => clearInterval(t); }, []);
  useEffect(() => { load(); }, [sel]);
  useEffect(() => { end.current?.scrollIntoView(); }, [d.chat.length]);
  const post = async (b) => { const r = await fetch("/api/wa", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); setErr(r.ok ? "" : j.error || "Error"); await load(); return r.ok; };
  if (!d.yo) return <p className="mut">Cargando...</p>;
  if (!d.yo.nombre) return (<form className="card" style={{ maxWidth: 380, margin: "0 auto" }} onSubmit={(e) => { e.preventDefault(); post({ accion: "perfil", nombre: nom }); }}><h3 style={{ margin: 0 }}>Bienvenido a VE WhatsApp</h3><p className="mut">Tu número es {fmtTel(d.yo.num)}. ¿Cómo quieres que te vean tus contactos?</p>
    <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={24} placeholder="Tu nombre o apodo" required />{err && <p style={{ color: "var(--bad)" }}>{err}</p>}<button className="btn" style={{ width: "100%" }}>Guardar</button></form>);
  const cur = d.lista.find((x) => x.num === sel), titulo = cur?.alias || d.nombre || (sel && fmtTel(sel));
  return (<div className={"wa" + (sel ? " sel" : "")}>
    <div className="wa-l"><div className="wa-r" style={{ cursor: "default" }}><div><b style={{ color: "#12b886" }}>VE WhatsApp</b><div className="mut">{fmtTel(d.yo.num)} · {d.yo.nombre}</div></div><button className="btn g" onClick={() => setAdd(!add)} aria-label="Agregar contacto"><Plus size={18} /></button></div>
      {add && <form className="wa-r" style={{ display: "grid", cursor: "default" }} onSubmit={async (e) => { e.preventDefault(); const f = e.target; if (await post({ accion: "contacto", ...Object.fromEntries(new FormData(f)) })) { f.reset(); setAdd(false); } }}>
        <input name="num" required placeholder="Número (0412 1234567)" /><input name="alias" maxLength={24} placeholder="Nombre del contacto" /><button className="btn">Agregar</button></form>}
      {err && <p style={{ color: "var(--bad)", padding: "0 14px" }}>{err}</p>}
      {d.lista.map((x) => <div className="wa-r" key={x.num} onClick={() => setSel(x.num)} style={x.num === sel ? { background: "var(--bg)" } : null}><div style={{ minWidth: 0 }}><b>{x.alias}</b><div className="mut" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.ultimo || "Sin mensajes"}</div></div>{x.sin > 0 && <span className="tag">{x.sin}</span>}</div>)}
      {!d.lista.length && <p className="mut" style={{ padding: 14 }}>Aún no tienes chats. Toca + y agrega un número.</p>}</div>
    <div className="wa-c">{sel ? <><div className="wa-r" style={{ cursor: "default", justifyContent: "flex-start", alignItems: "center" }}><button className="btn g wa-back" onClick={() => setSel(null)} aria-label="Volver"><ArrowLeft size={18} /></button><b>{titulo}</b></div>
      <div className="wa-m">{d.chat.map((m) => <div key={m.id} className={"wa-b" + (m.mio ? " me" : "")}>{m.texto}<div style={{ fontSize: 10, opacity: 0.6, textAlign: "right" }}>{new Date(m.at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</div></div>)}<div ref={end} /></div>
      <form className="wa-i" onSubmit={async (e) => { e.preventDefault(); const t = txt; if (!t.trim()) return; setTxt(""); await post({ accion: "enviar", para: sel, texto: t }); }}><input value={txt} onChange={(e) => setTxt(e.target.value)} maxLength={500} placeholder="Escribe un mensaje" style={{ flex: 1 }} /><button className="btn" aria-label="Enviar"><Send size={18} /></button></form></>
      : <div className="mut" style={{ margin: "auto", textAlign: "center" }}><MessageCircle size={48} /><p>Selecciona un chat</p></div>}</div></div>);
}
