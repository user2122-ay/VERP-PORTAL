"use client";
import { useState } from "react";
import Casino from "./Casino";
import Dados from "./Dados";
export default function Juegos(p) {
  const [t, setT] = useState("slot");
  return (<div><div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>{[["slot", "🎰 Tragamonedas"], ["dados", "🎲 Dados 1 vs 1"]].map(([k, n]) => <button key={k} className={"btn " + (t === k ? "" : "g")} onClick={() => setT(k)}>{n}</button>)}</div>
    {t === "slot" ? <Casino {...p} /> : <Dados metodos={p.metodos} imp={p.imp} />}</div>);
}
