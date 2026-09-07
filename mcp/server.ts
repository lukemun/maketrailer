import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  addElement,
  createDesign,
  createProject,
  deleteElement,
  getAsset,
  getDesign,
  getProject,
  listAssets,
  listDesigns,
  listProjects,
  patchAsset,
  patchDesign,
  patchProject,
  updateElement,
} from "../src/lib/store";
import { generateImage } from "../src/lib/fal";
import { designElementSchema } from "../src/lib/schema";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const server = new McpServer({ name: "maketrailer", version: "0.1.0" }, { capabilities: { tools: {}, prompts: {}, resources: {} } });

function result(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }], structuredContent: value as Record<string, unknown> };
}

server.registerTool("list_projects", { title: "List projects", description: "List local MakeTrailer projects." }, async () => result({ projects: await listProjects() }));
server.registerTool("get_project", { title: "Get project", description: "Read one local project.", inputSchema: z.object({ projectId: z.string() }) }, async ({ projectId }) => result({ project: await getProject(projectId) }));
server.registerTool("create_project", { title: "Create project", description: "Create a local project for designs and reusable assets.", inputSchema: z.object({ name: z.string(), description: z.string().default("") }) }, async (input) => result({ project: await createProject(input) }));
server.registerTool("update_project", { title: "Update project", description: "Update a local project's name or description.", inputSchema: z.object({ projectId: z.string(), name: z.string().optional(), description: z.string().optional() }) }, async ({ projectId, ...patch }) => result({ project: await patchProject(projectId, patch) }));
server.registerTool("list_assets", { title: "List assets", description: "List reusable local image and video assets, optionally filtered by project or kind.", inputSchema: z.object({ projectId: z.string().optional(), kind: z.enum(["image", "video"]).optional() }) }, async (filters) => result({ assets: await listAssets(filters) }));
server.registerTool("get_asset", { title: "Get asset", description: "Read one reusable local asset and its metadata.", inputSchema: z.object({ assetId: z.string() }) }, async ({ assetId }) => result({ asset: await getAsset(assetId) }));
server.registerTool("update_asset", { title: "Update asset", description: "Change an asset's project, favorite state, labels, or filename.", inputSchema: z.object({ assetId: z.string(), projectId: z.string().nullable().optional(), favorite: z.boolean().optional(), labels: z.array(z.string()).optional(), filename: z.string().optional() }) }, async ({ assetId, ...patch }) => result({ asset: await patchAsset(assetId, patch) }));
server.registerTool("list_designs", { title: "List designs", description: "List designs stored in the local MakeTrailer data directory, optionally filtered by project.", inputSchema: z.object({ projectId: z.string().optional() }) }, async ({ projectId }) => result({ designs: await listDesigns(projectId) }));
server.registerTool("get_design", { title: "Get design", description: "Read one local design and all of its editable layers.", inputSchema: z.object({ designId: z.string() }) }, async ({ designId }) => result({ design: await getDesign(designId) }));
server.registerTool("create_design", { title: "Create design", description: "Create a local ad design inside a project from a standard format and starting layout.", inputSchema: z.object({ name: z.string(), projectId: z.string().optional(), preset: z.enum(["instagram-square", "instagram-story", "facebook-feed", "linkedin-feed"]).default("instagram-square"), template: z.enum(["blank", "bold-offer", "testimonial"]).default("bold-offer") }) }, async (input) => result({ design: await createDesign(input) }));
server.registerTool("update_design", { title: "Update design", description: "Update a design name or canvas background.", inputSchema: z.object({ designId: z.string(), name: z.string().optional(), background: z.string().optional() }) }, async ({ designId, name, background }) => result({ design: await patchDesign(designId, { ...(name ? { name } : {}), ...(background ? { background } : {}) }) }));
server.registerTool("add_element", { title: "Add design element", description: "Add a text, image, or shape layer. Geometry uses full-resolution canvas pixels.", inputSchema: z.object({ designId: z.string(), element: z.record(z.string(), z.unknown()) }) }, async ({ designId, element }) => {
  const parsed = designElementSchema.parse({ ...element, id: typeof element.id === "string" ? element.id : randomUUID() });
  return result({ design: await addElement(designId, parsed), element: parsed });
});
server.registerTool("update_element", { title: "Update design element", description: "Patch editable properties on one layer.", inputSchema: z.object({ designId: z.string(), elementId: z.string(), patch: z.record(z.string(), z.unknown()) }) }, async ({ designId, elementId, patch }) => result({ design: await updateElement(designId, elementId, patch) }));
server.registerTool("delete_element", { title: "Delete design element", description: "Delete one layer from a local design.", inputSchema: z.object({ designId: z.string(), elementId: z.string() }), annotations: { destructiveHint: true } }, async ({ designId, elementId }) => result({ design: await deleteElement(designId, elementId) }));
server.registerTool("generate_image", { title: "Generate image", description: "Generate an image with the user's server-side fal key, download it locally, and add it to the design.", inputSchema: z.object({ designId: z.string(), prompt: z.string().min(1) }) }, async ({ designId, prompt }) => result(await generateImage(designId, prompt)));
server.registerTool("list_creative_skills", { title: "List creative skills", description: "List the portable prompt-writing and visual-composition skills bundled with MakeTrailer." }, async () => result({ skills: [{ name: "ad-image-prompt-writing", path: path.resolve("skills/ad-image-prompt-writing/SKILL.md") }, { name: "ad-visual-composition", path: path.resolve("skills/ad-visual-composition/SKILL.md") }] }));

for (const skill of ["ad-image-prompt-writing", "ad-visual-composition"]) {
  const uri = `maketrailer://skills/${skill}`;
  server.registerResource(skill, uri, { title: skill, description: `Bundled ${skill} instructions`, mimeType: "text/markdown" }, async () => ({ contents: [{ uri, mimeType: "text/markdown", text: await readFile(path.resolve("skills", skill, "SKILL.md"), "utf8") }] }));
}

server.registerPrompt("make_ad_design", { title: "Make an ad design", description: "Plan and build an editable ad using MakeTrailer's bundled creative methods.", argsSchema: z.object({ product: z.string(), audience: z.string(), offer: z.string(), format: z.string().default("Instagram square") }) }, ({ product, audience, offer, format }) => ({ messages: [{ role: "user" as const, content: { type: "text" as const, text: `Use the ad-image-prompt-writing and ad-visual-composition resources. Create an editable ${format} design for ${product}, aimed at ${audience}, with this offer: ${offer}. Keep critical copy as text layers, use generate_image only for visual material, and inspect the final design before reporting completion.` } }] }));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`MakeTrailer MCP is using ${process.env.MAKETRAILER_DATA_DIR || path.resolve(".maketrailer")}`);
