import { NextResponse } from "next/server";
export function GET(req) {
  if (!req.cookies.get("cv")) return NextResponse.redirect(new URL("/login", req.url));
  const u = new URL("https://discord.com/api/oauth2/authorize");
  u.search = new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, redirect_uri: process.env.DISCORD_REDIRECT_URI, response_type: "code", scope: "identify" });
  return NextResponse.redirect(u);
}
