import { defineConfig } from "vite";
import path from "path";
import fs from "fs";
import ffmpegFfprobeStatic from "ffmpeg-ffprobe-static";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: ["jsdom", "puppeteer-core"],
    },
    commonjsOptions: { transformMixedEsModules: true },
  },
  plugins: [
    {
      name: "copy-ffmpeg-after-build",
      apply: "build",
      closeBundle() {
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
        const srcPath = path.resolve(__dirname, "splash.html");
        const destPath = path.resolve(__dirname, ".vite/build/splash.html");
        fs.copyFileSync(srcPath, destPath);
        console.log("✅ splash.html copied to build directory");
      },
    },
  ],
});
