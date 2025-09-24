#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const isCI = process.env.CI === "true";
const defaultCacheDir = isCI ? ".puppeteer-cache" : ".cache/puppeteer";
const cacheDir = process.env.PUPPETEER_CACHE_DIR || defaultCacheDir;
const resolvedCacheDir = path.resolve(cacheDir);

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(resolvedCacheDir);
// Ensure both cache locations exist so we can bundle whichever is used
ensureDir(path.resolve(".cache/puppeteer"));
ensureDir(path.resolve(".puppeteer-cache"));

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
  console.error("[puppeteer:install] Failed to spawn Puppeteer installer:", result.error);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`[puppeteer:install] Installer exited with code ${result.status}`);
  process.exit(result.status ?? 1);
}

console.log("[puppeteer:install] Chrome download complete");
