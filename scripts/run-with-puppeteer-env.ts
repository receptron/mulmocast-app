import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const [, , ...args] = process.argv;

if (args.length === 0) {
  console.error("No command provided to run-with-puppeteer-env");
  process.exit(1);
}

const [command, ...commandArgs] = args;

const puppeteerRoot = path.join(
  __dirname,
  "..",
  "node_modules",
  "mulmocast",
  "node_modules",
  "puppeteer",
  ".local-chromium",
);

const env: NodeJS.ProcessEnv = {
  ...process.env,
  PUPPETEER_CACHE_DIR: puppeteerRoot,
  PUPPETEER_DOWNLOAD_PATH: puppeteerRoot,
};

if (!existsSync(puppeteerRoot)) {
  mkdirSync(puppeteerRoot, { recursive: true });
}

const result = spawnSync(command, commandArgs, {
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (typeof result.status === "number") {
  process.exit(result.status);
}

if (result.signal) {
  process.exit(1);
}

process.exit(0);
