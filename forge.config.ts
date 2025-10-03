import fs from "fs";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { execSync } from "child_process";
import path from "node:path";
import packageJSON from "./package.json" with { type: "json" };
import { resolveTargetAndVersion } from "./src/shared/version";

const gitBranch = process.env.BRANCH_NAME || execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
console.log(`gitBranch: ${gitBranch}`);

const now = new Date();
const buildDate = now.toISOString().slice(0, 10).replace(/-/g, "");

const { version: packageVersion } = packageJSON;
console.log(`packageVersion: ${packageVersion}`);

const { target, version } = resolveTargetAndVersion(gitBranch, packageVersion);
console.log(`target: ${target}`);
console.log(`version: ${version}`);

const config: ForgeConfig = {
  packagerConfig: {
    buildVersion: buildDate,
    // Enable ASAR and unpack Puppeteer's Chromium binaries so they can be executed at runtime
    asar: true,
    extraResource: [
      ".vite/build/ffmpeg",
      "node_modules/mulmocast/assets",
      "node_modules/mulmocast/scripts",
      "node_modules/mulmocast-vision/html",
      "chromium",
    ],
    // Use extension-less icon path so Electron Packager picks the right format per platform.
    icon: path.resolve(__dirname, "images/mulmocast_icon"),
    // This is a workaround to require a script before the main process starts.
    // It ensures that our Puppeteer path override is set before any other module loads.
    // The path is relative to the packaged app's resources/app.asar directory.
    "node-options": `--require ./.vite/build/scripts/setup-puppeteer.js`,
    osxSign: process.env.CODESIGN_IDENTITY
      ? ({
          identity: process.env.CODESIGN_IDENTITY,
          hardenedRuntime: true,
          entitlements: "entitlements.plist",
          entitlementsInherit: "entitlements.plist",
        } as any)
      : undefined,
    osxNotarize:
      process.env.AC_APPLE_ID && process.env.AC_PASSWORD && process.env.AC_TEAM_ID
        ? {
            appleId: process.env.AC_APPLE_ID,
            appleIdPassword: process.env.AC_PASSWORD,
            teamId: process.env.AC_TEAM_ID,
          }
        : undefined,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      setupIcon: path.resolve(__dirname, "images/mulmocast_icon.ico"),
      setupExe: `MulmoCast-${packageVersion}-setup.exe`,
    }),
    new MakerZIP({ macUpdateManifestBaseUrl: `https://s3.aws.mulmocast.com/releases/${target}/darwin/arm64` }, [
      "darwin",
    ]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers:
    target === "unknown"
      ? []
      : [
          {
            name: "@electron-forge/publisher-s3",
            config: {
              bucket: "mulmocast-app-update",
              region: "ap-northeast-1",
              folder: `releases/${target}`,
              omitAcl: true,
            },
          },
        ],
};

export default config;
