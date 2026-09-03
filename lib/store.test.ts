import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createDesign, getDesign, listDesigns, patchDesign } from "./store";

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
