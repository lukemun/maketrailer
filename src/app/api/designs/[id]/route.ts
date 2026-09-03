import { getDesign, saveDesign } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return Response.json({ design: await getDesign((await context.params).id) });
  } catch {
    return Response.json({ error: "Design not found" }, { status: 404 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = (await context.params).id;
    const body = await request.json();
    if (body.id !== id) return Response.json({ error: "Design id mismatch" }, { status: 400 });
    return Response.json({ design: await saveDesign(body) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not save design" }, { status: 400 });
  }
}
