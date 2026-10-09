const NS = { cache: "no-store" };
export const validName = (s) => /^[A-Za-z0-9_]{3,20}$/.test(s);
export async function findUser(name) {
  const r = await fetch("https://users.roblox.com/v1/usernames/users", { ...NS, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usernames: [name], excludeBannedUsers: true }) });
  if (!r.ok) return null;
  const u = (await r.json()).data?.[0];
  return u ? { id: u.id, name: u.name } : null;
}
export async function getBio(id) {
  const r = await fetch(`https://users.roblox.com/v1/users/${id}`, NS);
  if (!r.ok) return null;
  return (await r.json()).description || "";
}
// Busto del avatar (cabeza y pecho). El fondo es transparente; se pone blanco en pantalla.
export async function getBust(id) {
  const r = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${id}&size=150x150&format=Png&isCircular=false`, NS);
  if (!r.ok) return null;
  return (await r.json()).data?.[0]?.imageUrl || null;
}
// Cuerpo completo del avatar (para el sistema de comida y agua del Panel).
export async function getFull(id) {
  try { const r = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=420x420&format=Png&isCircular=false`, NS); if (!r.ok) return null; return (await r.json()).data?.[0]?.imageUrl || null; } catch { return null; }
}
