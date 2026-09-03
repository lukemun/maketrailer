import { createDesign, listDesigns } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId") || undefined;
  return Response.json({ designs: await listDesigns(projectId) });
}

export async function POST(request: Request) {
  try {
    return Response.json({ design: await createDesign(await request.json()) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not create design" }, { status: 400 });
  }
}
