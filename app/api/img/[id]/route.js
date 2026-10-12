import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
// Sirve las fotos guardadas en la base de datos (no vencen como los links de Discord).
export async function GET(_req, { params }) {
  const id = String(params.id || "").replace(/[^a-f0-9]/gi, "").slice(0, 40), x = id && (await (await db()).collection("imgs").findOne({ _id: id }));
  if (!x) return new Response("No existe", { status: 404 });
  return new Response(Buffer.from(x.data.buffer ?? x.data), { headers: { "Content-Type": x.mime, "Cache-Control": "public, max-age=31536000, immutable" } });
}
