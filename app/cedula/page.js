import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import Aviso from "@/components/Aviso";
// Coordenadas en píxeles sobre la plantilla de 538x371. Si algo queda movido, solo cambia estos números.
const W = 538, H = 371;
const fmt = (d) => { const x = new Date(d); return `${String(x.getUTCDate()).padStart(2, "0")}/${String(x.getUTCMonth() + 1).padStart(2, "0")}/${x.getUTCFullYear()}`; };
const T = ({ x, y, c, children, size = 3, center, w, ls, fw }) => (<div style={{ position: "absolute", left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, transform: center ? "translate(-50%,-50%)" : "translateY(-50%)", fontSize: `${size}cqw`, fontWeight: fw || 700, color: c || "#111", whiteSpace: "nowrap", fontFamily: "Arial, sans-serif", letterSpacing: ls, width: w ? `${(w / W) * 100}%` : undefined }}>{children}</div>);
export default async function P() {
  const u = await needUser(), c = u.cedula;
  return (<Shell user={u}><div style={{ maxWidth: 560, margin: "0 auto" }}><h2 style={{ textAlign: "center", marginBottom: 12 }}>Mi cédula</h2>
    <div style={{ containerType: "inline-size", width: "100%", position: "relative", borderRadius: 14, overflow: "hidden", boxShadow: "0 0 30px var(--glow)" }}>
      <img src="/cedula-plantilla.jpg" alt="Cédula de identidad" style={{ width: "100%", display: "block" }} />
      <img src="/cedula-logo.png" alt="" style={{ position: "absolute", left: `${(102.5 / W) * 100}%`, top: `${(95 / H) * 100}%`, width: `${(215 / W) * 100}%`, opacity: 0.28, pointerEvents: "none" }} />
      <T x={8} y={122} size={2.1} c="#3a3a3a" fw={600}>APELLIDOS</T>
      <T x={8} y={149} size={2.1} c="#3a3a3a" fw={600}>NOMBRES</T>
      <T x={8} y={211} size={1.9} c="#3a3a3a" fw={600}>FIRMA TITULAR</T>
      <T x={170} y={250} center size={2.1} c="#3a3a3a" fw={600}>F. NACIMIENTO</T>
      <T x={275} y={250} center size={2.1} c="#3a3a3a" fw={600}>EDO. CIVIL</T>
      <T x={172} y={310} center size={2.1} c="#3a3a3a" fw={600}>F. EXPEDICIÓN</T>
      <T x={273} y={310} center size={2.1} c="#3a3a3a" fw={600}>F. VENCIMIENTO</T>
      <T x={264} y={57} center size={2.9} c="#222" ls="0.45em">CÉDULA DE IDENTIDAD</T>
      <T x={227} y={345} center size={5.6} c="#111">VENEZOLANO</T>
      <T x={464} y={105} center size={2.3}>A. Batista</T>
      <T x={461} y={126} center size={2.1} c="#333" fw={400}>Director</T>
      <T x={269} y={26.5} center size={3.1} c="#fff" ls="0.16em">VENEZUELA COMMUNITY ROLEPLAY</T>
      <T x={471} y={79} center size={3}>12-08-2025</T>
      <T x={205} y={85} size={3.6}>V-{String(c.num).padStart(8, "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</T>
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
    </div><Aviso /></div></Shell>);
}
