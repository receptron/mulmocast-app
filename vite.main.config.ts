import { defineConfig } from "vite";
import path from "path";
import fs from "fs";
import ffmpegFfprobeStatic from "ffmpeg-ffprobe-static";

// Packages to exclude from bundle and load directly from node_modules
const external_packages = ["jsdom", "mulmocast-vision", "puppeteer", "puppeteer-core"];

const isDev = process.env.NODE_ENV === "development";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: external_packages,
    },
    commonjsOptions: { transformMixedEsModules: true },
  },
  plugins: [
    {
      name: "copy-ffmpeg-after-build",
      apply: "build",
      closeBundle() {
        if (isDev) return;

        const destDir = path.resolve(__dirname, ".vite/build/ffmpeg");
        fs.mkdirSync(destDir, { recursive: true });

        fs.copyFileSync(ffmpegFfprobeStatic.ffmpegPath, path.join(destDir, "ffmpeg"));
        fs.copyFileSync(ffmpegFfprobeStatic.ffprobePath, path.join(destDir, "ffprobe"));
        console.log("✅ ffmpeg and ffprobe copied by Vite plugin");
      },
    },
    {
      name: "copy-splash-html",
      apply: "build",
      closeBundle() {
        if (isDev) return;

        // Copy splash.html
        const srcPath = path.resolve(__dirname, "splash.html");
        const destPath = path.resolve(__dirname, ".vite/build/splash.html");
        fs.copyFileSync(srcPath, destPath);

        // Ensure splash image exists alongside splash.html path expectations
        const imgSrc = path.resolve(__dirname, "images/mulmocast_credit.png");
        const imgDir = path.resolve(__dirname, ".vite/build/images");
        const imgDest = path.join(imgDir, "mulmocast_credit.png");
        try {
          fs.mkdirSync(imgDir, { recursive: true });
          if (fs.existsSync(imgSrc)) {
            fs.copyFileSync(imgSrc, imgDest);
            console.log("✅ splash image copied to build/images");
          } else {
            console.warn("⚠️  splash image not found:", imgSrc);
          }
        } catch (e) {
          console.warn("⚠️  failed to copy splash image:", e);
        }

        console.log("✅ splash.html copied to build directory");
      },
    },
    {
      name: "copy-external-node-modules",
      apply: "build",
      closeBundle() {
        if (isDev) return;

        const buildNodeModules = path.resolve(__dirname, ".vite/build/node_modules");
        fs.mkdirSync(buildNodeModules, { recursive: true });

        // Root packages to include (externalized in main bundle)
        const roots = external_packages;
        const visited = new Set<string>();

        const pkgRoot = (name: string) => path.resolve(__dirname, `node_modules/${name}`);
        const pkgJsonPath = (name: string) => path.join(pkgRoot(name), "package.json");

        const copyPackage = (name: string) => {
          const src = pkgRoot(name);
          const dest = path.join(buildNodeModules, name);
          if (!fs.existsSync(src)) {
            console.warn(`⚠️  ${name} not found in root node_modules`);
            return;
          }
          // Ensure parent dir exists for scoped packages
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.cpSync(src, dest, { recursive: true });
          console.log(`✅ copied ${name}`);
        };

        const walk = (name: string) => {
          if (visited.has(name)) return;
          visited.add(name);
          try {
            const jsonPath = pkgJsonPath(name);
            const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
            copyPackage(name);
            const deps = Object.assign({}, json.dependencies || {}, json.optionalDependencies || {});
            for (const depName of Object.keys(deps)) {
              // Skip builtins and electron
              if (/^(electron|node:|fs|path|crypto|stream|events|url|buffer)$/.test(depName)) continue;
              walk(depName);
            }
          } catch (e) {
            console.warn(`⚠️  Failed to process ${name}: ${String((e as any)?.message || e)}`);
          }
        };

        roots.forEach(walk);
      },
    },
  ],
});
