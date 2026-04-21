#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const showHelp = process.argv.includes("--help") || process.argv.includes("-h");
if (showHelp) {
  console.log(`mulmoclaude: Vue (Vite) + Express dev starter\n\nUsage:\n  npx mulmoclaude\n\nEnvironment variables:\n  MULMOCLAUDE_VITE_PORT      (default: 5173)\n  MULMOCLAUDE_EXPRESS_PORT   (default: 3001)\n  MULMOCLAUDE_EXPRESS_HOST   (default: 127.0.0.1)`);
  process.exit(0);
}

const children = [];

const spawnService = (label, cmd, args, envExtra = {}) => {
  const child = spawn(cmd, args, {
    cwd: resolve(__dirname, ".."),
    env: { ...process.env, ...envExtra },
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${label}] ${chunk.toString()}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${label}] ${chunk.toString()}`);
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[mulmoclaude] ${label} exited with code ${code}`);
      shutdown(code);
    }
  });

  children.push(child);
};

const shutdown = (code = 0) => {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const vitePort = process.env.MULMOCLAUDE_VITE_PORT ?? "5173";
const expressPort = process.env.MULMOCLAUDE_EXPRESS_PORT ?? "3001";

console.log(`[mulmoclaude] Starting Vue(Vite) on :${vitePort} and Express on :${expressPort}`);

spawnService("vue", "npx", ["vite", "--config", "vite.renderer.config.ts", "--host", "127.0.0.1", "--port", vitePort]);
spawnService("express", "node", [resolve(__dirname, "dev-express-server.mjs")]);
