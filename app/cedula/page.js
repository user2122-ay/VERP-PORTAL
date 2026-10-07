import Shell from "@/components/Shell";
import { needUser } from "@/lib/auth";
import Aviso from "@/components/Aviso";
import CedulaCard from "@/components/CedulaCard";
// Coordenadas en píxeles sobre la plantilla de 538x371. Si algo queda movido, solo cambia estos números.
const W = 538, H = 371;
const fmt = (d) => { const x = new Date(d); return `${String(x.getUTCDate()).padStart(2, "0")}/${String(x.getUTCMonth() + 1).padStart(2, "0")}/${x.getUTCFullYear()}`; };
const T = ({ x, y, c, children, size = 3, center, w, ls, fw }) => (<div style={{ position: "absolute", left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, transform: center ? "translate(-50%,-50%)" : "translateY(-50%)", fontSize: `${size}cqw`, fontWeight: fw || 700, color: c || "#111", whiteSpace: "nowrap", fontFamily: "Arial, sans-serif", letterSpacing: ls, width: w ? `${(w / W) * 100}%` : undefined }}>{children}</div>);
export default async function P() {
  const u = await needUser(), c = u.cedula;
  return (<Shell user={u}><div style={{ maxWidth: 560, margin: "0 auto" }}><h2 style={{ textAlign: "center", marginBottom: 12 }}>Mi cédula</h2>
    <CedulaCard c={c} /><Aviso /></div></Shell>);
}
