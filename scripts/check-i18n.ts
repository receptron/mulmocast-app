import en from "../src/renderer/i18n/en";
import ja from "../src/renderer/i18n/ja";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const collectKeys = (obj: Record<string, unknown>, prefix = ""): Set<string> => {
  const keys = new Set<string>();

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      for (const childKey of collectKeys(value, path)) {
        keys.add(childKey);
      }
    } else {
      keys.add(path);
    }
  }

  return keys;
};

const enKeys = collectKeys(en);
const jaKeys = collectKeys(ja);

const missingInJa = [...enKeys].filter((key) => !jaKeys.has(key));
const missingInEn = [...jaKeys].filter((key) => !enKeys.has(key));

if (!missingInJa.length && !missingInEn.length) {
  console.log("i18n keys match between en and ja ✅");
  process.exit(0);
}

if (missingInJa.length) {
  console.error(`Missing in ja (${missingInJa.length}):`);
  for (const key of missingInJa) {
    console.error(`  - ${key}`);
  }
}

if (missingInEn.length) {
  console.error(`Missing in en (${missingInEn.length}):`);
  for (const key of missingInEn) {
    console.error(`  - ${key}`);
  }
}

process.exit(1);
