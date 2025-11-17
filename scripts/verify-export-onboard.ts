import { promises as fs } from "node:fs";
import path from "node:path";
import deepEqual from "deep-equal";

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
  let allPassed = true;

  for (const name of targets) {
    // Load TypeScript module
    const mod = await import(path.resolve(srcDir, `${name}.ts`));
    const tsData = mod[Object.keys(mod)[0]];

    // Load JSON file
    const jsonPath = path.resolve(outDir, `${name}.json`);
    const jsonContent = await fs.readFile(jsonPath, "utf-8");
    const jsonData = JSON.parse(jsonContent);

    // Deep comparison
    const isEqual = deepEqual(tsData, jsonData);

    if (isEqual) {
      console.log(`✓ ${name}: TS and JSON match`);
    } else {
      console.log(`✗ ${name}: TS and JSON DO NOT match`);
      allPassed = false;
    }

    // Check JSON validity
    try {
      JSON.parse(jsonContent);
      console.log(`  - Valid JSON structure`);
    } catch (e) {
      console.log(`  - Invalid JSON: ${e}`);
      allPassed = false;
    }

    // Check key properties
    if (jsonData.$mulmocast) {
      console.log(`  - Has $mulmocast version: ${jsonData.$mulmocast.version}`);
    }
    if (jsonData.title) {
      console.log(`  - Title: ${jsonData.title}`);
    }
    if (jsonData.beats) {
      console.log(`  - Beats count: ${jsonData.beats.length}`);
    }
    console.log("");
  }

  if (allPassed) {
    console.log("✓ All validations passed!");
    process.exit(0);
  } else {
    console.log("✗ Some validations failed");
    process.exit(1);
  }
})();
