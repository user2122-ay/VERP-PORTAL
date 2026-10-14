"use client";
import { useState } from "react";
import Casino from "./Casino";
import Dados from "./Dados";
import { Ruleta, Blackjack, Hipodromo } from "./Mesas";
const TABS = [["slot", "🎰 Tragamonedas"], ["ruleta", "🎡 Ruleta"], ["bj", "🃏 Blackjack"], ["hip", "🏇 Hipódromo"], ["dados", "🎲 Dados 1 vs 1"]];
export default function Juegos(p) {
  const [t, setT] = useState("slot"), m = { metodos: p.metodos, imp: p.imp, abierto: p.abierto, max: p.max };
  return (<div><div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>{TABS.map(([k, n]) => <button key={k} className={"btn " + (t === k ? "" : "g")} onClick={() => setT(k)}>{n}</button>)}</div>
    {t === "slot" ? <Casino {...p} /> : t === "ruleta" ? <Ruleta {...m} /> : t === "bj" ? <Blackjack {...m} /> : t === "hip" ? <Hipodromo {...m} /> : <Dados metodos={p.metodos} imp={p.imp} />}</div>);
}
