"use client";
export default function Plan({ planes }) {
  async function go(m) { const r = await fetch("/api/plan", { method: "POST", body: JSON.stringify({ monto: m }) }), j = await r.json().catch(() => ({})); if (r.ok) location.reload(); else alert(j.error || "Error"); }
  return (<div className="card" style={{ maxWidth: 420, margin: "0 auto" }}><h3 style={{ margin: 0 }}>Elige tu plan</h3><p className="mut">Se cobra cada semana automáticamente de tu banco. Si no tienes saldo, se cobra en cuanto tengas o deposites.</p>
    {planes.map((m, i) => <button key={m} className="btn g" style={{ width: "100%", marginTop: 8, justifyContent: "space-between" }} onClick={() => go(m)}><span>{["Básico", "Plus", "Premium"][i] || "Plan"}</span><b>${m} / semana</b></button>)}</div>);
}
