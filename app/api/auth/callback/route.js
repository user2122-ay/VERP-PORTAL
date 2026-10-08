import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sign } from "@/lib/auth";
import { rankFromRoles } from "@/lib/roles";
import { flagsDe } from "@/lib/rol";
export async function GET(req) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login", req.url));
  const t = await (await fetch("https://discord.com/api/oauth2/token", { method: "POST", body: new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, client_secret: process.env.DISCORD_CLIENT_SECRET, grant_type: "authorization_code", code, redirect_uri: process.env.DISCORD_REDIRECT_URI }) })).json();
  if (!t.access_token) return NextResponse.redirect(new URL("/login", req.url));
  const d = await (await fetch("https://discord.com/api/users/@me", { headers: { Authorization: "Bearer " + t.access_token } })).json();
  // El bot solo comprueba que el usuario esté en el Discord. Más adelante: sincronizar roles.
  const m = await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${d.id}`, { headers: { Authorization: "Bot " + process.env.DISCORD_BOT_TOKEN } });
  if (!m.ok) return new NextResponse("Debes estar en el Discord de VE:RP para entrar.", { status: 403 });
  const mj = await m.json().catch(() => ({}));
  const devNames = (process.env.DEVELOPER_USERNAMES ?? "itsanthony_21").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean), devIds = (process.env.DEVELOPER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean), un = String(d.username).toLowerCase();
  let dev = devIds.includes(d.id);
  if (!dev && devNames.includes(un)) { const pin = await (await db()).collection("config").findOneAndUpdate({ _id: "dev:" + un }, { $setOnInsert: { id: d.id, at: new Date() } }, { upsert: true, returnDocument: "after" }); dev = pin?.id === d.id; }
  const avatar = d.avatar ? `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png` : null;
  await (await db()).collection("users").updateOne({ id: d.id }, { $set: { id: d.id, name: d.username, avatar, rank: rankFromRoles(mj.roles), ...flagsDe(mj.roles), dev }, $setOnInsert: { balance: 5000, inventory: [], createdAt: new Date() } }, { upsert: true });
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("s", await sign({ id: d.id }), { httpOnly: true, secure: true, sameSite: "lax", maxAge: 604800, path: "/" });
  res.cookies.delete("cv"); return res;
}
