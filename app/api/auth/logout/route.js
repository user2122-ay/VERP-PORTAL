import { NextResponse } from "next/server";
export function GET(req) { const r = NextResponse.redirect(new URL("/login", req.url)); r.cookies.delete("s"); return r; }
