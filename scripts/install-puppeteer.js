#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const isCI = process.env.CI === "true";
const defaultCacheDir = isCI ? ".puppeteer-cache" : ".cache/puppeteer";
const cacheDir = process.env.PUPPETEER_CACHE_DIR || defaultCacheDir;
const resolvedCacheDir = path.resolve(cacheDir);

if (!fs.existsSync(resolvedCacheDir)) {
  fs.mkdirSync(resolvedCacheDir, { recursive: true });
}

console.log(`[puppeteer:install] Using cache directory: ${resolvedCacheDir}`);

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["puppeteer", "browsers", "install", "chrome"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PUPPETEER_CACHE_DIR: resolvedCacheDir,
  },
});

if (result.error) {
  console.error("[puppeteer:install] Failed to spawn puppeteer installer:", result.error);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`[puppeteer:install] Install exited with code ${result.status}`);
  process.exit(result.status ?? 1);
}

console.log("[puppeteer:install] Chrome download complete");
