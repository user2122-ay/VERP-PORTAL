"use client";
import { useState } from "react";
import { Leaf } from "lucide-react";
import Comprar from "../mercado/PagoModal";
import { PLANTAS, LIM_DIA, POR_KILO, TRAF, duracionCultivo } from "@/lib/cultivo";
const $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
const call = async (b) => { const r = await fetch("/api/cultivo", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return null; } return j; };
function Stack({ s, factor, metodos }) {
  const [unidad, setU] = useState("bolsa"), [cant, setC] = useState(""), [pago, setP] = useState("efectivo"), kilos = Math.floor(s.cant / POR_KILO), n = Math.floor(+cant) || 0, est = Math.round(n * TRAF[unidad] * factor);
  return (<div className="card" style={{ marginTop: 8 }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}>{s.img && <img src={s.img} alt="" style={{ width: 70, height: 46, objectFit: "cover", borderRadius: 8 }} />}<div><b>{s.name}</b><div className="mut">{s.cant} bolsitas · {kilos} kilo(s) completos ({POR_KILO} bolsitas = 1 kilo)</div></div></div>
    <div className="row2" style={{ marginTop: 8 }}><select value={unidad} onChange={(e) => setU(e.target.value)}><option value="bolsa">Bolsitas</option><option value="kilo">Kilos</option></select><input type="number" min="1" value={cant} onChange={(e) => setC(e.target.value)} placeholder="Cantidad" /><select value={pago} onChange={(e) => setP(e.target.value)}>{metodos.map((m) => <option key={m.k} value={m.k}>Cobrar en {m.label}</option>)}</select></div>
    {n > 0 && <div className="mut" style={{ marginTop: 4 }}>Te pagarían <b style={{ color: "var(--ac)" }}>{$(est)}</b> a la cotización de ahora (x{factor}).</div>}
    <button className="btn" style={{ marginTop: 6 }} disabled={!n} onClick={async () => { if (!confirm(`¿Vender ${n} ${unidad === "kilo" ? "kilo(s)" : "bolsita(s)"} por ${$(est)}? La cotización puede cambiar en cualquier momento.`)) return; const j = await call({ accion: "vender", name: s.name, at: s.at, unidad, cant, pago }); if (j) { alert(j.msg); location.reload(); } }}>Vender a la plataforma</button></div>);
}
// Dark Web → Mercado negro: semillas y venta de sustancias a la plataforma.
export default function Cultivo({ metodos, hoy, bolsas, factor, mood }) {
  return (<div className="card"><b style={{ display: "flex", gap: 6, alignItems: "center" }}><Leaf size={18} />Semillas y sustancias</b>
    <p className="mut">Compra semillas, siémbralas en el patio de tu casa ({duracionCultivo()} reales), cosecha 150 bolsitas por planta y véndelas aquí. Solo puedes llevarlas encima, guardarlas en casa o venderlas en esta página: la policía puede quitarte lo que lleves encima y revisar tu casa con una orden judicial. Guarda evidencias (fotos o video) del rol de la plantación. Máximo {LIM_DIA} semillas de cada tipo cada 24 horas.</p>
    <div className="card" style={{ margin: "8px 0" }}>Cotización de las sustancias: <b style={{ color: factor >= 1 ? "var(--ok)" : "var(--bad)" }}>x{factor}</b> <span className="mut">· {mood}. Bolsita base {$(TRAF.bolsa)} · kilo base {$(TRAF.kilo)}. Es la misma cotización de los autos y cambia cada 2 horas: puede pagarte menos o más, tú decides cuándo vender.</span></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>{Object.entries(PLANTAS).map(([k, p]) => (<div key={k} className="card" style={{ margin: 0 }}><div className="mi"><img src={p.img} alt="" /></div><b>{p.semilla}</b><div className="big" style={{ fontSize: 22, color: "var(--ac)" }}>{$(p.precio)}</div><div className="mut">Hoy: {hoy[k] || 0}/{LIM_DIA} · Rinde 150 bolsitas</div>
      <Comprar url="/api/cultivo" body={{ accion: "comprar", tipo: k }} metodos={metodos} msg="Semilla comprada. Está en tu inventario." disabled={(hoy[k] || 0) >= LIM_DIA} off="Límite diario alcanzado" /></div>))}</div>
    <h3 style={{ marginTop: 14 }}>Lo que llevas encima</h3>{bolsas.map((s) => <Stack key={s.name + s.at} s={s} factor={factor} metodos={metodos} />)}{!bolsas.length && <p className="mut">No llevas bolsitas encima. Cosecha tus plantas y sácalas del inventario de la casa (lo que está en casa no se puede vender).</p>}</div>);
}
