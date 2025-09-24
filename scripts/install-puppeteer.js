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

const cacheChromeDir = path.join(resolvedCacheDir, "chrome");
if (!fs.existsSync(cacheChromeDir)) {
  console.warn(`[puppeteer:install] No chrome cache directory found at ${cacheChromeDir}`);
  process.exit(0);
}

const variants = fs
  .readdirSync(cacheChromeDir)
  .filter((entry) => fs.statSync(path.join(cacheChromeDir, entry)).isDirectory());

if (variants.length === 0) {
  console.warn(`[puppeteer:install] Chrome cache directory ${cacheChromeDir} is empty`);
  process.exit(0);
}

const destRoot = path.resolve("node_modules/puppeteer/.local-chromium");
const resourceRoot = path.resolve("puppeteer");
ensureDir(destRoot);
ensureDir(resourceRoot);

for (const variant of variants) {
  const srcDir = path.join(cacheChromeDir, variant);
  const destDir = path.join(destRoot, variant);
  const resourceDir = path.join(resourceRoot, variant);

  console.log(`[puppeteer:install] Copying Chromium build ${variant} to ${destDir}`);
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.cpSync(srcDir, destDir, { recursive: true });

  console.log(`[puppeteer:install] Mirroring Chromium build ${variant} to ${resourceDir}`);
  if (fs.existsSync(resourceDir)) {
    fs.rmSync(resourceDir, { recursive: true, force: true });
  }
  fs.cpSync(srcDir, resourceDir, { recursive: true });
}

console.log(`[puppeteer:install] Local puppeteer bundle populated at ${destRoot}`);
