import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  PRESETS,
  createDesignSchema,
  designSchema,
  type CreateDesignInput,
  type Design,
  type DesignElement,
} from "./schema";

export function dataDirectory(): string {
  return path.resolve(process.env.MAKETRAILER_DATA_DIR || path.join(process.cwd(), ".maketrailer"));
}

function designsDirectory(): string {
  return path.join(dataDirectory(), "designs");
}

export function mediaDirectory(): string {
  return path.join(dataDirectory(), "media");
}

function safeId(value: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error("Invalid identifier");
  return value;
}

function designPath(id: string): string {
  return path.join(designsDirectory(), `${safeId(id)}.json`);
}

async function ensureDirectories(): Promise<void> {
  await Promise.all([
    mkdir(designsDirectory(), { recursive: true }),
    mkdir(mediaDirectory(), { recursive: true }),
  ]);
}

async function atomicJsonWrite(file: string, value: unknown): Promise<void> {
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, file);
}

export async function listDesigns(): Promise<Design[]> {
  await ensureDirectories();
  const files = (await readdir(designsDirectory())).filter((file) => file.endsWith(".json"));
  const values = await Promise.all(files.map(async (file) => {
    try {
      return designSchema.parse(JSON.parse(await readFile(path.join(designsDirectory(), file), "utf8")));
    } catch {
      return null;
    }
  }));
  return values.filter((value): value is Design => value !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDesign(id: string): Promise<Design> {
  await ensureDirectories();
  return designSchema.parse(JSON.parse(await readFile(designPath(id), "utf8")));
}

function templateElements(template: CreateDesignInput["template"], width: number, height: number): DesignElement[] {
  if (template === "blank") return [];
  if (template === "testimonial") {
    return [
      { id: randomUUID(), type: "shape", x: width * 0.08, y: height * 0.08, width: width * 0.84, height: height * 0.84, rotation: 0, opacity: 1, fill: "#fff8ee", radius: 48 },
      { id: randomUUID(), type: "text", x: width * 0.14, y: height * 0.2, width: width * 0.72, height: height * 0.42, rotation: 0, opacity: 1, text: "“This changed how I do the work.”", color: "#17120f", fontSize: Math.round(width * 0.064), fontWeight: 700, align: "left" },
      { id: randomUUID(), type: "text", x: width * 0.14, y: height * 0.7, width: width * 0.62, height: height * 0.1, rotation: 0, opacity: 1, text: "— Your customer", color: "#6d3f2a", fontSize: Math.round(width * 0.03), fontWeight: 600, align: "left" },
    ];
  }
  return [
    { id: randomUUID(), type: "shape", x: width * 0.06, y: height * 0.06, width: width * 0.88, height: height * 0.88, rotation: 0, opacity: 1, fill: "#f15a29", radius: 48 },
    { id: randomUUID(), type: "text", x: width * 0.1, y: height * 0.14, width: width * 0.8, height: height * 0.3, rotation: 0, opacity: 1, text: "MAKE THE OFFER\nIMPOSSIBLE TO MISS", color: "#ffffff", fontSize: Math.round(width * 0.064), fontWeight: 800, align: "left" },
    { id: randomUUID(), type: "text", x: width * 0.12, y: height * 0.83, width: width * 0.68, height: height * 0.1, rotation: 0, opacity: 1, text: "Add the reason to act now →", color: "#17120f", fontSize: Math.round(width * 0.034), fontWeight: 700, align: "left" },
  ];
}

export async function createDesign(input: unknown): Promise<Design> {
  await ensureDirectories();
  const parsed = createDesignSchema.parse(input);
  const preset = PRESETS[parsed.preset];
  const now = new Date().toISOString();
  const design: Design = {
    id: randomUUID(),
    name: parsed.name,
    width: preset.width,
    height: preset.height,
    background: "#f5efe7",
    elements: templateElements(parsed.template, preset.width, preset.height),
    createdAt: now,
    updatedAt: now,
  };
  await atomicJsonWrite(designPath(design.id), design);
  return design;
}

export async function saveDesign(input: unknown): Promise<Design> {
  await ensureDirectories();
  const parsed = designSchema.parse({ ...(input as object), updatedAt: new Date().toISOString() });
  await atomicJsonWrite(designPath(parsed.id), parsed);
  return parsed;
}

export async function patchDesign(id: string, patch: Partial<Design>): Promise<Design> {
  const current = await getDesign(id);
  return saveDesign({ ...current, ...patch, id: current.id, createdAt: current.createdAt });
}

export async function addElement(id: string, element: DesignElement): Promise<Design> {
  const design = await getDesign(id);
  return saveDesign({ ...design, elements: [...design.elements, element] });
}

export async function updateElement(id: string, elementId: string, patch: Record<string, unknown>): Promise<Design> {
  const design = await getDesign(id);
  const index = design.elements.findIndex((element) => element.id === elementId);
  if (index < 0) throw new Error("Element not found");
  const elements = [...design.elements];
  elements[index] = { ...elements[index], ...patch, id: elementId } as DesignElement;
  return saveDesign({ ...design, elements });
}

export async function deleteElement(id: string, elementId: string): Promise<Design> {
  const design = await getDesign(id);
  return saveDesign({ ...design, elements: design.elements.filter((element) => element.id !== elementId) });
}

export async function storeMedia(bytes: Uint8Array, extension: string): Promise<string> {
  await ensureDirectories();
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!new Set(["png", "jpg", "jpeg", "webp", "gif"]).has(safeExtension)) throw new Error("Unsupported image type");
  if (bytes.byteLength > 20 * 1024 * 1024) throw new Error("Image exceeds 20 MB");
  const name = `${randomUUID()}.${safeExtension}`;
  await writeFile(path.join(mediaDirectory(), name), bytes, { mode: 0o600 });
  return `/api/media/${name}`;
}

export function resolveMediaPath(name: string): string {
  if (!/^[a-f0-9-]+\.(png|jpe?g|webp|gif)$/i.test(name)) throw new Error("Invalid media name");
  return path.join(mediaDirectory(), name);
}
