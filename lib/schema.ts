import { z } from "zod";

const baseElementSchema = z.object({
  id: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().finite().default(0),
  opacity: z.number().min(0).max(1).default(1),
});

export const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  text: z.string().max(4000),
  color: z.string().max(64).default("#111111"),
  fontSize: z.number().min(8).max(300).default(48),
  fontWeight: z.number().min(100).max(900).default(700),
  align: z.enum(["left", "center", "right"]).default("left"),
});

export const shapeElementSchema = baseElementSchema.extend({
  type: z.literal("shape"),
  fill: z.string().max(64).default("#f15a29"),
  radius: z.number().min(0).max(999).default(24),
});

export const imageElementSchema = baseElementSchema.extend({
  type: z.literal("image"),
  src: z.string().max(2048),
  alt: z.string().max(500).default(""),
  fit: z.enum(["cover", "contain"]).default("cover"),
});

export const designElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  shapeElementSchema,
  imageElementSchema,
]);

export const designSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  projectId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1).max(160),
  width: z.number().int().min(240).max(4096),
  height: z.number().int().min(240).max(4096),
  background: z.string().max(64),
  elements: z.array(designElementSchema).max(500),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createDesignSchema = z.object({
  name: z.string().trim().min(1).max(160).default("Untitled ad"),
  projectId: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional(),
  preset: z.enum(["instagram-square", "instagram-story", "facebook-feed", "linkedin-feed"]).default("instagram-square"),
  template: z.enum(["blank", "bold-offer", "testimonial"]).default("bold-offer"),
});

export type Design = z.infer<typeof designSchema>;
export type DesignElement = z.infer<typeof designElementSchema>;
export type TextElement = z.infer<typeof textElementSchema>;
export type ShapeElement = z.infer<typeof shapeElementSchema>;
export type ImageElement = z.infer<typeof imageElementSchema>;
export type CreateDesignInput = z.infer<typeof createDesignSchema>;

export const projectSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).default(""),
});

export const assetSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  projectId: z.string().regex(/^[a-zA-Z0-9_-]+$/).nullable(),
  kind: z.enum(["image", "video"]),
  src: z.string().max(2048),
  filename: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(160),
  favorite: z.boolean().default(false),
  labels: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Project = z.infer<typeof projectSchema>;
export type Asset = z.infer<typeof assetSchema>;

export const PRESETS = {
  "instagram-square": { label: "Instagram square", width: 1080, height: 1080 },
  "instagram-story": { label: "Story / Reel", width: 1080, height: 1920 },
  "facebook-feed": { label: "Facebook feed", width: 1200, height: 1500 },
  "linkedin-feed": { label: "LinkedIn feed", width: 1200, height: 1200 },
} as const;
