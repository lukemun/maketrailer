import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const dataDirectory = await mkdtemp(path.join(os.tmpdir(), "maketrailer-ce-mcp-"));
const child = spawn("pnpm", ["--silent", "mcp"], {
  cwd: process.cwd(),
  env: { ...process.env, MAKETRAILER_DATA_DIR: dataDirectory },
  stdio: ["pipe", "pipe", "pipe"],
});

let stderr = "";
child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => { stderr += chunk; });
const lines = readline.createInterface({ input: child.stdout });

function send(value: unknown) {
  child.stdin.write(`${JSON.stringify(value)}\n`);
}

const completion = new Promise<void>((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`MCP smoke timeout\n${stderr}`)), 20_000);
  lines.on("line", (line) => {
    if (!line.trim()) return;
    const message = JSON.parse(line) as { id?: number; result?: { tools?: Array<{ name: string }>; structuredContent?: { design?: { id: string; name: string } } }; error?: unknown };
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    if (message.id === 1) {
      send({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
      send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    } else if (message.id === 2) {
      const names = message.result?.tools?.map((tool) => tool.name) || [];
      assert.ok(names.includes("create_design"));
      assert.ok(names.includes("generate_image"));
      assert.ok(names.includes("list_creative_skills"));
      send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "create_design", arguments: { name: "MCP smoke ad", preset: "instagram-square", template: "bold-offer" } } });
    } else if (message.id === 3) {
      assert.equal(message.result?.structuredContent?.design?.name, "MCP smoke ad");
      clearTimeout(timer);
      resolve();
    }
  });
  child.on("error", reject);
  child.on("exit", (code) => { if (code && code !== 0) reject(new Error(`MCP exited ${code}\n${stderr}`)); });
});

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "community-smoke", version: "1.0.0" } } });

try {
  await completion;
  console.log(JSON.stringify({ ok: true, tools: true, createDesign: true }));
} finally {
  child.kill("SIGTERM");
  lines.close();
  await rm(dataDirectory, { recursive: true, force: true });
}
