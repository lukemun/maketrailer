import { readFile } from "node:fs/promises";
import { resolveMediaPath } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  try {
    const name = (await context.params).name;
    const bytes = await readFile(resolveMediaPath(name));
    const type = name.endsWith(".webp") ? "image/webp" : name.endsWith(".gif") ? "image/gif" : name.match(/\.jpe?g$/) ? "image/jpeg" : "image/png";
    return new Response(bytes, { headers: { "content-type": type, "cache-control": "private, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
