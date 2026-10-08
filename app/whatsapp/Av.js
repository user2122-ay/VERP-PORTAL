// Foto de perfil de WhatsApp: el avatar de Roblox de la cédula de esa persona (fondo blanco). Si no hay, la inicial del nombre.
export default function Av({ src, nombre = "?", size = 40 }) {
  return (<div style={{ width: size, height: size, borderRadius: 99, overflow: "hidden", background: "#fff", flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 700, color: "#555", fontSize: size * 0.45 }}>
    {src ? <img src={src} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : String(nombre)[0]?.toUpperCase()}</div>);
}
