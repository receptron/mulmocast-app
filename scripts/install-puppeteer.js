#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const isCI = process.env.CI === "true";
const defaultCacheDir = isCI ? ".puppeteer-cache" : ".cache/puppeteer";
const cacheDir = process.env.PUPPETEER_CACHE_DIR || defaultCacheDir;
const resolvedCacheDir = path.resolve(cacheDir);

const requiredDirs = [
  path.resolve(".cache/puppeteer"),
  path.resolve(".puppeteer-cache"),
  resolvedCacheDir,
];

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

console.log(`[puppeteer:install] Using cache directory: ${resolvedCacheDir}`);

const puppeteerCli = require.resolve("puppeteer/lib/cjs/puppeteer/node/cli.js");
const result = spawnSync(process.execPath, [puppeteerCli, "browsers", "install", "chrome"], {
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
