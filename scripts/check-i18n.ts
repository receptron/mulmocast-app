import en from "../src/renderer/i18n/en";
import ja from "../src/renderer/i18n/ja";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const collectKeysWithValues = (obj: Record<string, unknown>, prefix = ""): Map<string, string> => {
  const result = new Map<string, string>();

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      for (const [childKey, childValue] of collectKeysWithValues(value, path)) {
        result.set(childKey, childValue);
      }
    } else {
      result.set(path, String(value));
    }
  }

  return result;
};

const enMap = collectKeysWithValues(en);
const jaMap = collectKeysWithValues(ja);

const allKeys = new Set([...enMap.keys(), ...jaMap.keys()]);
const sortedKeys = [...allKeys].sort();

let hasMismatches = false;

for (const key of sortedKeys) {
  const jaValue = jaMap.get(key);
  const enValue = enMap.get(key);

  if (!jaValue || !enValue) {
    hasMismatches = true;
    console.log(`\n${key}`);
    console.log(`  - ja: ${jaValue || "missing"}`);
    console.log(`  - en: ${enValue || "missing"}`);
  }
}

if (!hasMismatches) {
  console.log("i18n keys match between en and ja ✅");
  process.exit(0);
}

process.exit(1);
