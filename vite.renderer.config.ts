import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import { loadBranding, createBrandDefines } from "./scripts/branding";

// https://vitejs.dev/config
export default defineConfig(async () => {
  // @ts-expect-error warkaround for commonjs
  const { default: tailwindcss } = await import("@tailwindcss/vite");
  const activeBranding = loadBranding();
  return {
    define: {
      "process.env": {},
      ...createBrandDefines(activeBranding),
    },
    plugins: [
      {
        name: "branding-index-html",
        transformIndexHtml(html) {
          return html.replace(/%APP_BRAND_NAME%/g, activeBranding.branding.appName);
        },
      },
      monacoEditorPlugin({
        languageWorkers: ["json", "editorWorkerService"],
        customWorkers: [
          {
            label: "yaml",
            entry: "monaco-yaml/yaml.worker.js",
          },
        ],
      }),
      vue(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src/renderer"),
        "@/types": path.resolve(__dirname, "./src/types"),
      },
    },
    build: {},
  };
});
