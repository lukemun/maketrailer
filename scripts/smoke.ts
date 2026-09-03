import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const directory = await mkdtemp(path.join(os.tmpdir(), "maketrailer-ce-smoke-"));
process.env.MAKETRAILER_DATA_DIR = directory;
const store = await import("../lib/store");

try {
  const created = await store.createDesign({ name: "Smoke test ad", preset: "instagram-square", template: "bold-offer" });
  assert.equal(created.name, "Smoke test ad");
  assert.ok(created.elements.length >= 2);
  const reloaded = await store.getDesign(created.id);
  assert.equal(reloaded.id, created.id);
  const updated = await store.patchDesign(created.id, { background: "#ffffff" });
  assert.equal(updated.background, "#ffffff");
  assert.equal((await store.listDesigns()).length, 1);
  console.log(JSON.stringify({ ok: true, designId: created.id, layers: created.elements.length }));
} finally {
  await rm(directory, { recursive: true, force: true });
}
