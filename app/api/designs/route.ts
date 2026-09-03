import { createDesign, listDesigns } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ designs: await listDesigns() });
}

export async function POST(request: Request) {
  try {
    return Response.json({ design: await createDesign(await request.json()) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not create design" }, { status: 400 });
  }
}
