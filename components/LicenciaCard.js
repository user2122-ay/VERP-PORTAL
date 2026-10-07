// Licencia personalizada con los datos del ciudadano (foto, nombre, cédula) y un número propio.
const TIPOS = {
  conducir: { t: "LICENCIA DE CONDUCIR", sub: "VEHÍCULOS", bg: "linear-gradient(135deg,#0b2a66,#14407f 55%,#1d6fd1)", ac: "#f5c518" },
  armas: { t: "LICENCIA DE ARMAS", sub: "PORTE AUTORIZADO", bg: "linear-gradient(135deg,#161616,#3a0f12 60%,#7a1520)", ac: "#ff7b7b" },
  embarcaciones: { t: "LICENCIA DE EMBARCACIONES", sub: "NÁUTICA", bg: "linear-gradient(135deg,#06323a,#0a5a66 60%,#139aa8)", ac: "#7be0ea" },
};
const X = ({ l, t, s, c = "#fff", fw = 700, ls, mono, children }) => <div className="t" style={{ left: l, top: t, fontSize: `${s}cqw`, color: c, fontWeight: fw, letterSpacing: ls, fontFamily: mono ? "ui-monospace,Consolas,monospace" : undefined }}>{children}</div>;
const fmt = (d) => { const x = new Date(d); return `${String(x.getUTCDate()).padStart(2, "0")}/${String(x.getUTCMonth() + 1).padStart(2, "0")}/${x.getUTCFullYear()}`; };
export default function LicenciaCard({ tipo, c, num, emision }) {
  const T = TIPOS[tipo] || TIPOS.conducir;
  return (<div className="bk" style={{ background: T.bg, color: "#fff" }}>
    <X l="5%" t="6%" s={2.6} c="#ffffffb0" ls=".16em" fw={600}>VENEZUELA COMMUNITY ROLEPLAY</X>
    <X l="5%" t="14%" s={tipo === "embarcaciones" ? 4.6 : 5.6} c={T.ac}>{T.t}</X>
    <div className="t" style={{ left: "5%", top: "33%", width: "24%", aspectRatio: "1", background: "#fff", overflow: "hidden", borderRadius: "4%" }}>{c?.avatar && <img src={c.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>
    <X l="33%" t="32%" s={2.3} c="#ffffffa0" fw={600}>APELLIDOS</X><X l="33%" t="38%" s={4}>{c?.apellidos}</X>
    <X l="33%" t="51%" s={2.3} c="#ffffffa0" fw={600}>NOMBRES</X><X l="33%" t="57%" s={4}>{c?.nombres}</X>
    <X l="33%" t="70%" s={2.3} c="#ffffffa0" fw={600}>CÉDULA</X><X l="33%" t="75.5%" s={3.4} mono>V-{String(c?.num || 0).padStart(8, "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</X>
    <X l="5%" t="84%" s={5} ls=".08em" mono c={T.ac}>{num || "—"}</X><X l="5%" t="93%" s={2.4} c="#ffffffa0" fw={600}>EMITIDA {emision ? fmt(emision) : "—"} · {T.sub}</X>
    <img src="/ve-logo.png" alt="" className="t" style={{ right: "5%", bottom: "6%", width: "20%" }} /></div>);
}
