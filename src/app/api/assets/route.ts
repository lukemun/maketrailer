import { listAssets } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") || undefined;
  const kindValue = url.searchParams.get("kind");
  const kind = kindValue === "image" || kindValue === "video" ? kindValue : undefined;
  return Response.json({ assets: await listAssets({ projectId, kind }) });
}

