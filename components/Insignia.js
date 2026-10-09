// Insignias de la Policía Nacional Bolivariana según la imagen de rangos: estrellas blancas (Oficial), estrellas en aro dorado (Inspector),
// estrella dorada con laureles (Comisario) y estrella dorada con laureles sobre fondo vino (Comisario General, Mayor y Superior).
export const INSIGNIA_PNB = {
  "Oficial": ["e", 1], "Primer Oficial": ["e", 2], "Oficial Jefe": ["e", 3],
  "Inspector": ["a", 1], "Primer Inspector": ["a", 2], "Inspector Jefe": ["a", 3],
  "Comisario": ["l", 1], "Primer Comisario": ["l", 2], "Comisario Jefe": ["l", 3],
  "Comisario General": ["g", 1], "Comisario Mayor": ["g", 2], "Comisario Superior": ["g", 3],
};
const star = (R, r) => Array.from({ length: 16 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 8, k = i % 2 ? r : R; return `${(16 + k * Math.cos(a)).toFixed(1)},${(16 + k * Math.sin(a)).toFixed(1)}`; }).join(" ");
function Uno({ t, size }) {
  const dorada = t === "l" || t === "g";
  return (<svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    {t === "g" && <circle cx="16" cy="16" r="14.5" fill="#7a1730" />}
    {t === "a" && <circle cx="16" cy="16" r="14" fill="#0d1a45" stroke="#d4af37" strokeWidth="1.8" />}
    {(t === "l" || t === "g") && <circle cx="16" cy="16" r="14" fill="none" stroke="#d4af37" strokeWidth="2.6" strokeDasharray="3.2 1.6" />}
    <polygon points={star(dorada ? 9 : t === "a" ? 9.5 : 14, dorada ? 3.6 : t === "a" ? 3.8 : 5)} fill={dorada ? "#f2c230" : "#f4f6ff"} stroke={dorada ? "#a67c00" : "#9aa6c8"} strokeWidth="0.8" />
  </svg>);
}
export default function Insignia({ rango, depto, size = 24 }) {
  if (depto && depto !== "Policía Nacional Bolivariana") return null;
  const m = INSIGNIA_PNB[rango]; if (!m) return null;
  return <span title={rango} style={{ display: "inline-flex", gap: 2, verticalAlign: "middle", marginRight: 6 }}>{Array.from({ length: m[1] }, (_, i) => <Uno key={i} t={m[0]} size={size} />)}</span>;
}
