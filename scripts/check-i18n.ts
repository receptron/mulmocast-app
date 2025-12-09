export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const collectKeysWithValues = (obj: Record<string, unknown>, prefix = ""): Map<string, string> => {
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

// Only run the check when this file is executed directly (not imported)
if (require.main === module) {
  (async () => {
    const en = (await import("../src/renderer/i18n/en")).default;
    const ja = (await import("../src/renderer/i18n/ja")).default;

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
        console.log(`  - ja: ${jaValue || "[MISSING]"}`);
        console.log(`  - en: ${enValue || "[MISSING]"}`);
      }
    }

    if (!hasMismatches) {
      console.log("i18n keys match between en and ja ✅");
      process.exit(0);
    }

    process.exit(1);
  })();
}
