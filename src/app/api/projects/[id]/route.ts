import { getProject, patchProject } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return Response.json({ project: await getProject((await context.params).id) });
  } catch {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return Response.json({ project: await patchProject((await context.params).id, await request.json()) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not update project" }, { status: 400 });
  }
}

