const B = ({ t, v }) => { const bajo = v < 25; return (<div style={{ margin: "8px 0" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span className="mut">{t}</span><b style={{ color: bajo ? "var(--bad)" : "var(--ok)" }}>{Math.round(v)}%</b></div><div style={{ height: 10, background: "var(--bd)", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${Math.max(2, v)}%`, height: "100%", borderRadius: 99, background: bajo ? "var(--bad)" : "var(--ok)" }} /></div></div>); };
export default function Needs({ h, s }) {
  return (<div className="card"><b>Tu estado</b><B t="Hambre (saciedad)" v={h} /><B t="Sed (hidratación)" v={s} />{(h < 25 || s < 25) && <div className="mut">Estás bajo: compra comida o bebida en el Mercado.</div>}</div>);
}
