import { promises as fs } from "node:fs";
import path from "node:path";

const srcDir = "src/shared/onboard";
const outDir = "docs/introduction";

const targets = [
  "intro01_welcome_ja",
  "intro01_welcome_en",
  "intro02_multimedia_ja",
  "intro02_multimedia_en",
  "intro03_advanced_ja",
  "intro03_advanced_en",
];

(async () => {
  await Promise.all(
    targets.map(async (name) => {
      const mod = await import(path.resolve(srcDir, `${name}.ts`));
      const data = mod[Object.keys(mod)[0]];
      const dest = path.resolve(outDir, `${name}.json`);
      await fs.writeFile(dest, JSON.stringify(data, null, 2));
      console.log(`wrote ${dest}`);
    }),
  );
})();
