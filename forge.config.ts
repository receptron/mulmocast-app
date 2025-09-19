import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { execSync } from 'child_process';
const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
const buildTime = new Date().toISOString().slice(0,10).replace(/[-:T]/g,'');

const config: ForgeConfig = {
  packagerConfig: {
    buildVersion: `${buildTime}.${gitCommit}`,
    // Enable ASAR and unpack Puppeteer's Chromium binaries so they can be executed at runtime
    asar: {
      unpack: "**/node_modules/puppeteer/.local-chromium/**",
    },
    extraResource: [
      ".vite/build/ffmpeg",
      "node_modules/mulmocast/assets",
      "node_modules/mulmocast/scripts",
      "node_modules/mulmocast-vision/html",
    ],
    icon: "./images/mulmocast_icon.icns",
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
  makers: [new MakerSquirrel({}), new MakerZIP({}, ["darwin"]), new MakerRpm({}), new MakerDeb({})],
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
};

export default config;
