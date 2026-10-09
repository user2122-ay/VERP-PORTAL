"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Music, Plus, Home, Search, User, X, Send, Trash2, Volume2, VolumeX, Play, Link2, BadgeCheck, Disc3 } from "lucide-react";
import Av from "../whatsapp/Av";
const api = async (q) => { const r = await fetch("/api/tikverp?" + q, { cache: "no-store" }); return r.ok ? r.json() : null; };
const post = async (b) => { const r = await fetch("/api/tikverp", { method: "POST", body: JSON.stringify(b) }), j = await r.json().catch(() => ({})); if (!r.ok) { alert(j.error || "Error"); return null; } return j; };
const n = (x) => (x >= 1e6 ? (x / 1e6).toFixed(1) + " M" : x >= 1e3 ? (x / 1e3).toFixed(1) + " k" : String(x || 0));
const fd = (e) => { e.preventDefault(); return Object.fromEntries(new FormData(e.target)); };
const Logo = ({ h = 26 }) => <img src="/tikverp-logo.png" alt="TikVerp" style={{ height: h }} />;

// ---- Crear cuenta ----
function Registro({ avatar, onOk }) {
  const [foto, setFoto] = useState("");
  return (<div className="tv-pg" style={{ display: "grid", alignContent: "center", gap: 10, textAlign: "center" }}>
    <div style={{ display: "grid", justifyItems: "center", gap: 6 }}><Logo h={86} /><h2 style={{ margin: 0 }}>Crea tu cuenta de TikVerp</h2><div style={{ color: "#9fb0d0", fontSize: 14 }}>La red de la comunidad VE:RP. Comparte videos, fotos y música.</div></div>
    <div style={{ display: "grid", justifyItems: "center" }}><Av src={foto || avatar} nombre="?" size={84} /></div>
    <form onSubmit={async (e) => { if (await post({ accion: "crear", ...fd(e) })) onOk(); }} style={{ textAlign: "left" }}>
      <label>Usuario (único)</label><input name="handle" required minLength={3} maxLength={20} placeholder="tu_usuario" autoComplete="off" />
      <label>Nombre</label><input name="nombre" required maxLength={30} placeholder="Cómo te verán los demás" />
      <label>Foto de perfil (link de Discord, opcional)</label><input name="foto" value={foto} onChange={(e) => setFoto(e.target.value)} placeholder="https://cdn.discordapp.com/....png" />
      <div style={{ color: "#9fb0d0", fontSize: 12, margin: "-6px 0 8px" }}>Sube tu foto a un chat de Discord, clic derecho → “Copiar enlace de imagen” y pégalo aquí. Si lo dejas vacío usamos tu avatar de la cédula.</div>
      <label>Bio (opcional)</label><textarea name="bio" rows={2} maxLength={120} />
      <button className="btn" style={{ width: "100%" }}>Crear cuenta</button></form></div>);
}

// ---- Una publicación (video o foto, con música opcional) ----
function Item({ p, mudo, setMudo, acc }) {
  const ref = useRef(), vid = useRef(), aud = useRef(), tap = useRef(0), tm = useRef();
  const [on, setOn] = useState(false), [pausa, setPausa] = useState(false), [bloq, setBloq] = useState(false), [cor, setCor] = useState(0);
  useEffect(() => { const io = new IntersectionObserver(([e]) => setOn(e.intersectionRatio > 0.6), { threshold: [0, 0.6, 1] }); io.observe(ref.current); return () => io.disconnect(); }, []);
  useEffect(() => { if (vid.current) vid.current.muted = !!p.sonido || mudo; if (aud.current) aud.current.muted = mudo; }, [mudo, p.sonido]);
  useEffect(() => { const m = [vid.current, aud.current].filter(Boolean); if (on && !pausa) { setBloq(false); m.forEach((x) => x.play().catch(() => setBloq(true))); } else m.forEach((x) => { x.pause(); if (!on) x.currentTime = 0; }); }, [on, pausa]);
  const click = () => {
    const t = Date.now(); if (t - tap.current < 300) { clearTimeout(tm.current); tap.current = 0; if (!p.liked) acc.like(p); setCor((c) => c + 1); return; }
    tap.current = t; tm.current = setTimeout(() => { tap.current = 0; setBloq(false); setPausa((x) => !x); }, 300);
  };
  return (<div className="tv-it" ref={ref}>
    {p.tipo === "video" ? <video ref={vid} className="tv-med" src={p.url} loop playsInline preload="metadata" /> : <img className="tv-med" src={p.url} alt="" referrerPolicy="no-referrer" />}
    {p.sonido && <audio ref={aud} src={p.sonido.url} loop preload="metadata" />}
    <div style={{ position: "absolute", inset: 0, zIndex: 2 }} onClick={click} />
    {(pausa || bloq) && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 2, pointerEvents: "none" }}><Play size={64} color="#fff" style={{ opacity: 0.8 }} /></div>}
    {cor > 0 && <Heart key={cor} className="tv-heart" size={96} fill="#ff2d55" />}
    <div className="tv-sh" />
    <div className="tv-rail">
      <div style={{ position: "relative", marginBottom: 6 }}><button onClick={() => acc.perfil(p.handle)} aria-label="Perfil"><Av src={p.foto} nombre={p.nombre} size={46} /></button>
        {!p.mio && !p.sigue && <button onClick={() => acc.seguir(p.handle)} aria-label="Seguir" style={{ position: "absolute", left: 13, bottom: -8, background: "#ff2d55", borderRadius: "50%", width: 20, height: 20, justifyContent: "center" }}><Plus size={14} /></button>}</div>
      <button className={p.liked ? "on" : ""} onClick={() => acc.like(p)} aria-label="Me gusta"><Heart size={34} fill={p.liked ? "#ff2d55" : "none"} />{n(p.likes)}</button>
      <button onClick={() => acc.com(p)} aria-label="Comentarios"><MessageCircle size={34} />{n(p.comentarios)}</button>
      <button onClick={() => acc.share(p)} aria-label="Compartir"><Share2 size={32} />{n(p.compartidos)}</button>
      <button onClick={() => setMudo(!mudo)} aria-label="Sonido">{mudo ? <VolumeX size={28} /> : <Volume2 size={28} />}</button>
      {p.sonido && <div className="tv-disc" />}</div>
    <div className="tv-info">
      <div style={{ fontWeight: 800, fontSize: 16, display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }} onClick={() => acc.perfil(p.handle)}>@{p.handle}{p.badge && <span title={p.badge}><BadgeCheck size={16} color="#4da3ff" /></span>}</div>
      <div style={{ margin: "4px 0", wordBreak: "break-word" }}>{p.desc.split(/(#[\p{L}\p{N}_]+)/u).map((x, k) => x.startsWith("#") ? <button key={k} className="tv-tag" onClick={() => acc.tag(x)}>{x}</button> : x)}</div>
      <div className="tv-mq" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}><Music size={14} style={{ flex: "none" }} /><div className="tv-mq" style={{ flex: 1 }}><span>{p.sonido ? `${p.sonido.titulo} · ${p.sonido.artista}` : `Sonido original · ${p.handle}`}</span></div></div></div>
    {p.mio ? <button onClick={() => acc.borrar(p)} aria-label="Borrar" style={{ position: "absolute", top: 46, right: 10, zIndex: 3, background: "#0008", border: 0, color: "#fff", borderRadius: 99, padding: 8, cursor: "pointer" }}><Trash2 size={16} /></button> : null}
  </div>);
}

function Feed({ lista, mudo, setMudo, acc, mas, tabs, t, setT }) {
  return (<><div className="tv-top">{tabs && ["para", "sig"].map((k) => <button key={k} className={t === k ? "on" : ""} onClick={() => setT(k)}>{k === "para" ? "Para ti" : "Siguiendo"}</button>)}</div>
    <div className="tv-feed" onScroll={(e) => { const x = e.target; if (mas && x.scrollTop + x.clientHeight * 2 > x.scrollHeight) mas(); }}>
      {lista.map((p) => <Item key={p.id} p={p} mudo={mudo} setMudo={setMudo} acc={acc} />)}
      {!lista.length && <div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", padding: 24, color: "#9fb0d0" }}><div><Logo h={70} /><p>{t === "sig" ? "Aún no sigues a nadie con publicaciones. Busca perfiles en la lupa." : "Todavía no hay publicaciones. ¡Sé el primero en subir una!"}</p></div></div>}</div></>);
}

// ---- Subir ----
function Subir({ pre, onOk }) {
  const [sonidos, setSonidos] = useState([]); useEffect(() => { api("m=sonidos").then((j) => setSonidos(j?.l || [])); }, []);
  const [url, setUrl] = useState(""), [m, setM] = useState(pre ? "cat" : "no"), [sid, setSid] = useState(pre || ""), tipo = /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) ? "foto" : null;
  return (<div className="tv-pg"><h3 style={{ margin: "0 0 8px" }}>Nueva publicación</h3>
    <form onSubmit={async (e) => { const f = fd(e), b = { accion: "publicar", url: f.url, desc: f.desc }; if (m === "cat") b.sonidoId = sid; if (m === "nuevo") b.sonidoNuevo = { titulo: f.stitulo, artista: f.sartista, url: f.surl }; if (await post(b)) onOk(); }}>
      <label>Link de tu video o foto (Discord o Imgur)</label><input name="url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://cdn.discordapp.com/....mp4" />
      {tipo === "video" && <video src={url} controls playsInline style={{ width: "100%", maxHeight: 220, borderRadius: 10, background: "#000" }} />}{tipo === "foto" && <img src={url} alt="" referrerPolicy="no-referrer" style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 10, background: "#000" }} />}
      <label>Descripción y #hashtags</label><textarea name="desc" rows={2} maxLength={200} placeholder="Cuéntale a la comunidad... #VERP" />
      <label>Música</label><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>{[["no", "Sin música"], ["cat", "Del catálogo"], ["nuevo", "Crear sonido"]].map(([k, t]) => <button type="button" key={k} className={"btn " + (m === k ? "" : "g")} style={{ padding: "6px 12px", boxShadow: "none" }} onClick={() => setM(k)}>{t}</button>)}</div>
      {m === "cat" && <select value={sid} onChange={(e) => setSid(e.target.value)} required><option value="">Elige un sonido</option>{sonidos.map((s) => <option key={s.id} value={s.id}>{s.titulo} · {s.artista} ({s.usos} usos)</option>)}</select>}
      {m === "nuevo" && <><input name="stitulo" required maxLength={50} placeholder="Título de la canción" /><input name="sartista" maxLength={40} placeholder="Artista (opcional)" /><input name="surl" required placeholder="Link del audio (Discord .mp3 / .ogg / .wav)" /></>}
      {m !== "no" && <div style={{ color: "#9fb0d0", fontSize: 12, marginBottom: 8 }}>Con música, el video se escucha con ese sonido en lugar del original.</div>}
      <button className="btn" style={{ width: "100%" }}>Publicar</button></form></div>);
}

// ---- Sonidos (música de la comunidad) ----
function Sonidos({ usar }) {
  const [l, setL] = useState([]), [q, setQ] = useState(""), [p, setP] = useState(null), au = useRef(), cargar = useCallback(async (x = "") => setL((await api("m=sonidos&q=" + encodeURIComponent(x)))?.l || []), []);
  useEffect(() => { cargar(); return () => au.current?.pause(); }, []);
  const oir = (s) => { au.current?.pause(); if (p === s.id) return setP(null); au.current = new Audio(s.url); au.current.play().catch(() => {}); au.current.onended = () => setP(null); setP(s.id); };
  return (<div className="tv-pg"><h3 style={{ margin: "0 0 8px", display: "flex", gap: 6, alignItems: "center" }}><Disc3 size={20} />Sonidos de la comunidad</h3>
    <form className="row2" onSubmit={(e) => { e.preventDefault(); cargar(q); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar música" /><button className="btn g"><Search size={16} /></button></form>
    <details style={{ margin: "6px 0 10px" }}><summary style={{ cursor: "pointer", color: "#7fc1ff" }}>+ Crear un sonido nuevo</summary>
      <form onSubmit={async (e) => { if (await post({ accion: "sonido", ...(({ titulo, artista, url }) => ({ titulo, artista, url }))(fd(e)) })) { e.target.reset(); cargar(); } }}><input name="titulo" required maxLength={50} placeholder="Título" /><input name="artista" maxLength={40} placeholder="Artista (opcional)" /><input name="url" required placeholder="Link del audio (Discord .mp3 / .ogg / .wav)" /><button className="btn" style={{ width: "100%" }}>Guardar sonido</button></form></details>
    {l.map((s) => <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderTop: "1px solid #1b2a4a" }}><button className="btn g" style={{ padding: 8, borderRadius: 99 }} onClick={() => oir(s)} aria-label="Escuchar">{p === s.id ? <X size={16} /> : <Play size={16} />}</button><div style={{ flex: 1, minWidth: 0 }}><b>{s.titulo}</b><div style={{ color: "#9fb0d0", fontSize: 12 }}>{s.artista} · por @{s.por} · {s.usos} usos</div></div><button className="btn" style={{ padding: "6px 12px" }} onClick={() => usar(s.id)}>Usar</button></div>)}
    {!l.length && <p style={{ color: "#9fb0d0" }}>No hay sonidos todavía. ¡Crea el primero!</p>}</div>);
}

// ---- Buscar ----
function Buscar({ acc }) {
  const [q, setQ] = useState(""), [r, setR] = useState(null);
  const ir = async (x) => setR(await api("m=buscar&q=" + encodeURIComponent(x)));
  useEffect(() => { if (acc.q) { setQ(acc.q); ir(acc.q); } }, [acc.q]);
  return (<div className="tv-pg"><form className="row2" onSubmit={(e) => { e.preventDefault(); ir(q); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca personas, #hashtags o videos" autoFocus /><button className="btn g"><Search size={16} /></button></form>
    {r?.perfiles?.map((x) => <div key={x.uid} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", cursor: "pointer" }} onClick={() => acc.perfil(x.handle)}><Av src={x.foto} nombre={x.nombre} size={42} /><div><b>@{x.handle}</b><div style={{ color: "#9fb0d0", fontSize: 12 }}>{x.nombre} · {n(x.seguidores)} seguidores</div></div></div>)}
    {r?.posts?.length > 0 && <div className="tv-grid" style={{ marginTop: 8 }}>{r.posts.map((p) => <Mini key={p.id} p={p} abrir={acc.abrir} />)}</div>}
    {r && !r.perfiles?.length && !r.posts?.length && <p style={{ color: "#9fb0d0" }}>Sin resultados.</p>}
    {!r && <p style={{ color: "#9fb0d0" }}>Prueba con un #hashtag como #VERP.</p>}</div>);
}
const Mini = ({ p, abrir }) => <div onClick={() => abrir(p)}>{p.tipo === "video" ? <video src={p.url + "#t=0.1"} preload="metadata" muted playsInline /> : <img src={p.url} alt="" referrerPolicy="no-referrer" />}<span style={{ position: "absolute", left: 4, bottom: 3, fontSize: 11, textShadow: "0 1px 3px #000", display: "flex", gap: 2, alignItems: "center" }}><Heart size={11} />{n(p.likes)}</span></div>;

// ---- Perfil ----
function Perfil({ h, acc, yoHandle, recargar }) {
  const [d, setD] = useState(null), [ed, setEd] = useState(false), cargar = useCallback(async () => setD(await api("m=perfil&h=" + encodeURIComponent(h))), [h]);
  useEffect(() => { setD(null); cargar(); }, [h, acc.tick]);
  if (!d) return <div className="tv-pg"><p style={{ color: "#9fb0d0" }}>Cargando...</p></div>;
  const x = d.perfil;
  return (<div className="tv-pg"><div style={{ display: "grid", justifyItems: "center", gap: 4, textAlign: "center" }}><Av src={x.foto} nombre={x.nombre} size={84} />
    <b style={{ fontSize: 18, display: "flex", gap: 4, alignItems: "center" }}>@{x.handle}{x.badge && <span title={x.badge}><BadgeCheck size={16} color="#4da3ff" /></span>}</b><div>{x.nombre}</div>{x.bio && <div style={{ color: "#9fb0d0", fontSize: 14 }}>{x.bio}</div>}
    <div style={{ display: "flex", gap: 22, margin: "8px 0" }}>{[["Siguiendo", x.siguiendo], ["Seguidores", x.seguidores], ["Me gusta", x.likes]].map(([t, v]) => <div key={t}><b style={{ fontSize: 17 }}>{n(v)}</b><div style={{ color: "#9fb0d0", fontSize: 12 }}>{t}</div></div>)}</div>
    {x.yo ? <button className="btn g" onClick={() => setEd(!ed)}>Editar perfil</button> : <button className={"btn " + (x.sigo ? "g" : "")} onClick={async () => { await acc.seguir(x.handle); cargar(); }}>{x.sigo ? "Siguiendo" : "Seguir"}</button>}</div>
    {ed && <form onSubmit={async (e) => { if (await post({ accion: "editar", ...fd(e) })) { setEd(false); cargar(); recargar(); } }} style={{ marginTop: 10 }}><label>Nombre</label><input name="nombre" defaultValue={x.nombre} required maxLength={30} /><label>Bio</label><textarea name="bio" rows={2} maxLength={120} defaultValue={x.bio} /><label>Foto (link de Discord; vacío = avatar de la cédula)</label><input name="foto" placeholder="https://cdn.discordapp.com/....png" /><button className="btn" style={{ width: "100%" }}>Guardar</button></form>}
    <div className="tv-grid" style={{ marginTop: 12 }}>{d.posts.map((p) => <Mini key={p.id} p={p} abrir={acc.abrir} />)}</div>{!d.posts.length && <p style={{ color: "#9fb0d0", textAlign: "center" }}>Sin publicaciones.</p>}</div>);
}

// ---- Comentarios y compartir ----
function Comentarios({ p, cerrar, acc }) {
  const [l, setL] = useState([]), [t, setT] = useState(""), cargar = async () => setL((await api("m=com&id=" + p.id))?.l || []);
  useEffect(() => { cargar(); }, []);
  return (<><div className="tv-bk" onClick={cerrar} /><div className="tv-sheet"><div style={{ display: "flex", justifyContent: "space-between" }}><b>{n(l.length)} comentarios</b><button onClick={cerrar} style={{ background: "none", border: 0, color: "#fff", cursor: "pointer" }}><X size={20} /></button></div>
    <div style={{ overflowY: "auto", flex: 1, minHeight: 120 }}>{l.map((c) => <div key={c.id} style={{ display: "flex", gap: 8, padding: "6px 0" }}><Av src={c.foto} nombre={c.handle} size={30} /><div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>@{c.handle}</b><div style={{ wordBreak: "break-word" }}>{c.txt}</div></div>{(c.mio || p.mio || acc.staff) && <button onClick={async () => { await post({ accion: "borrarCom", id: p.id, cid: c.id }); cargar(); acc.upd(p.id, (x) => ({ ...x, comentarios: Math.max(0, x.comentarios - 1) })); }} style={{ background: "none", border: 0, color: "#9fb0d0", cursor: "pointer" }}><Trash2 size={14} /></button>}</div>)}{!l.length && <p style={{ color: "#9fb0d0" }}>Sé el primero en comentar.</p>}</div>
    <form className="row2" onSubmit={async (e) => { e.preventDefault(); if (!t.trim()) return; const x = t; setT(""); if (await post({ accion: "comentar", id: p.id, txt: x })) { cargar(); acc.upd(p.id, (y) => ({ ...y, comentarios: y.comentarios + 1 })); } }}><input value={t} onChange={(e) => setT(e.target.value)} maxLength={150} placeholder="Añade un comentario..." style={{ margin: 0 }} /><button className="btn"><Send size={16} /></button></form></div></>);
}
function Compartir({ p, cerrar, me, acc }) {
  const link = `${location.origin}/tikverp?v=${p.id}`, [ok, setOk] = useState("");
  return (<><div className="tv-bk" onClick={cerrar} /><div className="tv-sheet"><div style={{ display: "flex", justifyContent: "space-between" }}><b>Compartir con tus amigos</b><button onClick={cerrar} style={{ background: "none", border: 0, color: "#fff", cursor: "pointer" }}><X size={20} /></button></div>
    <button className="btn g" onClick={async () => { try { await navigator.clipboard.writeText(link); setOk("Enlace copiado"); } catch { setOk(link); } await post({ accion: "compartir", id: p.id }); acc.upd(p.id, (x) => ({ ...x, compartidos: x.compartidos + 1 })); }}><Link2 size={16} />Copiar enlace</button>
    <div style={{ color: "#9fb0d0", fontSize: 13 }}>Enviar por VE WhatsApp</div>
    <div style={{ overflowY: "auto", maxHeight: 200 }}>{me.puedeCompartir && me.contactos.length ? me.contactos.map((c) => <div key={c.num} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}><span>{c.alias}</span><button className="btn" style={{ padding: "6px 12px" }} onClick={async () => { if (await post({ accion: "compartir", id: p.id, num: c.num })) { setOk(`Enviado a ${c.alias}`); acc.upd(p.id, (x) => ({ ...x, compartidos: x.compartidos + 1 })); } }}><Send size={14} />Enviar</button></div>) : <p style={{ color: "#9fb0d0" }}>{me.puedeCompartir ? "Agrega contactos en VE WhatsApp para compartirles publicaciones." : "Necesitas tu chip de VE WhatsApp para enviar a tus contactos."}</p>}</div>
    {ok && <div style={{ color: "#34d399", wordBreak: "break-all" }}>{ok}</div>}</div></>);
}

// ---- App ----
export default function TikVerp({ v }) {
  const [me, setMe] = useState(undefined), [vista, setVista] = useState("feed"), [t, setT] = useState("para"), [posts, setPosts] = useState([]), [fin, setFin] = useState(false), [mudo, setMudo] = useState(false), [h, setH] = useState(null), [com, setCom] = useState(null), [sh, setSh] = useState(null), [vis, setVis] = useState(null), [q, setQ] = useState(""), [pre, setPre] = useState(""), [tick, setTick] = useState(0), cargando = useRef(false);
  const cargarMe = async () => setMe(await api("m=me"));
  useEffect(() => { cargarMe(); }, []);
  const cargar = useCallback(async (reset) => {
    if (cargando.current) return; cargando.current = true; const ult = !reset && posts.at(-1);
    const j = await api(`m=feed&t=${t}${ult ? "&antes=" + +new Date(ult.at) : ""}${reset && v && t === "para" ? "&v=" + v : ""}`); cargando.current = false; if (!j) return;
    setPosts((l) => (reset ? j.posts : [...l, ...j.posts.filter((x) => !l.some((y) => y.id === x.id))])); setFin(j.fin);
  }, [t, posts, v]);
  useEffect(() => { if (me?.perfil) cargar(true); }, [t, me?.perfil?.uid]);
  const upd = (id, f) => { setPosts((l) => l.map((x) => (x.id === id ? f(x) : x))); setVis((x) => (x && x.id === id ? f(x) : x)); setSh((x) => (x && x.id === id ? f(x) : x)); };
  const acc = { staff: me?.staff, tick, upd, q, perfil: (hd) => { setVis(null); setH(hd); setVista("perfil"); },
    like: async (p) => { upd(p.id, (x) => ({ ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) })); if (!(await post({ accion: "like", id: p.id }))) upd(p.id, (x) => ({ ...x, liked: p.liked, likes: p.likes })); },
    seguir: async (hd) => { const j = await post({ accion: "seguir", handle: hd }); if (j) { setPosts((l) => l.map((x) => (x.handle === hd ? { ...x, sigue: j.sigue } : x))); setTick((k) => k + 1); } },
    com: (p) => setCom(p), share: (p) => setSh(p), tag: (x) => { setQ(x); setVista("buscar"); setVis(null); }, abrir: (p) => setVis(p),
    borrar: async (p) => { if (confirm("¿Borrar esta publicación?") && (await post({ accion: "borrar", id: p.id }))) { setPosts((l) => l.filter((x) => x.id !== p.id)); setVis(null); setTick((k) => k + 1); } } };
  if (me === undefined) return <div className="tv"><div className="tv-pg"><p style={{ color: "#9fb0d0" }}>Cargando...</p></div></div>;
  if (me === null) return <div className="tv"><div className="tv-pg"><p>No se pudo cargar TikVerp.</p></div></div>;
  if (!me.perfil) return <div className="tv"><Registro avatar={me.avatar} onOk={cargarMe} /></div>;
  const nav = [["feed", Home, "Inicio"], ["buscar", Search, "Buscar"], ["subir", Plus, ""], ["sonidos", Music, "Sonidos"], ["perfil", User, "Perfil"]];
  return (<div className="tv"><div className="tv-main">
    {vista === "feed" && <Feed lista={posts} mudo={mudo} setMudo={setMudo} acc={acc} mas={() => !fin && cargar(false)} tabs t={t} setT={setT} />}
    {vista === "buscar" && <Buscar acc={acc} />}
    {vista === "subir" && <Subir pre={pre} onOk={() => { setPre(""); setVista("feed"); cargar(true); setTick((k) => k + 1); }} />}
    {vista === "sonidos" && <Sonidos usar={(id) => { setPre(id); setVista("subir"); }} />}
    {vista === "perfil" && <Perfil h={h || me.perfil.handle} acc={acc} recargar={cargarMe} />}
    {vis && <div style={{ position: "absolute", inset: 0, zIndex: 8 }}><Item p={vis} mudo={mudo} setMudo={setMudo} acc={acc} /><button onClick={() => setVis(null)} aria-label="Cerrar" style={{ position: "absolute", top: 10, left: 10, zIndex: 9, background: "#000a", border: 0, color: "#fff", borderRadius: 99, padding: 8, cursor: "pointer" }}><X size={18} /></button></div>}
    {com && <Comentarios p={posts.find((x) => x.id === com.id) || vis || com} cerrar={() => setCom(null)} acc={acc} />}
    {sh && <Compartir p={sh} me={me} cerrar={() => setSh(null)} acc={acc} />}</div>
    <div className="tv-nav">{nav.map(([k, I, tx]) => <button key={k} className={(vista === k ? "on " : "") + (k === "subir" ? "mas" : "")} onClick={() => { setVis(null); if (k === "perfil") setH(null); if (k !== "subir") setPre(k === "sonidos" ? pre : ""); setVista(k); }}><I size={k === "subir" ? 22 : 22} />{tx}</button>)}</div></div>);
}
