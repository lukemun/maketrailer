import { createAsset, getDesign, saveDesign } from "./store";
import type { ImageElement } from "./schema";
import { randomUUID } from "node:crypto";

const MODEL = "fal-ai/flux/schnell";

function falKey(): string {
  const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!key) throw new Error("Add FAL_KEY to .env.local before generating an image.");
  return key;
}

export function falConfigured(): boolean {
  return Boolean(process.env.FAL_KEY || process.env.FAL_API_KEY);
}

export async function generateImage(designId: string, prompt: string): Promise<{ design: Awaited<ReturnType<typeof getDesign>>; src: string; model: string }> {
  if (!prompt.trim()) throw new Error("Prompt is required");
  const design = await getDesign(designId);
  const response = await fetch(`https://fal.run/${MODEL}`, {
    method: "POST",
    headers: { authorization: `Key ${falKey()}`, "content-type": "application/json" },
    body: JSON.stringify({ prompt: prompt.trim(), image_size: "square_hd", num_images: 1, enable_safety_checker: true }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`fal generation failed (${response.status})`);
  const result = await response.json() as { images?: Array<{ url?: string; content_type?: string }> };
  const remote = result.images?.[0];
  if (!remote?.url) throw new Error("fal returned no image");
  const imageResponse = await fetch(remote.url, { signal: AbortSignal.timeout(60_000) });
  if (!imageResponse.ok) throw new Error("Could not download generated image");
  const bytes = new Uint8Array(await imageResponse.arrayBuffer());
  const contentType = imageResponse.headers.get("content-type") || remote.content_type || "image/png";
  const extension = contentType.includes("webp") ? "webp" : contentType.includes("jpeg") ? "jpg" : "png";
  const asset = await createAsset({
    bytes,
    extension,
    filename: `Generated image.${extension}`,
    mimeType: contentType,
    projectId: design.projectId,
    kind: "image",
  });
  const src = asset.src;
  const element: ImageElement = {
    id: randomUUID(), type: "image", src, alt: prompt.trim(), fit: "cover",
    x: design.width * 0.18, y: design.height * 0.43, width: design.width * 0.64, height: design.height * 0.32,
    rotation: 0, opacity: 1,
  };
  const firstText = design.elements.findIndex((candidate) => candidate.type === "text");
  const insertAt = firstText < 0 ? design.elements.length : firstText;
  const elements = [...design.elements];
  elements.splice(insertAt, 0, element);
  return { design: await saveDesign({ ...design, elements }), src, model: MODEL };
}
