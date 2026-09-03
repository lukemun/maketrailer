import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { addElement, createDesign, deleteElement, getDesign, listDesigns, patchDesign, updateElement } from "../lib/store";
import { generateImage } from "../lib/fal";
import { designElementSchema } from "../lib/schema";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const server = new McpServer({ name: "maketrailer-community", version: "0.1.0" }, { capabilities: { tools: {}, prompts: {}, resources: {} } });

function result(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }], structuredContent: value as Record<string, unknown> };
}

server.registerTool("list_designs", { title: "List designs", description: "List designs stored in the local MakeTrailer data directory." }, async () => result({ designs: await listDesigns() }));
server.registerTool("get_design", { title: "Get design", description: "Read one local design and all of its editable layers.", inputSchema: z.object({ designId: z.string() }) }, async ({ designId }) => result({ design: await getDesign(designId) }));
server.registerTool("create_design", { title: "Create design", description: "Create a local ad design from a standard format and starting layout.", inputSchema: z.object({ name: z.string(), preset: z.enum(["instagram-square", "instagram-story", "facebook-feed", "linkedin-feed"]).default("instagram-square"), template: z.enum(["blank", "bold-offer", "testimonial"]).default("bold-offer") }) }, async (input) => result({ design: await createDesign(input) }));
server.registerTool("update_design", { title: "Update design", description: "Update a design name or canvas background.", inputSchema: z.object({ designId: z.string(), name: z.string().optional(), background: z.string().optional() }) }, async ({ designId, name, background }) => result({ design: await patchDesign(designId, { ...(name ? { name } : {}), ...(background ? { background } : {}) }) }));
server.registerTool("add_element", { title: "Add design element", description: "Add a text, image, or shape layer. Geometry uses full-resolution canvas pixels.", inputSchema: z.object({ designId: z.string(), element: z.record(z.string(), z.unknown()) }) }, async ({ designId, element }) => {
  const parsed = designElementSchema.parse({ ...element, id: typeof element.id === "string" ? element.id : randomUUID() });
  return result({ design: await addElement(designId, parsed), element: parsed });
});
server.registerTool("update_element", { title: "Update design element", description: "Patch editable properties on one layer.", inputSchema: z.object({ designId: z.string(), elementId: z.string(), patch: z.record(z.string(), z.unknown()) }) }, async ({ designId, elementId, patch }) => result({ design: await updateElement(designId, elementId, patch) }));
server.registerTool("delete_element", { title: "Delete design element", description: "Delete one layer from a local design.", inputSchema: z.object({ designId: z.string(), elementId: z.string() }), annotations: { destructiveHint: true } }, async ({ designId, elementId }) => result({ design: await deleteElement(designId, elementId) }));
server.registerTool("generate_image", { title: "Generate image", description: "Generate an image with the user's server-side fal key, download it locally, and add it to the design.", inputSchema: z.object({ designId: z.string(), prompt: z.string().min(1) }) }, async ({ designId, prompt }) => result(await generateImage(designId, prompt)));
server.registerTool("list_creative_skills", { title: "List creative skills", description: "List the portable prompt-writing and visual-composition skills bundled with Community Edition." }, async () => result({ skills: [{ name: "ad-image-prompt-writing", path: path.resolve("skills/ad-image-prompt-writing/SKILL.md") }, { name: "ad-visual-composition", path: path.resolve("skills/ad-visual-composition/SKILL.md") }] }));

for (const skill of ["ad-image-prompt-writing", "ad-visual-composition"]) {
  const uri = `maketrailer://skills/${skill}`;
  server.registerResource(skill, uri, { title: skill, description: `Bundled ${skill} instructions`, mimeType: "text/markdown" }, async () => ({ contents: [{ uri, mimeType: "text/markdown", text: await readFile(path.resolve("skills", skill, "SKILL.md"), "utf8") }] }));
}

server.registerPrompt("make_ad_design", { title: "Make an ad design", description: "Plan and build an editable ad using MakeTrailer's bundled creative methods.", argsSchema: z.object({ product: z.string(), audience: z.string(), offer: z.string(), format: z.string().default("Instagram square") }) }, ({ product, audience, offer, format }) => ({ messages: [{ role: "user" as const, content: { type: "text" as const, text: `Use the ad-image-prompt-writing and ad-visual-composition resources. Create an editable ${format} design for ${product}, aimed at ${audience}, with this offer: ${offer}. Keep critical copy as text layers, use generate_image only for visual material, and inspect the final design before reporting completion.` } }] }));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`MakeTrailer Community MCP is using ${process.env.MAKETRAILER_DATA_DIR || path.resolve(".maketrailer")}`);
