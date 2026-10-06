import { NextResponse } from "next/server";
export async function POST(req) {
  const { token } = await req.json();
  const r = await (await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token }) })).json();
  if (!r.success) return NextResponse.json({ ok: false }, { status: 400 });
  const res = NextResponse.json({ ok: true }); res.cookies.set("cv", "1", { httpOnly: true, maxAge: 300, path: "/" }); return res;
}
