"use client";
import { useState, useEffect, useMemo } from "react";
import { ARTS, SECCIONES, BLOQUES, buscar, refDe, resumen } from "@/lib/normativa";
const BLQ = Object.keys(BLOQUES);
function Articulo({ a, abierto, marca }) {
  const [o, setO] = useState(abierto);
  useEffect(() => { setO(abierto); if (abierto) setTimeout(() => document.getElementById(a.id)?.scrollIntoView({ block: "center", behavior: "smooth" }), 150); }, [abierto]);
  return (<details id={a.id} open={o} onToggle={(e) => setO(e.currentTarget.open)} className="card" style={{ padding: 12, marginBottom: 8, ...(marca ? { borderColor: "var(--ac)", boxShadow: "0 0 0 2px var(--glow)" } : {}) }}>
    <summary style={{ cursor: "pointer", fontWeight: 700 }}>{a.sec === "fin" ? "" : a.num === "Anexo" ? "Anexo · " : `Art. ${a.num}. `}{a.titulo}{a.tag && <span className="mut" style={{ fontWeight: 400, marginLeft: 8, fontSize: 12, border: "1px solid var(--bd)", borderRadius: 99, padding: "1px 8px" }}>{a.tag}</span>}</summary>
    <div style={{ marginTop: 10, lineHeight: 1.5 }}>
      {a.intro.map((x, i) => <p key={i} style={{ margin: "6px 0" }}>{x}</p>)}
      {a.subs.map((s, i) => (<div key={i}><h4 style={{ margin: "14px 0 4px" }}>{s.n} {s.t}</h4>{s.l.length > 0 && <ul style={{ margin: 0, paddingLeft: 20 }}>{s.l.map((x, j) => <li key={j} style={{ margin: "3px 0" }}>{x}</li>)}</ul>}</div>))}
    </div></details>);
}
export default function Normativa() {
  const [q, setQ] = useState(""), [sec, setSec] = useState("gen"), [blq, setBlq] = useState("A"), [ab, setAb] = useState("");
  useEffect(() => { try { const id = new URLSearchParams(location.search).get("a"); const a = ARTS.find((x) => x.id === id); if (a) { setSec(a.sec); if (a.bloque) setBlq(a.bloque); setAb(id); } } catch {} }, []);
  const res = useMemo(() => (q.trim().length > 1 ? buscar(q, 12) : []), [q]);
  const lista = ARTS.filter((a) => a.sec === sec && (sec !== "dep" || a.bloque === blq));
  let capAnt = null;
  return (<div>
    <h2>Normativa de VE:RP</h2>
    <p className="mut">Normativa oficial de Venezuela Community, copiada tal cual. Si hay alguna diferencia con la del Discord o la web oficial, manda la oficial. Li'l Monkey también puede decirte en qué artículo está algo.</p>
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por tema o abreviatura: PG, RDM, respawn, taser, robo a banco, +18…" />
    {q.trim().length > 1 ? (<div>{!res.length && <p className="mut">No encontré nada. Prueba con otras palabras.</p>}
      {res.map((r) => (<div key={r.a.id} className="card" style={{ padding: 12, marginBottom: 8, cursor: "pointer" }} onClick={() => { setQ(""); setSec(r.a.sec); if (r.a.bloque) setBlq(r.a.bloque); setAb(r.a.id); history.replaceState(null, "", "?a=" + r.a.id); }}>
        <b>{r.ref}</b> · {r.a.titulo}{r.sub && <span className="mut"> · {r.sub}</span>}<br /><small className="mut">{resumen(r.a, 200)}</small></div>))}</div>) : (<>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>{SECCIONES.map((s) => <button key={s.id} className={"btn " + (sec === s.id ? "" : "g")} onClick={() => { setSec(s.id); setAb(""); }} title={s.d}>{s.n}</button>)}</div>
      {sec === "dep" && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 10px" }}>{BLQ.map((b) => <button key={b} className={"btn " + (blq === b ? "" : "g")} onClick={() => { setBlq(b); setAb(""); }}>Bloque {b}: {BLOQUES[b]}</button>)}</div>}
      {lista.map((a) => { const t = a.cap !== capAnt ? a.cap : null; capAnt = a.cap; return (<div key={a.id}>{t && <h3 style={{ margin: "16px 0 8px" }}>{t}</h3>}<Articulo a={a} abierto={ab === a.id || a.sec === "fin"} marca={ab === a.id} /></div>); })}
    </>)}
  </div>);
}
