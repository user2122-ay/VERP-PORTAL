// Panel financiero de un negocio: cuánto ha ganado (verde), cuánto ha perdido (rojo) y los demás datos de la empresa.
const $ = (n) => `$${Math.abs(Number(n) || 0).toLocaleString("es")}`;
const Fila = ({ t, v, c, sub }) => <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "7px 0", borderTop: "1px solid var(--bd)" }}><span>{t}{sub && <div className="mut" style={{ fontSize: 12 }}>{sub}</div>}</span><b style={{ color: c, whiteSpace: "nowrap" }}>{v}</b></div>;
export default function Finanzas({ f, recientes = [], nombre }) {
  const tot = f.ganado + f.perdido || 1, pg = Math.round((f.ganado / tot) * 100), pos = f.neto >= 0;
  return (<div className="card" style={{ margin: 0 }}>
    <b>Finanzas de la empresa</b><div className="mut" style={{ fontSize: 13 }}>{nombre}</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "12px 0" }}>
      <div style={{ background: "color-mix(in srgb,var(--ok) 12%,transparent)", border: "1px solid var(--ok)", borderRadius: 12, padding: 10 }}><div className="mut">Ganado</div><div style={{ fontSize: 24, fontWeight: 800, color: "var(--ok)" }}>+{$(f.ganado)}</div></div>
      <div style={{ background: "color-mix(in srgb,var(--bad) 12%,transparent)", border: "1px solid var(--bad)", borderRadius: 12, padding: 10 }}><div className="mut">Perdido / invertido</div><div style={{ fontSize: 24, fontWeight: 800, color: "var(--bad)" }}>-{$(f.perdido)}</div></div></div>
    <div style={{ height: 10, borderRadius: 99, overflow: "hidden", background: "var(--bad)" }}><div style={{ width: `${pg}%`, height: "100%", background: "var(--ok)" }} /></div>
    <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0 2px" }}><span>Balance neto</span><b style={{ fontSize: 22, color: pos ? "var(--ok)" : "var(--bad)" }}>{pos ? "+" : "-"}{$(f.neto)}</b></div>
    <div className="mut" style={{ fontSize: 12 }}>{pos ? "La empresa ya recuperó su inversión." : "Aún no recuperas la inversión del negocio."}</div>
    <div style={{ marginTop: 8 }}>
      <Fila t="Ventas realizadas" v={f.ventas.toLocaleString("es")} />
      <Fila t="Inversión inicial" v={`-${$(f.inversion)}`} c="var(--bad)" sub="Precio de compra del negocio" />
      <Fila t="ITBMS remitido a Tesorería" v={$(f.impuestoPagado)} />
      <Fila t="ITBMS evadido" v={`-${$(f.evadido)}`} c={f.evadido ? "var(--bad)" : undefined} sub="Dinero que te quedaste sin pagar (riesgo de investigación)" />
    </div>
    <b style={{ display: "block", marginTop: 10 }}>Últimas ventas</b>
    {recientes.length ? recientes.map((r, k) => <Fila key={k} t={r.item} sub={new Date(r.at).toLocaleString("es")} v={`+${$(r.amount)}`} c="var(--ok)" />) : <p className="mut" style={{ margin: "6px 0 0" }}>Todavía no hay ventas registradas.</p>}
  </div>);
}
