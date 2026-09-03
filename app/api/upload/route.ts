import { storeMedia } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Image file required" }, { status: 400 });
    if (!file.type.startsWith("image/")) return Response.json({ error: "Only image files are supported" }, { status: 400 });
    const extension = file.type.includes("webp") ? "webp" : file.type.includes("jpeg") ? "jpg" : file.type.includes("gif") ? "gif" : "png";
    return Response.json({ src: await storeMedia(new Uint8Array(await file.arrayBuffer()), extension) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
