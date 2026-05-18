// puppeteer の getConfiguration() は import 時に PUPPETEER_EXECUTABLE_PATH を読んで
// configuration.executablePath にコピーし (lib/cjs/puppeteer/getConfiguration.js)、
// その値が resolveExecutablePath() で最優先で参照される。
// よって puppeteer (および puppeteer を間接 import するモジュール) を読み込む「前」に
// 同梱 Chromium のパスを env var に確定させる必要がある。
// 本ファイルは副作用 import として main.ts の最初の import に置くこと。並び替え禁止。

import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { app } from "electron";

type BootstrapStatus =
  | { kind: "development" }
  | { kind: "no-chromium-dir"; chromiumDir: string }
  | { kind: "no-version-dir"; chromiumDir: string }
  | { kind: "no-platform-match"; chromiumDir: string; versionDirs: string[]; platform: string }
  | { kind: "path-missing"; resolvedPath: string }
  | { kind: "applied"; resolvedPath: string }
  | { kind: "error"; message: string };

const WIN_PLATFORM = "win32";
const WIN_VERSION_PREFIX = "win64-";
const WIN_SUBDIR = "chrome-win64";
const WIN_BINARY = "chrome.exe";
const MAC_VERSION_PREFIXES = ["mac-arm64-", "mac-arm-", "mac_arm-"];
const MAC_VERSION_DIR_FILTER_PREFIXES = ["mac-", "mac_"];
const MAC_SUBDIR = "chrome-mac-arm64";
const MAC_BINARY_SEGMENTS = ["Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"];

const detect = (): BootstrapStatus => {
  if (!app.isPackaged) return { kind: "development" };

  const chromiumDir = path.join(process.resourcesPath, "chromium", "chrome");
  try {
    if (!fs.existsSync(chromiumDir)) {
      return { kind: "no-chromium-dir", chromiumDir };
    }

    const versionDirs = fs
      .readdirSync(chromiumDir)
      .filter(
        (dir) => dir.startsWith(WIN_VERSION_PREFIX) || MAC_VERSION_DIR_FILTER_PREFIXES.some((p) => dir.startsWith(p)),
      );
    if (versionDirs.length === 0) {
      return { kind: "no-version-dir", chromiumDir };
    }

    const platform = os.platform() === WIN_PLATFORM ? "win64" : "mac-arm64";
    const targetDir =
      os.platform() === WIN_PLATFORM
        ? versionDirs.find((dir) => dir.startsWith(WIN_VERSION_PREFIX))
        : versionDirs.find((dir) => MAC_VERSION_PREFIXES.some((prefix) => dir.startsWith(prefix)));
    if (!targetDir) {
      return { kind: "no-platform-match", chromiumDir, versionDirs, platform };
    }

    const resolvedPath =
      os.platform() === WIN_PLATFORM
        ? path.join(chromiumDir, targetDir, WIN_SUBDIR, WIN_BINARY)
        : path.join(chromiumDir, targetDir, MAC_SUBDIR, ...MAC_BINARY_SEGMENTS);

    if (!fs.existsSync(resolvedPath)) {
      return { kind: "path-missing", resolvedPath };
    }

    process.env.PUPPETEER_EXECUTABLE_PATH = resolvedPath;
    return { kind: "applied", resolvedPath };
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : String(error) };
  }
};

export const puppeteerBootstrapStatus: BootstrapStatus = detect();
