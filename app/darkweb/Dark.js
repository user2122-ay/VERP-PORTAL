"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Car } from "lucide-react";
import Comprar from "../mercado/PagoModal";
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
const call = async (b, ok) => { const r = await fetch("/api/darkweb", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return false; } if (ok) alert(ok); return j; };
const sel = (autos, e) => { const a = autos[+new FormData(e.target).get("k")]; return a ? { i: a.i, name: a.name, at: a.at } : {}; };
function Chat({ id, yo, cerrar }) {
  const [l, setL] = useState(null), [t, setT] = useState(""), [m, setM] = useState(""), fin = useRef();
  const cargar = async () => { const r = await fetch("/api/darkweb?id=" + id, { cache: "no-store" }); if (r.ok) setL((await r.json()).l); };
  useEffect(() => { cargar(); const x = setInterval(cargar, 3500); return () => clearInterval(x); }, []);
  useEffect(() => { fin.current?.scrollIntoView(); }, [l?.chat?.length]);
  if (!l) return null;
  const abierta = l.estado === "abierta", puede = abierta && l.propuesta && l.propuesta.by !== yo;
  return (<div className="modal" onClick={cerrar}><div className="card dk" style={{ width: "min(460px,100%)" }} onClick={(e) => e.stopPropagation()}><b>{l.car}</b><div className="big" style={{ fontSize: 26, color: "var(--ac)" }}>{$(l.precio)}</div>
    <div className="mut">{!abierta ? `Negociación ${l.estado}` : l.propuesta?.by === yo ? "Esperando respuesta a tu propuesta" : "La otra parte propuso este precio"}</div>
    <div className="chatb">{l.chat.map((c, k) => c.sys ? <div key={k} className="mut" style={{ textAlign: "center" }}>{c.txt}</div> : <div key={k} className={"wa-b" + (c.by === yo ? " me" : "")}><small className="mut" style={{ color: c.by === yo ? "#fff" : undefined }}>{c.name}</small><div>{c.txt}</div></div>)}<div ref={fin} /></div>
    {abierta && <><form className="row2" onSubmit={async (e) => { e.preventDefault(); if (!t.trim()) return; const x = t; setT(""); await call({ accion: "msg", id, txt: x }); cargar(); }}><input value={t} onChange={(e) => setT(e.target.value)} placeholder="Escribe un mensaje" /><button className="btn"><Send size={16} /></button></form>
      <form className="row2" onSubmit={async (e) => { e.preventDefault(); if (await call({ accion: "ofrecer", id, monto: m })) { setM(""); cargar(); } }}><input type="number" min="1" value={m} onChange={(e) => setM(e.target.value)} placeholder="Ofrezco $..." /><button className="btn g">Ofrecer</button></form>
      <button className="btn" style={{ width: "100%", marginTop: 6 }} disabled={!puede} onClick={async () => { if (confirm(`¿Aceptar ${$(l.precio)}? La venta se cierra al instante.`) && (await call({ accion: "aceptar", id }, "¡Trato cerrado!"))) location.reload(); }}>{puede ? `Aceptar ${$(l.precio)}` : "Aceptar (esperando a la otra parte)"}</button></>}
    <button className="btn g" style={{ width: "100%", marginTop: 8 }} onClick={cerrar}>Cerrar</button></div></div>);
}
export default function Dark({ mercado, yo, delictivo, dueño, autos, listas, metodos }) {
  const [chat, setChat] = useState(null), car = (a, k) => <option key={k} value={k}>{a.name}{a.placa ? ` · ${a.placa}` : ""}{a.robado ? " (robado)" : ""}</option>;
  return (<>{chat && <Chat id={chat} yo={yo} cerrar={() => setChat(null)} />}
    {mercado && <div className="card"><b>Mercado negro de hoy</b><div className="big" style={{ fontSize: 26, color: mercado.factor >= 1 ? "var(--ok)" : "var(--bad)" }}>x{mercado.factor}</div><div className="mut">{mercado.mood}. La página paga los autos robados según el humor del día: cambia cada día, a veces sube y a veces baja.</div></div>}
    {delictivo && <form className="card" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.target); if (await call({ accion: "publicar", ...sel(autos, e), precio: f.get("precio"), pago: f.get("pago") }, "Publicado")) location.reload(); }}><b>Vender un auto robado</b><p className="mut">Precio inicial máximo $15.000. Si nadie tiene el Taller clandestino, la página lo compra sola y paga según su humor del día. Si hay dueño, negocian por chat.</p>
      <div className="row2"><select name="k">{autos.map(car)}</select><input name="precio" type="number" min="1" max="15000" placeholder="Precio inicial (máx. $15.000)" required /><select name="pago">{metodos.map((m) => <option key={m.k} value={m.k}>Cobrar en {m.label}</option>)}</select></div>
      <button className="btn" disabled={!autos.length}><Car size={16} />Publicar</button>{!autos.length && <span className="mut"> No tienes autos en el inventario.</span>}</form>}
    {dueño && <form className="card" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.target); if (await call({ accion: "ventaSistema", ...sel(autos, e), precio: f.get("precio"), pago: f.get("pago") }, "Vendido a la página")) location.reload(); }}><b>Vender un auto robado a la página</b>
      <p className="mut">Pago inmediato según el humor del día de la página (puede subir o bajar). Máximo $15.000 y solo puedes ganar $1.000 sobre lo que pagaste (si lo compraste en $4.500, lo vendes hasta en $5.500).</p>
      <div className="row2"><select name="k">{autos.map((a, k) => a.robado ? <option key={k} value={k}>{a.name}{a.placa ? ` · ${a.placa}` : ""} · pagado {$(a.price)} · máx. {$(Math.min(15000, a.price + 1000))}</option> : null)}</select><input name="precio" type="number" min="1" max="15000" placeholder="Precio de venta" required /><select name="pago">{metodos.map((m) => <option key={m.k} value={m.k}>Cobrar en {m.label}</option>)}</select></div>
      <button className="btn" disabled={!autos.some((a) => a.robado)}><Car size={16} />Vender a la página</button></form>}
    <h3 style={{ marginTop: 16 }}>Publicaciones abiertas</h3>
    <div className="grid">{listas.map((l) => (<div key={l.id} className="card"><div className="mi">{l.img ? <img src={l.img} alt="" /> : <span className="mut">Sin foto</span>}</div><span className="tag">{l.tipo === "oferta" ? "Oferta al taller" : "Venta del taller"}</span> <span className="rob-t" style={{ fontSize: 11 }}>ROBADO</span>
      <div><b>{l.car}</b></div><div className="mut">{l.placa && `Placa ${l.placa} · `}{l.color}</div><div className="mut">Vendedor: {l.vendedor}</div><div className="big" style={{ fontSize: 24, color: "var(--ac)" }}>{$(l.precio)}</div>
      {l.part && <button className="btn" style={{ width: "100%" }} onClick={() => setChat(l.id)}>Abrir negociación</button>}
      {l.tipo === "oferta" && l.mio && <button className="btn g" style={{ width: "100%", marginTop: 6 }} onClick={async () => { if (confirm("¿Cancelar y recuperar el auto?") && (await call({ accion: "cancelar", id: l.id }, "Cancelado"))) location.reload(); }}>Cancelar publicación</button>}
      {l.tipo === "reventa" && !l.mio && <Comprar url="/api/darkweb" body={{ accion: "comprar", id: l.id }} metodos={metodos} msg="Compra realizada. El auto está en tu inventario." />}</div>))}
      {!listas.length && <div className="card mut">No hay nada publicado por ahora.</div>}</div></>);
}
