import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  PRESETS,
  assetSchema,
  createDesignSchema,
  createProjectSchema,
  designSchema,
  projectSchema,
  type Asset,
  type CreateDesignInput,
  type Design,
  type DesignElement,
  type Project,
} from "./schema";

export const DEFAULT_PROJECT_ID = "local";

export function dataDirectory(): string {
  return path.resolve(process.env.MAKETRAILER_DATA_DIR || path.join(process.cwd(), ".maketrailer"));
}

function designsDirectory(): string {
  return path.join(dataDirectory(), "designs");
}

function projectsDirectory(): string {
  return path.join(dataDirectory(), "projects");
}

function assetsDirectory(): string {
  return path.join(dataDirectory(), "assets");
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

function projectPath(id: string): string {
  return path.join(projectsDirectory(), `${safeId(id)}.json`);
}

function assetPath(id: string): string {
  return path.join(assetsDirectory(), `${safeId(id)}.json`);
}

async function ensureDirectories(): Promise<void> {
  await Promise.all([
    mkdir(designsDirectory(), { recursive: true }),
    mkdir(projectsDirectory(), { recursive: true }),
    mkdir(assetsDirectory(), { recursive: true }),
    mkdir(mediaDirectory(), { recursive: true }),
  ]);
  try {
    await readFile(projectPath(DEFAULT_PROJECT_ID), "utf8");
  } catch {
    const now = new Date().toISOString();
    await atomicJsonWrite(projectPath(DEFAULT_PROJECT_ID), {
      id: DEFAULT_PROJECT_ID,
      name: "My projects",
      description: "Default workspace for designs created before project organization was enabled.",
      createdAt: now,
      updatedAt: now,
    });
  }
}

async function atomicJsonWrite(file: string, value: unknown): Promise<void> {
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, file);
}

async function parseStoredDesign(file: string): Promise<Design> {
  const raw = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
  const migrated = raw.projectId ? raw : { ...raw, projectId: DEFAULT_PROJECT_ID };
  const design = designSchema.parse(migrated);
  if (!raw.projectId) await atomicJsonWrite(file, design);
  return design;
}

export async function listDesigns(projectId?: string): Promise<Design[]> {
  await ensureDirectories();
  const files = (await readdir(designsDirectory())).filter((file) => file.endsWith(".json"));
  const values = await Promise.all(files.map(async (file) => {
    try {
      return await parseStoredDesign(path.join(designsDirectory(), file));
    } catch {
      return null;
    }
  }));
  return values.filter((value): value is Design => value !== null)
    .filter((value) => !projectId || value.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDesign(id: string): Promise<Design> {
  await ensureDirectories();
  return parseStoredDesign(designPath(id));
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
  const projectId = parsed.projectId ?? DEFAULT_PROJECT_ID;
  await getProject(projectId);
  const preset = PRESETS[parsed.preset];
  const now = new Date().toISOString();
  const design: Design = {
    id: randomUUID(),
    projectId,
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

export async function listProjects(): Promise<Project[]> {
  await ensureDirectories();
  const files = (await readdir(projectsDirectory())).filter((file) => file.endsWith(".json"));
  const values = await Promise.all(files.map(async (file) => {
    try {
      return projectSchema.parse(JSON.parse(await readFile(path.join(projectsDirectory(), file), "utf8")));
    } catch {
      return null;
    }
  }));
  return values.filter((value): value is Project => value !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(id: string): Promise<Project> {
  await ensureDirectories();
  return projectSchema.parse(JSON.parse(await readFile(projectPath(id), "utf8")));
}

export async function createProject(input: unknown): Promise<Project> {
  await ensureDirectories();
  const parsed = createProjectSchema.parse(input);
  const now = new Date().toISOString();
  const project = projectSchema.parse({
    id: randomUUID(),
    ...parsed,
    createdAt: now,
    updatedAt: now,
  });
  await atomicJsonWrite(projectPath(project.id), project);
  return project;
}

export async function patchProject(id: string, patch: Partial<Pick<Project, "name" | "description">>): Promise<Project> {
  const current = await getProject(id);
  const project = projectSchema.parse({ ...current, ...patch, id: current.id, updatedAt: new Date().toISOString() });
  await atomicJsonWrite(projectPath(project.id), project);
  return project;
}

export async function listAssets(filters: { projectId?: string; kind?: Asset["kind"] } = {}): Promise<Asset[]> {
  await ensureDirectories();
  const files = (await readdir(assetsDirectory())).filter((file) => file.endsWith(".json"));
  const values = await Promise.all(files.map(async (file) => {
    try {
      return assetSchema.parse(JSON.parse(await readFile(path.join(assetsDirectory(), file), "utf8")));
    } catch {
      return null;
    }
  }));
  return values.filter((value): value is Asset => value !== null)
    .filter((value) => !filters.projectId || value.projectId === filters.projectId)
    .filter((value) => !filters.kind || value.kind === filters.kind)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getAsset(id: string): Promise<Asset> {
  await ensureDirectories();
  return assetSchema.parse(JSON.parse(await readFile(assetPath(id), "utf8")));
}

export async function createAsset(input: {
  bytes: Uint8Array;
  extension: string;
  filename: string;
  mimeType: string;
  projectId?: string | null;
  kind?: Asset["kind"];
}): Promise<Asset> {
  const projectId = input.projectId ?? null;
  if (projectId) await getProject(projectId);
  const src = await storeMedia(input.bytes, input.extension);
  const now = new Date().toISOString();
  const asset = assetSchema.parse({
    id: randomUUID(),
    projectId,
    kind: input.kind ?? "image",
    src,
    filename: input.filename,
    mimeType: input.mimeType,
    favorite: false,
    labels: [],
    createdAt: now,
    updatedAt: now,
  });
  await atomicJsonWrite(assetPath(asset.id), asset);
  return asset;
}

export async function patchAsset(id: string, patch: Partial<Pick<Asset, "projectId" | "favorite" | "labels" | "filename">>): Promise<Asset> {
  const current = await getAsset(id);
  if (patch.projectId) await getProject(patch.projectId);
  const asset = assetSchema.parse({ ...current, ...patch, id: current.id, updatedAt: new Date().toISOString() });
  await atomicJsonWrite(assetPath(asset.id), asset);
  return asset;
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
