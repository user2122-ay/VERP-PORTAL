"use client";
// Panel del dueño: edita precios (e impuestos en el concesionario) y los planes de la tienda de móvil.
export default function Gestion({ k, items, planes, paga = true }) {
  const post = async (b) => { const r = await fetch("/api/negocios", { method: "POST", body: JSON.stringify({ key: k, ...b }) }), j = await r.json().catch(() => ({})); alert(r.ok ? "Guardado" : j.error || "Error"); if (r.ok) location.reload(); };
  const v = (e) => { e.preventDefault(); return Object.fromEntries(new FormData(e.target)); };
  return (<div className="card" style={{ marginTop: 10 }}><b>Administrar mi negocio</b>
    {k !== "taller" && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, margin: "8px 0", flexWrap: "wrap" }}><span>ITBMS 7%: <b style={{ color: paga ? "var(--ok)" : "var(--bad)" }}>{paga ? "pagas el impuesto" : "NO pagas el impuesto"}</b><div className="mut">Cada venta lleva 7%. Si pagas, va a la Tesorería. Si no pagas, te lo quedas tú, pero es evasión y la policía puede investigarte.</div></span>
      <button className="btn g" onClick={() => post({ accion: "impuesto", paga: !paga })}>{paga ? "Dejar de pagar" : "Volver a pagar"}</button></div>}
    {k === "movil" && <form onSubmit={(e) => { const f = v(e); post({ accion: "planes", planes: [f.a, f.b, f.c] }); }} style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}><span className="mut">Planes semanales ($):</span>{["a", "b", "c"].map((n, i) => <input key={n} name={n} type="number" defaultValue={planes[i]} style={{ width: 80 }} />)}<button className="btn">Guardar planes</button></form>}
    {k === "taller" ? <p className="mut">Tu taller se gestiona desde la Dark Web: negocia ofertas de autos robados y revende.</p> : items.map((i) => <form key={i.id} onSubmit={(e) => { const f = v(e); post({ accion: "editar", id: i.id, price: f.price, impuesto: f.impuesto }); }} style={{ display: "flex", gap: 6, alignItems: "center", margin: "6px 0", flexWrap: "wrap" }}>
      <span style={{ flex: 1, minWidth: 140 }}>{i.name}</span><input name="price" type="number" min="0" defaultValue={i.price} style={{ width: 110 }} />{k === "concesionario" && <input name="impuesto" type="number" min="0" defaultValue={i.impuesto} placeholder="Impuesto" style={{ width: 100 }} />}<button className="btn g">Guardar</button></form>)}</div>);
}
