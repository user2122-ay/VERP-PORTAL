import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
// Coordenadas en píxeles sobre la plantilla de 538x371. Si algo queda movido, solo cambia estos números.
const W = 538, H = 371;
const fmt = (d) => { const x = new Date(d); return `${String(x.getUTCDate()).padStart(2, "0")}/${String(x.getUTCMonth() + 1).padStart(2, "0")}/${x.getUTCFullYear()}`; };
const T = ({ x, y, c, children, size = 3, center, w }) => (<div style={{ position: "absolute", left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, transform: center ? "translate(-50%,-50%)" : "translateY(-50%)", fontSize: `${size}cqw`, fontWeight: 700, color: c || "#111", whiteSpace: "nowrap", fontFamily: "Arial, sans-serif", width: w ? `${(w / W) * 100}%` : undefined }}>{children}</div>);
export default async function P() {
  const u = await needUser(), c = u.cedula;
  return (<Shell user={u}><h2>Mi cédula</h2>
    <div style={{ containerType: "inline-size", maxWidth: 560, position: "relative", borderRadius: 14, overflow: "hidden", boxShadow: "0 0 30px var(--glow)" }}>
      <img src="/cedula-plantilla.jpg" alt="Cédula de identidad" style={{ width: "100%", display: "block" }} />
      <T x={226} y={79} size={3.6}>{c.num.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</T>
      <T x={72} y={122}>{c.apellidos}</T>
      <T x={68} y={149}>{c.nombres}</T>
      <T x={10} y={228} size={4} c="#1a2a6c"><i style={{ fontFamily: "'Brush Script MT', cursive", fontWeight: 400 }}>{c.nombres.split(" ")[0]} {c.apellidos.split(" ")[0]}</i></T>
      <T x={170} y={267} center size={2.8}>{fmt(c.nac)}</T>
      <T x={275} y={267} center size={2.8}>{c.edoCivil}</T>
      <T x={172} y={326} center size={2.8}>{fmt(c.emision)}</T>
      <T x={273} y={326} center size={2.8}>{fmt(c.vence)}</T>
      <div style={{ position: "absolute", left: `${(366 / W) * 100}%`, top: `${(166 / H) * 100}%`, width: `${(152 / W) * 100}%`, aspectRatio: "1", background: "#fff", overflow: "hidden" }}>
        {c.avatar && <img src={c.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>
      <T x={442} y={340} center size={2.4} c="#444">{c.lugar} · {c.roblox}</T>
    </div></Shell>);
}
