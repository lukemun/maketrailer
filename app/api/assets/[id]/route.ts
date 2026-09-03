import { getAsset, patchAsset } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return Response.json({ asset: await getAsset((await context.params).id) });
  } catch {
    return Response.json({ error: "Asset not found" }, { status: 404 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return Response.json({ asset: await patchAsset((await context.params).id, await request.json()) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not update asset" }, { status: 400 });
  }
}

