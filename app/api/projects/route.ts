import { createProject, listProjects } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ projects: await listProjects() });
}

export async function POST(request: Request) {
  try {
    return Response.json({ project: await createProject(await request.json()) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not create project" }, { status: 400 });
  }
}

