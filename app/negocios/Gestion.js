"use client";
import { useState } from "react";
import Comprar from "../mercado/PagoModal";
// Panel del dueño: edita precios (e impuestos en el concesionario) y los planes de la tienda de móvil.
// parte="lado": solo las tarjetas pequeñas (ITBMS) para ponerlas debajo de la foto del negocio. parte="resto": todo lo demás. Sin parte: todo junto.
export default function Gestion({ k, items, planes, paga = true, estado = "normal", multaOk = false, comida = false, aviso = null, parte = "todo", metodos = [], multa = 0, tasa = null }) {
  const [q, setQ] = useState("");
  const post = async (b) => { const r = await fetch("/api/negocios", { method: "POST", body: JSON.stringify({ key: k, ...b }) }), j = await r.json().catch(() => ({})); alert(r.ok ? "Guardado" : j.error || "Error"); if (r.ok) location.reload(); };
  const cl = estado === "clausurado", mo = estado === "moroso", v = (e) => { e.preventDefault(); return Object.fromEntries(new FormData(e.target)); };
  const lado = parte !== "resto", resto = parte !== "lado", conImp = k !== "taller" && !comida;
  const lista = items.filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase()));
  const CH = { margin: 0, padding: "9px 12px" };
  const tarjetaTasa = !conImp ? null : aviso
    ? <div className="card" style={{ ...CH, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderColor: aviso.sube ? "var(--bad)" : "var(--ok)" }}><span style={{ fontWeight: 800, color: aviso.sube ? "var(--bad)" : "var(--ok)" }}>{aviso.sube ? "▲" : "▼"} ITBMS {aviso.a}%</span><span className="mut" style={{ fontSize: 12, textAlign: "right" }}>{aviso.sube ? "Subió" : "Bajó"} el Ministro · antes {aviso.de}% · {new Date(aviso.at).toLocaleDateString("es")}</span></div>
    : tasa != null ? <div className="card" style={{ ...CH, display: "flex", justifyContent: "space-between" }}><b>ITBMS actual</b><b>{tasa}%</b></div> : null;
  const tarjetaPago = conImp && !cl ? <div className="card" style={CH}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span>ITBMS: <b style={{ color: paga ? "var(--ok)" : "var(--bad)" }}>{paga ? "pagas el impuesto" : "NO lo pagas"}</b></span>
    <button className="btn g" style={{ padding: "5px 12px", fontSize: 13 }} disabled={mo && !paga} onClick={() => post({ accion: "impuesto", paga: !paga })}>{paga ? "Dejar de pagar" : mo ? "Solo la Policía te regulariza" : "Volver a pagar"}</button></div>
    <div className="mut" style={{ fontSize: 12, marginTop: 4 }}>Si pagas, va a la Tesorería. Si dejas de pagar, el negocio queda MOROSO.</div></div> : null;
  const Lado = (<>{tarjetaTasa}{tarjetaPago}</>);
  if (parte === "lado") return Lado;
  return (<div className="card" style={{ marginTop: 10 }}><b>Administrar mi negocio</b>
    {parte === "todo" && <div style={{ display: "grid", gap: 8, margin: "8px 0" }}>{Lado}</div>}
    {mo && <div className="card" style={{ margin: "8px 0", borderColor: "var(--bad)" }}><b style={{ color: "var(--bad)" }}>NEGOCIO MOROSO</b><div className="mut">Dejaste de pagar impuestos. Para regularizarte ve a la Policía: te pondrán una multa que pagas en Inventario → Multas. Después el Ministro del Interior decide si queda limpio (pago normal) o lo clausura.</div></div>}
    {cl && <div className="card" style={{ margin: "8px 0", borderColor: "var(--bad)" }}><b style={{ color: "var(--bad)" }}>NEGOCIO CLAUSURADO</b><div className="mut">El Ministro del Interior clausuró tu negocio: no puede vender. {multa > 0 ? `Para reabrirlo paga la multa de $${multa.toLocaleString("es")}: se descuenta de tu efectivo o tarjeta y el negocio abre al instante.` : "Ve a la Policía y paga la multa de reapertura (Inventario → Multas) para reabrirlo, o déjalo."}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "flex-start" }}>
        {multa > 0 ? <div style={{ minWidth: 220 }}><Comprar url="/api/negocios" body={{ accion: "pagarClausura", key: k }} metodos={metodos} label={`Pagar multa $${multa.toLocaleString("es")} y reabrir`} total={multa} totalLabel="Multa de reapertura" msg="Multa pagada: tu negocio volvió a abrir" /></div>
          : <button className="btn" disabled={!multaOk} onClick={() => post({ accion: "reabrir" })}>{multaOk ? "Reabrir negocio" : "Reabrir (falta pagar la multa)"}</button>}
        <button className="btn g" style={{ marginTop: multa > 0 ? 8 : 0 }} onClick={() => confirm("¿Dejar el negocio? Dejas de ser el dueño y queda a la venta.") && post({ accion: "abandonar" })}>Dejar el negocio</button></div></div>}
    {comida && !cl && <p className="mut">Las comidas y bebidas no llevan impuestos. El precio máximo de cada una es $500.</p>}
    {k === "movil" && <form onSubmit={(e) => { const f = v(e); post({ accion: "planes", planes: [f.a, f.b, f.c] }); }} style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}><span className="mut">Planes semanales ($):</span>{["a", "b", "c"].map((n, i) => <input key={n} name={n} type="number" defaultValue={planes[i]} style={{ width: 80 }} />)}<button className="btn">Guardar planes</button></form>}
    {cl ? null : k === "taller" ? <p className="mut">Tu taller se gestiona desde la Dark Web: negocia ofertas de autos robados y revende.</p> : <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar entre ${items.length} artículos...`} style={{ flex: 1, padding: "6px 10px", fontSize: 13 }} /><span className="mut" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{lista.length} / {items.length}</span></div>
      <div style={{ maxHeight: 340, overflowY: "auto", border: "1px solid var(--bd)", borderRadius: 10, marginTop: 8 }}>
        {lista.map((i) => <form key={i.id} onSubmit={(e) => { const f = v(e); post({ accion: "editar", id: i.id, price: f.price, impuesto: f.impuesto }); }} style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 8px", borderTop: "1px solid var(--bd)", fontSize: 13 }}>
          <span title={i.name} style={{ flex: 1, minWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</span>
          <input name="price" type="number" min="0" max={comida ? 500 : undefined} defaultValue={i.price} title="Precio" style={{ width: 84, padding: "3px 6px", fontSize: 13, height: 28 }} />
          {k === "concesionario" && <input name="impuesto" type="number" min="0" defaultValue={i.impuesto} placeholder="Imp." title="Impuesto mensual" style={{ width: 70, padding: "3px 6px", fontSize: 13, height: 28 }} />}
          <button className="btn g" style={{ padding: "3px 10px", fontSize: 12, boxShadow: "none" }}>OK</button></form>)}
        {!lista.length && <p className="mut" style={{ padding: 10, margin: 0 }}>Sin resultados</p>}</div></div>}
    {!cl && !mo && <div style={{ marginTop: 10, borderTop: "1px solid var(--bd)", paddingTop: 8 }}><button className="btn g" onClick={() => confirm("¿Devolver el negocio al sistema? Te reembolsan el precio con el que lo compraste, el sistema lo pone a la venta y no podrás volver a comprarlo durante 15 días.") && post({ accion: "devolver" })}>Devolver negocio al sistema</button><div className="mut" style={{ fontSize: 12 }}>Te devuelven el precio inicial de compra. No podrás recomprarlo durante 15 días.</div></div>}</div>);
}
