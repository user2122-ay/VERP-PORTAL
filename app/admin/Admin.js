"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Skull, Check } from "lucide-react";
import { canAdmin, RANK_LABEL } from "@/lib/roles";
import { RANGOS_POR_DEPTO, DEPTOS, nombreDepto } from "@/lib/mdt";
import Insignia from "@/components/Insignia";
const CATS = ["Concesionario", "Propiedades", "Licencias", "Objetos", "Armas", "Herramientas", "Telefonía", "Tecnología"], INV = ["Banco", "Telefonía", "Tecnología", "Propiedades", "Concesionario", "Herramientas", "Objetos", "Armas", "Licencias"], CIVIL = ["SOLTERO", "CASADO", "DIVORCIADO", "VIUDO"];
const BK = { bvc: "BVC", mer: "Mercantil VERP", pro: "Provincial", ven: "VERNESCO", vca: "VERCARIBE", com: "Comerciante" }, $ = (n) => `$${Number(n || 0).toLocaleString("es")}`;
const post = async (a, data) => { const r = await fetch("/api/admin", { method: "POST", body: JSON.stringify({ a, ...data }) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return false; } return true; };
const vals = (e) => { e.preventDefault(); return Object.fromEntries(new FormData(e.target, e.nativeEvent?.submitter)); };
const ask = (t) => { const r = prompt(t); if (r === null) return null; if (r.trim().length < 3) { alert("La razón es obligatoria (mínimo 3 letras)"); return null; } return r.trim(); };
const Razon = () => <input name="razon" placeholder="Razón (obligatoria)" required minLength={3} />;
function Usuarios({ items }) {
  const [q, setQ] = useState(""), [res, setRes] = useState(null), [u, setU] = useState(null), [cat, setCat] = useState("Banco");
  const abrir = async (id) => { const r = await fetch("/api/admin?uid=" + encodeURIComponent(id)); if (r.ok) setU((await r.json()).user); };
  const buscar = async (e) => { e.preventDefault(); const r = await fetch("/api/admin?q=" + encodeURIComponent(q)); if (r.ok) setRes((await r.json()).users); };
  const act = async (a, data) => { if (await post(a, { uid: u.id, ...data })) { alert("Listo"); if (a === "ck") { setU(null); setRes(null); } else abrir(u.id); } };
  const quick = (a, data, t) => { const r = ask(t); if (r) act(a, { ...data, razon: r }); };
  const c = u?.cedula, banks = u ? Object.keys(u.cuentas) : [], lista = u ? u.inventory.filter((i) => i.category === cat) : [], cat_items = items.filter((i) => i.category === cat);
  return (<>
    <form className="card" onSubmit={buscar} style={{ display: "flex", gap: 8 }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por usuario de Discord, Roblox, nombre, cédula o ID" style={{ flex: 1 }} /><button className="btn"><Search size={18} />Buscar</button></form>
    {res && !res.length && <p className="mut">Sin resultados.</p>}
    {res && res.map((x) => <div key={x.id} className="card" style={{ cursor: "pointer", marginTop: 8 }} onClick={() => abrir(x.id)}><b>{x.name}</b> <span className="mut">{x.cedula ? `${x.cedula.nombres} ${x.cedula.apellidos} · V-${String(x.cedula.num).padStart(8, "0")} · ${x.cedula.roblox}` : "Sin cédula"}</span></div>)}
    {u && <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <div className="card"><b>{u.name}</b> <span className="mut">ID {u.id}{u.chip ? ` · Línea ${u.chip}` : ""}</span><div>Efectivo {$(u.balance)}{banks.map((k) => ` · ${BK[k]} ${$(u.cuentas[k].saldo)}`)}</div></div>
      {c && <form className="card" onSubmit={(e) => { const v = vals(e); act("editCedula", { cedula: { nombres: v.nombres, apellidos: v.apellidos, edoCivil: v.edoCivil, lugar: v.lugar, roblox: v.roblox, nac: v.nac }, razon: v.razon }); }}><b>Editar cédula</b>
        <input name="nombres" defaultValue={c.nombres} placeholder="Nombres" /><input name="apellidos" defaultValue={c.apellidos} placeholder="Apellidos" /><input name="nac" type="date" defaultValue={c.nac ? String(c.nac).slice(0, 10) : ""} />
        <select name="edoCivil" defaultValue={c.edoCivil}>{[...new Set([c.edoCivil, ...CIVIL])].map((x) => <option key={x}>{x}</option>)}</select><input name="lugar" defaultValue={c.lugar} placeholder="Lugar de nacimiento" /><input name="roblox" defaultValue={c.roblox} placeholder="Usuario de Roblox" /><Razon /><button className="btn">Guardar cambios</button></form>}
      <form className="card" onSubmit={(e) => act("dinero", vals(e))}><b>Dinero</b><select name="destino"><option value="efectivo">Efectivo</option>{banks.map((k) => <option key={k} value={k}>Cuenta {BK[k]}</option>)}</select><input name="monto" type="number" min="1" placeholder="Monto" required /><Razon />
        <div style={{ display: "flex", gap: 8 }}><button className="btn" name="tipo" value="agregar" style={{ flex: 1 }}>Agregar</button><button className="btn r" name="tipo" value="quitar" style={{ flex: 1 }}>Retirar</button></div></form>
      <div className="card"><b>Inventario</b><div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}>{INV.map((x) => <button key={x} className={"btn " + (cat === x ? "" : "g")} onClick={() => setCat(x)}>{x}</button>)}</div>
        {cat === "Banco" ? Object.keys(BK).map((k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0" }}>{u.cuentas[k] ? <><span>{BK[k]} <span className="mut">saldo {$(u.cuentas[k].saldo)}</span></span><button className="btn g" onClick={() => quick("cuentaQuitar", { banco: k }, `Razón para quitar la tarjeta ${BK[k]}:`)}><Trash2 size={16} />Quitar</button></>
          : <><span className="mut">{BK[k]}: no la tiene</span><button className="btn g" onClick={() => quick("cuentaDar", { banco: k }, `Razón para dar la tarjeta ${BK[k]}:`)}><Plus size={16} />Dar tarjeta</button></>}</div>) : <>
          {cat === "Telefonía" && <><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0" }}>{u.chip ? <><span>Chip {u.chip}</span><button className="btn g" onClick={() => quick("chipQuitar", {}, "Razón para quitar el chip:")}><Trash2 size={16} />Quitar</button></> : <><span className="mut">Sin chip</span><button className="btn g" onClick={() => quick("chipDar", {}, "Razón para dar un chip:")}><Plus size={16} />Dar chip</button></>}</div>
            {u.plan && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0" }}><span>Plan {$(u.plan.monto)}/semana</span><button className="btn g" onClick={() => quick("planQuitar", {}, "Razón para cancelar el plan:")}><Trash2 size={16} />Cancelar</button></div>}</>}
          {lista.map((i, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", margin: "6px 0" }}><span>{i.name} <span className="mut">{$(i.price)}</span></span><button className="btn g" onClick={() => quick("invQuitar", { name: i.name, at: i.at }, `Razón para quitar "${i.name}":`)}><Trash2 size={16} />Quitar</button></div>)}
          {!lista.length && <p className="mut">No tiene nada en {cat}.</p>}
          {cat_items.length > 0 && <form onSubmit={(e) => act("invAgregar", vals(e))} style={{ display: "grid", gap: 8, marginTop: 8 }}><select name="itemId">{cat_items.map((i) => <option key={i.id} value={i.id}>{i.name}{i.ubicacion ? ` · ${i.ubicacion}` : ""} · {$(i.price)}</option>)}</select><Razon /><button className="btn g"><Plus size={16} />Agregar al inventario</button></form>}</>}</div>
      <form className="card" style={{ borderColor: "var(--bad)" }} onSubmit={(e) => { if (!confirm("CK: se borra TODO de este usuario, incluida la cédula. ¿Continuar?")) return e.preventDefault(); act("ck", vals(e)); }}><b style={{ color: "var(--bad)" }}>CK (character kill)</b>
        <p className="mut">Borra cédula, efectivo, cuentas, inventario, línea, chats y estados. El usuario podrá registrar un personaje nuevo.</p><input name="confirm" placeholder='Escribe "CK" para confirmar' required /><Razon /><button className="btn r"><Skull size={16} />Aplicar CK</button></form></div>}</>);
}
function Mercado({ items }) {
  const [cat, setCat] = useState(CATS[0]), [f, setF] = useState("Todos"), [q, setQ] = useState(""), [n, setN] = useState(40), TIPOS = ["0", "1", "2", "3", "4"], run = async (a, e) => { const v = vals(e), f = e.target; if (await post(a, v)) { alert("Listo"); f.reset(); location.reload(); } };
  const norm = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), cats = ["Todos", ...[...new Set(items.map((i) => i.category))].sort()];
  const lista = items.filter((i) => (f === "Todos" || i.category === f) && norm(`${i.name} ${i.ubicacion || ""} ${i.brand || ""} ${i.category}`).includes(norm(q.trim())));
  return (<><div className="card"><b>Catálogo ({lista.length}{lista.length !== items.length ? ` de ${items.length}` : ""})</b>
    <input value={q} onChange={(e) => { setQ(e.target.value); setN(40); }} placeholder="Buscar por nombre, casa (ej: 405), marca..." style={{ margin: "8px 0" }} />
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>{cats.map((c) => <button key={c} className={"btn " + (f === c ? "" : "g")} style={{ padding: "5px 12px", fontSize: 13 }} onClick={() => { setF(c); setN(40); }}>{c} <span style={{ opacity: 0.7 }}>{c === "Todos" ? items.length : items.filter((i) => i.category === c).length}</span></button>)}</div>
    {lista.slice(0, n).map((i) => <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", margin: "6px 0" }}><span>{i.name}{i.ubicacion ? ` · ${i.ubicacion}` : ""} <span className="mut">{i.category} · {$(i.price)}{i.impuesto ? ` · imp. ${$(i.impuesto)}` : ""}</span></span><span style={{ display: "flex", gap: 6 }}>
      <button className="btn g" onClick={async () => { const p = prompt("Nuevo precio (vacío = no cambia):", i.price); if (p === null) return; const m = prompt("Nuevo impuesto semanal (vacío = no cambia):", i.impuesto || ""); if (m === null) return; const r = ask("Razón del cambio:"); if (r && (await post("setPrice", { id: i.id, price: p, impuesto: m, razon: r }))) location.reload(); }}>Editar</button>
      <button className="btn g" onClick={async () => { const r = ask(`Razón para eliminar "${i.name}":`); if (r && (await post("delItem", { id: i.id, razon: r }))) location.reload(); }}><Trash2 size={16} /></button></span></div>)}
    {lista.length > n && <button className="btn g" style={{ width: "100%", marginTop: 8 }} onClick={() => setN(n + 60)}>Mostrar más ({lista.length - n} restantes)</button>}
    {!lista.length && <p className="mut">No hay artículos con ese filtro.</p>}</div>
    <details className="card" style={{ marginTop: 12 }}><summary style={{ cursor: "pointer" }}><b>Agregar casas o artículos nuevos</b></summary>
    <form className="card" onSubmit={(e) => run("addCasas", e)}><b>Lote de casas (un tipo, una región, muchos números)</b>
    <select name="tipo">{TIPOS.map((t) => <option key={t} value={t}>Casa tipo {t}</option>)}</select><input name="img" placeholder="Link de la imagen (Discord)" required /><input name="region" placeholder="Región (ej: Caracas)" required />
    <textarea name="numeros" rows={3} placeholder="Números de casa: 401, 402, 405-420 ..." required /><input name="price" type="number" min="0" placeholder="Precio" required /><input name="impuesto" type="number" min="0" placeholder="Impuesto semanal" /><Razon /><button className="btn"><Plus size={18} />Crear casas</button></form>
    <form className="card" style={{ marginTop: 12 }} onSubmit={(e) => run("addItem", e)}><b>Nuevo artículo del mercado</b>
      <select name="category" value={cat} onChange={(e) => setCat(e.target.value)}>{CATS.map((x) => <option key={x}>{x}</option>)}</select><input name="name" placeholder="Nombre" required /><input name="price" type="number" min="0" placeholder="Precio" required /><textarea name="desc" placeholder="Descripción" rows={2} />
      {cat === "Propiedades" && <><input name="ubicacion" placeholder="Ubicación (ej: Caracas 405)" required /><input name="impuesto" type="number" min="0" placeholder="Impuesto semanal" /></>}
      {cat === "Concesionario" && <><input name="clase" placeholder="Clase (ej: Deportivo, SUV)" /><input name="brand" placeholder="Marca / modelo" /><input name="year" placeholder="Año" /><input name="impuesto" type="number" min="0" placeholder="Impuesto" /></>}
      <input name="img" placeholder="URL de la foto (opcional)" /><input name="stock" type="number" min="1" placeholder="Stock (vacío = ilimitado)" /><Razon /><button className="btn"><Plus size={18} />Agregar</button></form></details></>);
}
function Apelaciones({ apelaciones }) {
  const dec = async (id, ok) => { const r = prompt(ok ? "Razón de la aprobación:" : "Razón de la denegación (se la mostramos al usuario):"); if (!r || r.trim().length < 3) return r !== null && alert("La razón es obligatoria"); if (await post(ok ? "apelOk" : "apelNo", { id, razon: r.trim() })) location.reload(); };
  return (<div className="card"><b>Apelaciones de CK ({apelaciones.length})</b><p className="mut">Personajes muertos por sed o hambre que piden volver (por ejemplo, por un corte de luz). Si aprueban, vuelve con comida y agua al 100%.</p>{apelaciones.map((r) => <div key={r.id} style={{ padding: "10px 0", borderTop: "1px solid var(--bd)" }}><div><b>{r.nombre}</b> · murió de {r.causa}</div><div className="mut">{new Date(r.at).toLocaleString("es")}</div><div style={{ margin: "6px 0" }}>{r.razon}</div>
    <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => dec(r.id, true)}>Aprobar</button><button className="btn r" onClick={() => dec(r.id, false)}>Denegar</button></div></div>)}{!apelaciones.length && <p className="mut">Sin apelaciones pendientes.</p>}</div>);
}
function Evid({ u, t }) { return <a href={u} target="_blank" rel="noreferrer" title={t}><img src={u} alt={t} loading="lazy" referrerPolicy="no-referrer" style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--bd)" }} /></a>; }
function Trabajos({ trabajos }) {
  return (<div className="card" style={{ marginTop: 12 }}><b>Solicitudes de trabajo secundario ({trabajos.length})</b>
    {trabajos.map((r) => <div key={r.id} style={{ padding: "10px 0", borderTop: "1px solid var(--bd)" }}>
      <div><b>{r.trabajo}</b> · {r.horas} h × ${r.tarifa.toLocaleString("es")} = <b style={{ color: "var(--ok)" }}>${r.total.toLocaleString("es")}</b></div>
      <div className="mut">Solicita: {r.user} · Roblox: {r.roblox} · {new Date(r.at).toLocaleString("es")}</div>
      <div className="mut" style={{ marginTop: 6 }}>Inicio · Durante · Final (3)</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}><Evid u={r.ev.inicio} t="Inicio" /><Evid u={r.ev.durante} t="Durante" />{r.ev.final.map((x, i) => <Evid key={i} u={x} t={`Final ${i + 1}`} />)}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}><button className="btn" onClick={async () => { if (confirm(`¿Aprobar y pagar $${r.total.toLocaleString("es")} a ${r.user}?`) && (await post("trabajoOk", { id: r.id }))) location.reload(); }}><Check size={16} />Aprobar y pagar</button>
        <button className="btn r" onClick={async () => { const m = ask("Razón para rechazar:"); if (m && (await post("trabajoNo", { id: r.id, razon: m }))) location.reload(); }}><Trash2 size={16} />Rechazar</button></div></div>)}
    {!trabajos.length && <p className="mut">No hay solicitudes de trabajo pendientes.</p>}</div>);
}
function Solicitudes({ robos, trabajos }) {
  return (<><div className="card"><b>Solicitudes de robo de autos ({robos.length})</b>{robos.map((r) => <div key={r.id} style={{ padding: "10px 0", borderTop: "1px solid var(--bd)" }}>
    <img src={r.img} alt="" style={{ width: "100%", maxWidth: 360, borderRadius: 10 }} /><div><b>{r.modelo}</b> · {r.color} · Placa {r.placa}</div><div className="mut">Solicita: {r.user}</div><div>{r.specs}</div>
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}><button className="btn" onClick={async () => { if (await post("roboOk", { id: r.id })) location.reload(); }}><Check size={16} />Aprobar</button>
      <button className="btn r" onClick={async () => { const m = ask("Razón para rechazar:"); if (m && (await post("roboNo", { id: r.id, razon: m }))) location.reload(); }}><Trash2 size={16} />Rechazar</button></div></div>)}{!robos.length && <p className="mut">No hay solicitudes pendientes.</p>}</div><Trabajos trabajos={trabajos} /></>);
}
function Staff({ staff }) {
  return (<div className="card"><b>Staff de Administración</b><p className="mut">Solo quienes están aquí pueden entrar a Administración, y al entrar les pide su placa. Lo asignan el Developer, Fundación y Asuntos Internos. La persona debe haber iniciado sesión en el portal al menos una vez. Junta Directiva, Fundación y Asuntos Internos hacen todo; Moderador solo revisa solicitudes.</p>
    <form className="row2" onSubmit={async (e) => { const v = vals(e); if (await post("staffSet", v)) location.reload(); }}><input name="username" placeholder="Usuario de Discord" required /><select name="rango"><option value="JUNTA_DIRECTIVA">Junta Directiva</option><option value="FUNDACION">Fundación</option><option value="ASUNTOS_INTERNOS">Asuntos Internos</option><option value="MODERACION">Moderador</option></select><input name="placa" placeholder="Placa (obligatoria)" required /><button className="btn"><Plus size={16} />Asignar</button></form>
    {staff.map((x) => <div key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid var(--bd)" }}><span><b>{x.name}</b> <span className="tag">{RANK_LABEL[x.rango] || x.rango}</span>{x.placa && <span className="mut"> · Placa {x.placa}</span>}</span>{x.rango !== "DEVELOPER" && <button className="btn r" onClick={async () => { if (confirm(`¿Quitar a ${x.name} del staff?`) && (await post("staffDel", { uid: x.id }))) location.reload(); }}><Trash2 size={14} /></button>}</div>)}{!staff.length && <p className="mut">Sin staff asignado.</p>}</div>);
}
function Apertura({ ultimo }) {
  const [nota, setNota] = useState(""), [busy, setBusy] = useState("");
  const ST = { votacion: ["🗳️ Votación abierta", "#60a5fa"], abrir: ["🟢 Servidor abierto", "#22c55e"], cerrar: ["🔴 Servidor cerrado", "#ef4444"] };
  const enviar = async (tipo, pregunta) => { if (!confirm(pregunta)) return; setBusy(tipo); const ok = await post("apertura", { tipo, nota }); setBusy(""); if (ok) { alert("Enviado a Discord"); location.reload(); } };
  const B = [["votacion", "🗳️ Abrir votación", "#2563eb", "¿Enviar la votación para abrir el servidor? Se menciona a Civil Venezolano."], ["abrir", "🟢 Abrir servidor", "#16a34a", "¿Anunciar que el servidor está ABIERTO? Se menciona a Civil Venezolano."], ["cerrar", "🔴 Cerrar servidor", "#dc2626", "¿Anunciar que el servidor está CERRADO?"]];
  return (<div className="card"><b>Apertura del servidor</b>
    <p className="mut">Envía un mensaje a Discord por el webhook de aperturas. Cada mensaje lleva su GIF y el ping a Civil Venezolano (la votación y la apertura); las reacciones las pone el otro bot. Necesita la variable DISCORD_WEBHOOK_APERTURA en Vercel.</p>
    <div style={{ margin: "8px 0" }}>Estado del servidor: <b style={{ color: ultimo?.servidor === "cerrado" ? "#ef4444" : "#22c55e" }}>{ultimo?.servidor === "cerrado" ? "🔴 Cerrado (hambre y sed en pausa, nadie puede comer)" : "🟢 Abierto (el hambre y la sed corren)"}</b></div>
    {ultimo?.tipo && <div style={{ margin: "8px 0" }}>Último aviso: <b style={{ color: ST[ultimo.tipo]?.[1] }}>{ST[ultimo.tipo]?.[0]}</b> <span className="mut">· {ultimo.por} · {new Date(ultimo.at).toLocaleString("es")}</span></div>}
    <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} placeholder="Nota opcional (ej: código del servidor, hora de inicio...)" />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginTop: 10 }}>{B.map(([k, t, c, q]) => <button key={k} className="btn" disabled={!!busy} style={{ background: c, padding: 16, fontSize: 16, fontWeight: 800 }} onClick={() => enviar(k, q)}>{busy === k ? "Enviando..." : t}</button>)}</div></div>);
}
function Erlc({ auto }) {
  const [cmd, setCmd] = useState(""), a = auto || { bienv: {}, reglas: {} };
  const [f, setF] = useState({ bienvOn: a.bienv.on !== false, bienvTexto: a.bienv.texto || "", bienvCada: a.bienv.cadaMin || 5, bienvDur: a.bienv.durMin || 20, reglasOn: a.reglas.on !== false, reglasCada: a.reglas.cadaMin || 10, lista: (a.reglas.lista || []).join("\n") });
  const s = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  return (<div><div className="card"><b>Conexión con ER:LC</b><p className="mut">Aquí ejecutas comandos y configuras los mensajes automáticos del servidor. Necesita la variable ERLC_SERVER_KEY en Vercel y al menos un jugador dentro del servidor. Cuando la MDT arresta a alguien con minutos, el portal le manda :jail a su usuario de Roblox.</p></div>
    <div className="card"><b>Ejecutar cualquier comando</b><p className="mut">Escribe el comando como en el juego (ej: <b>:m Hola a todos</b>, <b>:kick usuario</b>, <b>:unjail usuario</b>). Si no empieza con ":" se le pone solo. ER:LC deja pasar ~1 comando cada 5 segundos.</p>
      <div style={{ display: "flex", gap: 8 }}><input value={cmd} onChange={(e) => setCmd(e.target.value)} maxLength={300} placeholder=":comando argumentos" /><button className="btn" onClick={async () => { if (!cmd.trim()) return; if (await post("erlcCmd", { cmd })) { alert("Comando enviado."); setCmd(""); } }}>Ejecutar</button></div></div>
    <div className="card"><b>Mensajes automáticos</b><p className="mut">Solo se envían con el servidor ABIERTO y al menos un jugador dentro. Al abrir: bienvenida cada N minutos durante la duración indicada; después se rotan las reglas (una por vez). Se activan solos mientras alguien tenga el portal abierto o corra el cron de /api/erlc/vigilar.{auto?.ult?.error && <span style={{ color: "#ef4444" }}> Último error: {String(auto.ult.error)}</span>}</p>
      <label><input type="checkbox" checked={f.bienvOn} onChange={s("bienvOn")} style={{ width: "auto" }} /> Mensaje de bienvenida</label>
      <input value={f.bienvTexto} onChange={s("bienvTexto")} maxLength={200} placeholder="Texto de bienvenida" />
      <div className="row2"><label className="mut">Cada (min)<input type="number" min="1" value={f.bienvCada} onChange={s("bienvCada")} /></label><label className="mut">Durante (min tras abrir)<input type="number" min="1" value={f.bienvDur} onChange={s("bienvDur")} /></label></div>
      <label style={{ display: "block", marginTop: 10 }}><input type="checkbox" checked={f.reglasOn} onChange={s("reglasOn")} style={{ width: "auto" }} /> Mensajes de reglas (:h)</label>
      <label className="mut">Cada (min)<input type="number" min="1" value={f.reglasCada} onChange={s("reglasCada")} /></label>
      <textarea rows={10} value={f.lista} onChange={s("lista")} placeholder="Un mensaje por línea" style={{ width: "100%" }} />
      <button className="btn" style={{ marginTop: 8 }} onClick={async () => { if (await post("erlcAuto", { ...f, lista: f.lista.split("\n").map((x) => x.trim()).filter(Boolean) })) alert("Mensajes automáticos guardados."); }}>Guardar</button></div></div>);
}
function AgenteForm() {
  const [dep, setDep] = useState(DEPTOS[1] || DEPTOS[0]);
  return (<form className="row2" onSubmit={async (e) => { const v = vals(e); if (await post("agenteSet", v)) location.reload(); }}><input name="username" placeholder="Usuario de Discord" required />
    <select name="depto" value={dep} onChange={(e) => setDep(e.target.value)}>{DEPTOS.map((d) => <option key={d} value={d}>{nombreDepto(d)}</option>)}</select>
    <select name="rango">{(RANGOS_POR_DEPTO[dep] || []).map((r) => <option key={r}>{r}</option>)}</select><input name="placa" placeholder="Placa" required /><button className="btn"><Plus size={16} />Asignar</button></form>);
}
function Agentes({ agentes }) {
  return (<div className="card"><b>Agentes de la MDT</b><p className="mut">Asigna a un policía con su departamento, rango y placa. El sueldo ya no se pone aquí: lo fija y lo libera el Ministro del Interior desde la Tesorería de la MDT. Al entrar a la MDT, solo le pedirá su placa. Desde "Comisario" aprueban allanamientos.</p>
    <AgenteForm />
    {agentes.map((x) => <div key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid var(--bd)" }}><span><Insignia rango={x.rango} depto={x.depto} /><b>{x.rango}</b> {x.nombre || x.name}<div className="mut">@{x.name} · Placa {x.placa} · {nombreDepto(x.depto)}</div></span><button className="btn r" onClick={async () => { if (confirm(`¿Quitar a ${x.name} de la MDT?`) && (await post("agenteDel", { uid: x.id }))) location.reload(); }}><Trash2 size={14} /></button></div>)}{!agentes.length && <p className="mut">Aún no hay agentes asignados.</p>}</div>);
}
export default function Admin({ trabajos = [], rank, items, reps, audit, robos = [], apertura = null, staff = [], agentes = [], canStaff = false, apelaciones = [], auto = null }) {
  const full = canAdmin(rank), TABS = full ? ["Usuarios", "Mercado", "Solicitudes", "Apelaciones", "Agentes MDT", "Auditoría", "Reportes 911", "ER:LC", "Apertura", ...(canStaff ? ["Staff"] : [])] : ["Solicitudes", "Apelaciones"];
  const [tab, setTab] = useState(full ? "Usuarios" : "Solicitudes");
  // La sesión de Administración dura 35 minutos desde que pones la placa. Ya no se cierra al recargar o al hacer una acción.
  return (<div style={{ maxWidth: 900, margin: "0 auto" }}><img src="/admin-logo.jpg" alt="VE:RP" style={{ width: "min(380px,100%)", borderRadius: 12, display: "block", margin: "0 auto 8px" }} /><h2 style={{ textAlign: "center" }}>Administración Y Asuntos Internos De Venezuela Community</h2><span className="tag">{RANK_LABEL[rank] || rank}</span>
    <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>{TABS.map((t) => <button key={t} className={"btn " + (tab === t ? "" : "g")} onClick={() => setTab(t)}>{t}</button>)}</div>
    {tab === "Solicitudes" && <Solicitudes robos={robos} trabajos={trabajos} />}{tab === "Apelaciones" && <Apelaciones apelaciones={apelaciones} />}{tab === "Staff" && <Staff staff={staff} />}{tab === "Agentes MDT" && <Agentes agentes={agentes} />}{tab === "Usuarios" && <Usuarios items={items} />}{tab === "Mercado" && <Mercado items={items} />}
    {tab === "ER:LC" && <Erlc auto={auto} />}{tab === "Apertura" && <Apertura ultimo={apertura} />}
    {tab === "Auditoría" && <div className="card"><b>Registro de auditoría (últimas 100 acciones)</b>{audit.map((x) => <div key={x.id} style={{ padding: "8px 0", borderTop: "1px solid var(--bd)" }}><b>{x.act}</b> · {x.obj}<div className="mut">{x.by} ({String(x.rank).replace("_", " ")}) · {new Date(x.at).toLocaleString("es")}</div><div>Razón: {x.razon}</div></div>)}{!audit.length && <p className="mut">Sin registros.</p>}</div>}
    {tab === "Reportes 911" && <div className="card"><b>Reportes 911</b>{reps.map((r) => <div key={r.id} style={{ margin: "8px 0" }}>{r.t}<div className="mut">{r.d} · {r.e}</div><button className="btn g" onClick={async () => { if (await post("done", { id: r.id })) location.reload(); }}><Check size={16} className="neon" />Resuelto</button></div>)}{!reps.length && <p className="mut">Sin reportes pendientes.</p>}</div>}</div>);
}
