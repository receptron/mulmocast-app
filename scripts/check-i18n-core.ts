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

export interface MissingKey {
  key: string;
  jaValue: string | undefined;
  enValue: string | undefined;
}

export const findMissingKeys = (enMap: Map<string, string>, jaMap: Map<string, string>): ReadonlyArray<MissingKey> => {
  const allKeys = new Set([...enMap.keys(), ...jaMap.keys()]);
  const sortedKeys = [...allKeys].sort();

  return sortedKeys
    .map((key) => ({
      key,
      jaValue: jaMap.get(key),
      enValue: enMap.get(key),
    }))
    .filter((item) => !item.jaValue || !item.enValue);
};

export const formatMissingKey = (missing: MissingKey): string => {
  const lines = [
    `\n${missing.key}`,
    `  - ja: ${missing.jaValue || "[MISSING]"}`,
    `  - en: ${missing.enValue || "[MISSING]"}`,
  ];
  return lines.join("\n");
};
