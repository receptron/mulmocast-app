import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

// https://vitejs.dev/config
export default defineConfig(async () => {
  // @ts-expect-error warkaround for commonjs
  const { default: tailwindcss } = await import("@tailwindcss/vite");
  return {
    plugins: [
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
    build: {
      commonjsOptions: { transformMixedEsModules: true },
    },
  };
});
