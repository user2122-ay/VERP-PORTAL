import { CardSecret } from "./Transfer";
const P_ = ({ l, t, w, h, bg }) => <i style={{ left: l, top: t, width: w, height: h, background: bg }} />;
const X = ({ l, t, s, c = "#fff", fw = 700, ls, st, children }) => <div className="t" style={{ left: l, top: t, fontSize: `${s}cqw`, color: c, fontWeight: fw, letterSpacing: ls, fontStyle: st }}>{children}</div>;
// Solo se muestran los 4 primeros dígitos (el prefijo del banco); el resto son puntos y no existen, así la tarjeta no sirve fuera del servidor.
const grp = (n) => `${String(n).slice(0, 4)} •••• •••• ••••`;
const nombre = (c) => `${c.nombres.split(" ")[0]} ${c.apellidos.split(" ")[0]}`;
export function BvcCard({ c, cuenta, promo }) {
  return (<div className="bk"><div className="bkt" />
    <P_ l="62%" t="-6%" w="16%" h="44%" bg="#f5c518" /><P_ l="76%" t="14%" w="14%" h="32%" bg="#1e4fd8" /><P_ l="70%" t="42%" w="12%" h="24%" bg="#14a38b" /><P_ l="82%" t="44%" w="8%" h="14%" bg="#d7263d" />
    <img src="/ve-logo.png" alt="" className="t" style={{ left: "5%", top: "8%", height: "14%" }} />
    <X l="19%" t="9%" s={8.5}>BVC</X><X l="19%" t="22%" s={3} fw={400}>Banco de Venezuela Community</X><X l="5%" t="34%" s={5}>USD</X>
    <X l="5%" t="52%" s={5.8} c="#0a1f3a" ls=".04em">{promo ? "7700 •••• •••• ••••" : grp(cuenta.num)}</X>
    <CardSecret b="bvc" promo={promo} />
    <X l="5%" t="80%" s={2.6} c="#4b5b70" fw={600}>TITULAR</X><X l="5%" t="86%" s={3.6} c="#0a1f3a">{promo ? "TU NOMBRE" : nombre(c)}</X>
    <img src="/ve-logo.png" alt="" className="t" style={{ right: "6%", bottom: "7%", width: "22%" }} /></div>);
}
// Tarjeta "Mercantil VERP": diseño propio (azul, franja gris curva y trazo naranja), con el logo VE y el logo VERP.
export function MerCard({ c, cuenta, promo }) {
  return (<div className="bk mc">
    <svg viewBox="0 0 100 63" preserveAspectRatio="none"><path d="M0 0H86C70 22 34 34 0 24Z" fill="#d9dce1" /><path d="M0 24C34 34 70 22 86 0L90 0C75 28 36 42 0 31Z" fill="#f5a31a" /></svg>
    <X l="8%" t="9%" s={7.5} c="#0a4a9f"><span style={{ fontStyle: "italic" }}>Mercantil VERP</span></X>
    <img src="/ve-logo.png" alt="" className="t" style={{ left: "71%", top: "6%", height: "15%" }} />
    <div className="t" style={{ left: "8%", top: "40%", width: "13%", height: "16%", borderRadius: "12%", background: "linear-gradient(135deg,#f1d27a,#b8860b)" }} />
    <X l="8%" t="60%" s={5.2} ls=".06em">{promo ? "7800 •••• •••• ••••" : grp(cuenta.num)}</X>
    <CardSecret b="mer" mer promo={promo} />
    <X l="8%" t="88%" s={3.4} c="#fff" fw={600}>{promo ? "TU NOMBRE" : nombre(c).toUpperCase()}</X>
    <div className="t" style={{ left: "73%", top: "74%", width: "21%", height: "18%", background: "#fff", borderRadius: "8%", display: "flex", alignItems: "center", justifyContent: "center" }}><img src="/verp-logo.png" alt="VERP" style={{ width: "88%", height: "88%", objectFit: "contain" }} /></div></div>);
}
// Tarjeta de comerciante: recibe lo que se vende en tus negocios.
export function ComCard({ c, cuenta, promo }) {
  return (<div className="bk" style={{ background: "linear-gradient(135deg,#1c1c1c,#3a2f10 60%,#b8860b)" }}>
    <img src="/ve-logo.png" alt="" className="t" style={{ left: "6%", top: "8%", height: "15%" }} />
    <X l="22%" t="9%" s={6.5} c="#f1d27a">COMERCIANTE</X><X l="22%" t="22%" s={3} c="#e8dcb0" fw={400}>VERP · Tarjeta de negocios</X>
    <div className="t" style={{ left: "8%", top: "40%", width: "13%", height: "16%", borderRadius: "12%", background: "linear-gradient(135deg,#f1d27a,#b8860b)" }} />
    <X l="8%" t="60%" s={5.2} c="#f1d27a" ls=".06em">{promo ? "7900 •••• •••• ••••" : grp(cuenta.num)}</X>
    <CardSecret b="com" mer promo={promo} />
    <X l="8%" t="88%" s={3.4} c="#f1d27a" fw={600}>{promo ? "TU NOMBRE" : nombre(c).toUpperCase()}</X></div>);
}

// VE:RP Provincial: tarjeta internacional prepagada (azul, brillo diagonal, logo VE y logo VERP en lugar del de la red de pagos).
export function ProCard({ c, cuenta, promo }) {
  return (<div className="bk" style={{ background: "linear-gradient(135deg,#0d5aa7,#0a3d78 60%,#083060)" }}>
    <div className="t" style={{ left: 0, top: 0, width: "100%", height: "100%", background: "linear-gradient(115deg,transparent 38%,#ffffff26 48%,transparent 62%)" }} />
    <img src="/ve-logo.png" alt="" className="t" style={{ left: "6%", top: "8%", height: "15%" }} /><X l="25%" t="8%" s={7.5} fw={400}>Provincial</X>
    <div className="t" style={{ left: "8%", top: "34%", width: "13%", height: "16%", borderRadius: "12%", background: "linear-gradient(135deg,#eef0f3,#9aa3af)" }} />
    <X l="26%" t="33%" s={4.4} fw={400}>Internacional</X><X l="26%" t="43%" s={3} c="#cfe0f7" fw={400}>Prepagada</X>
    <X l="8%" t="58%" s={5.2} ls=".06em">{promo ? "7600 •••• •••• ••••" : grp(cuenta.num)}</X>
    <CardSecret b="pro" mer promo={promo} />
    <X l="8%" t="88%" s={3.4} c="#fff" fw={600}>{promo ? "TU NOMBRE" : nombre(c).toUpperCase()}</X>
    <div className="t" style={{ left: "73%", top: "74%", width: "21%", height: "18%", background: "#fff", borderRadius: "8%", display: "flex", alignItems: "center", justifyContent: "center" }}><img src="/verp-logo.png" alt="VERP" style={{ width: "88%", height: "88%", objectFit: "contain" }} /></div></div>);
}

// VERNESCO: tarjeta de débito verde con puntos rayados, chip dorado, logo VE (azul) arriba y logo VERP abajo.
const PUNTOS = [0, 1, 2].flatMap((f) => [0, 1, 2, 3, 4, 5, 6].map((c) => ({ f, c })));
export function VenCard({ c, cuenta, promo }) {
  return (<div className="bk" style={{ background: "linear-gradient(120deg,#0b5d6b 0%,#1a7f78 38%,#2e8f6f 62%,#0d4f5c 100%)", boxShadow: "0 10px 30px #0007, inset 0 0 0 1px #ffffff22" }}>
    <div className="t" style={{ left: 0, top: 0, width: "100%", height: "100%", background: "linear-gradient(180deg,#ffffff2e 0%,transparent 38%)" }} />
    {PUNTOS.map(({ f, c: k }) => <div key={f + "-" + k} className="t" style={{ left: `${5 + k * 14.2}%`, top: `${29 + f * 23}%`, width: "11cqw", height: "11cqw", borderRadius: "50%", background: "repeating-linear-gradient(0deg,#0a3f52 0 .45cqw,#2a8f9c .45cqw .9cqw)", opacity: 0.38, boxShadow: "0 0 0 .3cqw #ffffff14" }} />)}
    <img src="/ve-logo-full.png" alt="VE" className="t" style={{ left: "5%", top: "6%", height: "17%" }} />
    <X l="22%" t="8%" s={8.4} c="#0b2a5b" fw={800} ls="-.01em">VERNESCO</X><X l="22%" t="22%" s={3} c="#d9f1ee" fw={400}>VERP · Tarjeta de débito</X>
    <div className="t" style={{ left: "6%", top: "33%", width: "13%", height: "16%", borderRadius: "12%", background: "linear-gradient(135deg,#f6dc8a,#b8860b)", boxShadow: "inset 0 0 0 .4cqw #8a6a10aa" }} />
    <X l="8%" t="60%" s={5.2} ls=".06em">{promo ? "7500 •••• •••• ••••" : grp(cuenta.num)}</X>
    <CardSecret b="ven" mer promo={promo} />
    <X l="8%" t="88%" s={3.4} c="#fff" fw={600}>{promo ? "TU NOMBRE" : nombre(c).toUpperCase()}</X>
    <div className="t" style={{ left: "70%", top: "70%", width: "24%", height: "22%", background: "#fff", borderRadius: "8%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px #0006" }}><img src="/verp-logo.png" alt="VERP" style={{ width: "88%", height: "88%", objectFit: "contain" }} /></div></div>);
}
// VERCARIBE Platinum: plata con rayos de luz, logo VE y logo VERP en lugar de las redes de pago.
export function VcaCard({ c, cuenta, promo }) {
  return (<div className="bk" style={{ background: "linear-gradient(135deg,#e9ebee 0%,#c9ccd2 45%,#e4e6ea 100%)", boxShadow: "0 10px 30px #0007, inset 0 0 0 1px #ffffffaa" }}>
    <div className="t" style={{ left: 0, top: 0, width: "100%", height: "100%", background: "conic-gradient(from 200deg at 75% 40%,#ffffff00 0deg,#ffffffcc 12deg,#ffffff00 26deg,#ffffffaa 44deg,#ffffff00 60deg,#ffffffbb 82deg,#ffffff00 100deg,#ffffff99 130deg,#ffffff00 150deg)" }} />
    <img src="/ve-logo-full.png" alt="VE" className="t" style={{ left: "5%", top: "6%", height: "17%" }} />
    <X l="22%" t="7%" s={7.2} c="#111" fw={900} st="italic" ls="-.01em">VERCARIBE</X>
    <X l="22%" t="21%" s={4.4} c="#6b717b" fw={400} st="italic">Platinum</X>
    <div className="t" style={{ left: "6%", top: "33%", width: "13%", height: "16%", borderRadius: "12%", background: "linear-gradient(135deg,#f6dc8a,#b8860b)", boxShadow: "inset 0 0 0 .4cqw #8a6a10aa" }} />
    <X l="8%" t="53%" s={5.6} c="#1c1f24" ls=".06em" fw={600}>{promo ? "7400 •••• •••• ••••" : grp(cuenta.num)}</X>
    <CardSecret b="vca" promo={promo} oscuro />
    <X l="5%" t="80%" s={2.6} c="#5b616b" fw={600}>TITULAR</X><X l="5%" t="86%" s={3.6} c="#111">{promo ? "TU NOMBRE" : nombre(c).toUpperCase()}</X>
    <div className="t" style={{ left: "72%", top: "72%", width: "22%", height: "20%", background: "#fff", borderRadius: "8%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px #0003" }}><img src="/verp-logo.png" alt="VERP" style={{ width: "88%", height: "88%", objectFit: "contain" }} /></div></div>);
}
export const CARD = { bvc: BvcCard, mer: MerCard, pro: ProCard, ven: VenCard, vca: VcaCard, com: ComCard };
