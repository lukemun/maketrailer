import { falConfigured, generateImage } from "@/lib/fal";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET() {
  return Response.json({ configured: falConfigured(), provider: "fal.ai", model: "fal-ai/flux/schnell" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { designId?: string; prompt?: string };
    if (!body.designId || !body.prompt) return Response.json({ error: "designId and prompt are required" }, { status: 400 });
    return Response.json(await generateImage(body.designId, body.prompt));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 400 });
  }
}
