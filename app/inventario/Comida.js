"use client";
import { useEffect, useState } from "react";
import { UtensilsCrossed, GlassWater, Refrigerator, Trash2, Snowflake } from "lucide-react";
import { durac } from "@/lib/comida";
async function act(accion, fid) {
  const r = await fetch("/api/comida", { method: "POST", body: JSON.stringify({ accion, fid }) }), j = await r.json().catch(() => ({}));
  alert(j.msg || j.error || "Listo"); if (r.ok) location.reload();
}
function Vence({ c, ahora }) {
  if (!ahora) return null; const ms = +new Date(c) - ahora;
  return ms <= 0 ? <div style={{ color: "var(--bad)", fontWeight: 700 }}>VENCIDO (si lo consumes te puedes enfermar)</div> : <div className="mut" style={{ color: ms < 36e5 * 3 ? "#ff9f1a" : undefined }}>Vence en {durac(ms)}</div>;
}
const Foto = ({ i }) => <div className="mi">{i.img ? <img src={i.img} alt="" /> : <span className="mut">Sin foto</span>}</div>;
export default function Comida({ items, nevera }) {
  const [ahora, setAhora] = useState(0), [ver, setVer] = useState(false); useEffect(() => setAhora(Date.now()), []);
  const lleno = nevera ? nevera.items.length >= nevera.cap : false;
  return (<div>
    <div className="card" style={{ marginBottom: 12 }}>{nevera ? (<><div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>{nevera.img && <img src={nevera.img} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 12 }} />}<div style={{ flex: 1 }}><b><Refrigerator size={16} /> {nevera.name}</b><div className="mut">Espacio: {nevera.items.length} / {nevera.cap} · dentro la comida dura 4 veces más</div></div><button className="btn g" onClick={() => setVer(!ver)}><Snowflake size={16} />{ver ? "Ocultar nevera" : "Ver nevera"}</button></div>
      {ver && <div className="grid" style={{ marginTop: 10 }}>{nevera.items.map((i) => <div className="card" key={i.fid} style={{ marginBottom: 0 }}><Foto i={i} /><b>{i.name}</b><Vence c={i.caduca} ahora={ahora} /><button className="btn g" style={{ width: "100%", marginTop: 6 }} onClick={() => act("sacar", i.fid)}>Sacar de la nevera</button><button className="btn g" style={{ width: "100%", marginTop: 6 }} onClick={() => confirm("¿Botar " + i.name + "?") && act("botar", i.fid)}><Trash2 size={14} />Botar</button></div>)}{!nevera.items.length && <p className="mut">La nevera está vacía.</p>}</div>}</>) : <><b><Refrigerator size={16} /> Sin nevera</b><div className="mut">Compra una en Mercado → Hogar (necesitas una casa) para que la comida dure más.</div></>}</div>
    <h3>Comida y bebida que llevas</h3>
    {items.length ? <div className="grid">{items.map((i) => <div className="card" key={i.fid}><Foto i={i} /><span className="tag">{i.tipo === "bebida" ? "Bebida" : "Comida"}</span><div><b>{i.name}</b></div><div className="mut">Sube {i.sube}% de {i.tipo === "bebida" ? "sed" : "hambre"}</div><Vence c={i.caduca} ahora={ahora} />
      <button className="btn" style={{ width: "100%", marginTop: 8 }} onClick={() => act("comer", i.fid)}>{i.tipo === "bebida" ? <GlassWater size={16} /> : <UtensilsCrossed size={16} />}{i.tipo === "bebida" ? "Beber" : "Comer"}</button>
      {nevera && <button className="btn g" style={{ width: "100%", marginTop: 6 }} onClick={() => (lleno ? alert("No hay espacio en tu nevera") : act("guardar", i.fid))}><Snowflake size={16} />Guardar en la nevera</button>}
      <button className="btn g" style={{ width: "100%", marginTop: 6 }} onClick={() => confirm("¿Botar " + i.name + "?") && act("botar", i.fid)}><Trash2 size={14} />Botar</button></div>)}</div> : <div className="card mut">No llevas comida ni bebida. Visita el Mercado.</div>}</div>);
}
