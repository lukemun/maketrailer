import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createAsset, createDesign, createProject, getDesign, listAssets, listDesigns, listProjects, patchDesign } from "./store";

let directory = "";
afterEach(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });

test("creates, updates, and reloads a local design", async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "maketrailer-ce-test-"));
  process.env.MAKETRAILER_DATA_DIR = directory;
  const created = await createDesign({ name: "Local ad", preset: "instagram-story", template: "testimonial" });
  assert.equal(created.height, 1920);
  await patchDesign(created.id, { name: "Renamed ad" });
  assert.equal((await getDesign(created.id)).name, "Renamed ad");
  assert.equal((await listDesigns()).length, 1);
});

test("organizes designs and reusable assets by project", async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "maketrailer-project-test-"));
  process.env.MAKETRAILER_DATA_DIR = directory;
  const project = await createProject({ name: "Autumn campaign" });
  const design = await createDesign({ name: "Launch ad", projectId: project.id, preset: "instagram-square", template: "blank" });
  const asset = await createAsset({
    bytes: new Uint8Array([137, 80, 78, 71]),
    extension: "png",
    filename: "product.png",
    mimeType: "image/png",
    projectId: project.id,
  });
  assert.equal(design.projectId, project.id);
  assert.equal(asset.projectId, project.id);
  assert.equal((await listDesigns(project.id)).length, 1);
  assert.equal((await listAssets({ projectId: project.id })).length, 1);
  assert.ok((await listProjects()).some((candidate) => candidate.id === project.id));
});
