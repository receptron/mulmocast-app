import test from "node:test";
import assert from "node:assert";

// Helper functions that we'll test
// These are extracted/reimplemented from translate-i18n.ts for testing purposes

function buildObjectFromKey(key: string, value: string): Record<string, unknown> {
  const parts = key.split(".");
  const result: Record<string, unknown> = {};

  let current: Record<string, unknown> = result;
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return result;
}

function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const output = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      output[key] = mergeDeep(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

function formatTypescriptObject(obj: Record<string, unknown>, indent = 0): string {
  const spaces = "  ".repeat(indent);
  const innerSpaces = "  ".repeat(indent + 1);

  const entries = Object.entries(obj).map(([key, value]) => {
    const safeKey = /^[a-zA-Z_]\w*$/.test(key) ? key : `"${key}"`;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return `${innerSpaces}${safeKey}: ${formatTypescriptObject(value as Record<string, unknown>, indent + 1)}`;
    } else if (typeof value === "string") {
      // Escape special characters in string values
      const escapedValue = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
      return `${innerSpaces}${safeKey}: "${escapedValue}"`;
    } else {
      return `${innerSpaces}${safeKey}: ${JSON.stringify(value)}`;
    }
  });

  return `{\n${entries.join(",\n")}\n${spaces}}`;
}

// Tests for buildObjectFromKey
test("buildObjectFromKey: single level key", () => {
  const result = buildObjectFromKey("key", "value");
  assert.deepStrictEqual(result, { key: "value" });
});

test("buildObjectFromKey: two level key", () => {
  const result = buildObjectFromKey("parent.child", "value");
  assert.deepStrictEqual(result, {
    parent: {
      child: "value",
    },
  });
});

test("buildObjectFromKey: three level key", () => {
  const result = buildObjectFromKey("level1.level2.level3", "value");
  assert.deepStrictEqual(result, {
    level1: {
      level2: {
        level3: "value",
      },
    },
  });
});

test("buildObjectFromKey: deep nesting", () => {
  const result = buildObjectFromKey("a.b.c.d.e.f", "deep value");
  assert.deepStrictEqual(result, {
    a: {
      b: {
        c: {
          d: {
            e: {
              f: "deep value",
            },
          },
        },
      },
    },
  });
});

test("buildObjectFromKey: special characters in value", () => {
  const result = buildObjectFromKey("key", "value with 'quotes' and \"double quotes\"");
  assert.deepStrictEqual(result, {
    key: "value with 'quotes' and \"double quotes\"",
  });
});

test("buildObjectFromKey: Japanese characters", () => {
  const result = buildObjectFromKey("common.save", "保存する");
  assert.deepStrictEqual(result, {
    common: {
      save: "保存する",
    },
  });
});

test("buildObjectFromKey: empty string value", () => {
  const result = buildObjectFromKey("key", "");
  assert.deepStrictEqual(result, { key: "" });
});

// Tests for mergeDeep
test("mergeDeep: merge flat objects", () => {
  const target = { a: "1", b: "2" };
  const source = { c: "3" };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, { a: "1", b: "2", c: "3" });
});

test("mergeDeep: overwrite existing key", () => {
  const target = { a: "1", b: "2" };
  const source = { b: "updated" };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, { a: "1", b: "updated" });
});

test("mergeDeep: merge nested objects", () => {
  const target = {
    parent: {
      child1: "value1",
    },
  };
  const source = {
    parent: {
      child2: "value2",
    },
  };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, {
    parent: {
      child1: "value1",
      child2: "value2",
    },
  });
});

test("mergeDeep: deep merge preserves existing values", () => {
  const target = {
    level1: {
      level2: {
        existing: "keep this",
      },
    },
  };
  const source = {
    level1: {
      level2: {
        newKey: "add this",
      },
    },
  };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, {
    level1: {
      level2: {
        existing: "keep this",
        newKey: "add this",
      },
    },
  });
});

test("mergeDeep: replace non-object with object", () => {
  const target = { key: "string value" };
  const source = {
    key: {
      nested: "object",
    },
  };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, {
    key: {
      nested: "object",
    },
  });
});

test("mergeDeep: replace object with non-object", () => {
  const target = {
    key: {
      nested: "object",
    },
  };
  const source = { key: "string value" };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, { key: "string value" });
});

test("mergeDeep: does not mutate original objects", () => {
  const target = { a: "1" };
  const source = { b: "2" };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(target, { a: "1" }); // target unchanged
  assert.deepStrictEqual(source, { b: "2" }); // source unchanged
  assert.deepStrictEqual(result, { a: "1", b: "2" });
});

test("mergeDeep: handle array values (should replace, not merge)", () => {
  const target = { arr: [1, 2] };
  const source = { arr: [3, 4] };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, { arr: [3, 4] });
});

test("mergeDeep: complex real-world scenario", () => {
  const target = {
    common: {
      buttons: {
        save: "Save",
        cancel: "Cancel",
      },
    },
    settings: {
      api: {
        title: "API Settings",
      },
    },
  };
  const source = {
    common: {
      buttons: {
        delete: "Delete",
      },
    },
    settings: {
      api: {
        description: "Configure API keys",
      },
    },
  };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, {
    common: {
      buttons: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
      },
    },
    settings: {
      api: {
        title: "API Settings",
        description: "Configure API keys",
      },
    },
  });
});

// Tests for formatTypescriptObject
test("formatTypescriptObject: empty object", () => {
  const result = formatTypescriptObject({});
  assert.strictEqual(result, "{\n\n}");
});

test("formatTypescriptObject: flat object", () => {
  const obj = {
    key1: "value1",
    key2: "value2",
  };
  const result = formatTypescriptObject(obj);
  assert.ok(result.includes('key1: "value1"'));
  assert.ok(result.includes('key2: "value2"'));
});

test("formatTypescriptObject: nested object", () => {
  const obj = {
    parent: {
      child: "value",
    },
  };
  const result = formatTypescriptObject(obj);
  assert.ok(result.includes("parent: {"));
  assert.ok(result.includes('child: "value"'));
});

test("formatTypescriptObject: escape special characters", () => {
  const obj = {
    key: 'value with "quotes" and \\ backslash',
  };
  const result = formatTypescriptObject(obj);
  assert.ok(result.includes('\\"'));
  assert.ok(result.includes("\\\\"));
});

test("formatTypescriptObject: escape newlines", () => {
  const obj = {
    key: "line1\nline2",
  };
  const result = formatTypescriptObject(obj);
  assert.ok(result.includes("\\n"));
});

test("formatTypescriptObject: quote keys with special characters", () => {
  const obj = {
    "key-with-dash": "value",
    "key.with.dot": "value",
    normalKey: "value",
  };
  const result = formatTypescriptObject(obj);
  assert.ok(result.includes('"key-with-dash"'));
  assert.ok(result.includes('"key.with.dot"'));
  assert.ok(result.includes("normalKey:"));
  assert.ok(!result.includes('"normalKey"'));
});

test("formatTypescriptObject: handle numeric values", () => {
  const obj = {
    count: 123,
    price: 99.99,
  };
  const result = formatTypescriptObject(obj);
  assert.ok(result.includes("count: 123"));
  assert.ok(result.includes("price: 99.99"));
});

test("formatTypescriptObject: handle boolean values", () => {
  const obj = {
    enabled: true,
    disabled: false,
  };
  const result = formatTypescriptObject(obj);
  assert.ok(result.includes("enabled: true"));
  assert.ok(result.includes("disabled: false"));
});

test("formatTypescriptObject: proper indentation", () => {
  const obj = {
    level1: {
      level2: {
        level3: "value",
      },
    },
  };
  const result = formatTypescriptObject(obj);
  const lines = result.split("\n");
  // Check that deeper levels have more indentation
  assert.ok(lines.some((line) => line.startsWith("  level1:")));
  assert.ok(lines.some((line) => line.startsWith("    level2:")));
  assert.ok(lines.some((line) => line.startsWith("      level3:")));
});

test("formatTypescriptObject: preserve key order (no sorting)", () => {
  const obj = {
    zebra: "z",
    alpha: "a",
    middle: "m",
  };
  const result = formatTypescriptObject(obj);
  const zebraIndex = result.indexOf("zebra:");
  const alphaIndex = result.indexOf("alpha:");
  const middleIndex = result.indexOf("middle:");

  // Keys should appear in insertion order, not alphabetically
  assert.ok(zebraIndex < alphaIndex, "zebra should come before alpha");
  assert.ok(alphaIndex < middleIndex, "alpha should come before middle");
});

test("formatTypescriptObject: complex i18n structure", () => {
  const obj = {
    common: {
      buttons: {
        save: "保存",
        cancel: "キャンセル",
      },
    },
  };
  const result = formatTypescriptObject(obj);
  assert.ok(result.includes("common: {"));
  assert.ok(result.includes("buttons: {"));
  assert.ok(result.includes('save: "保存"'));
  assert.ok(result.includes('cancel: "キャンセル"'));
});

// Integration tests
test("Integration: buildObjectFromKey + mergeDeep simulates translation addition", () => {
  const existingTranslations = {
    common: {
      save: "Save",
      cancel: "Cancel",
    },
  };

  // Simulate adding a new translation
  const newTranslation = buildObjectFromKey("common.delete", "Delete");
  const result = mergeDeep(existingTranslations, newTranslation);

  assert.deepStrictEqual(result, {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
    },
  });
});

test("Integration: full translation workflow simulation", () => {
  const existingJa = {
    common: {
      save: "保存",
    },
  };

  // Simulate translating multiple missing keys
  const translation1 = buildObjectFromKey("common.cancel", "キャンセル");
  let updated = mergeDeep(existingJa, translation1);

  const translation2 = buildObjectFromKey("settings.title", "設定");
  updated = mergeDeep(updated, translation2);

  assert.deepStrictEqual(updated, {
    common: {
      save: "保存",
      cancel: "キャンセル",
    },
    settings: {
      title: "設定",
    },
  });
});

test("Integration: formatTypescriptObject produces valid TypeScript", () => {
  const obj = {
    common: {
      save: "Save",
    },
  };
  const result = formatTypescriptObject(obj);

  // Should be valid TypeScript object syntax
  assert.ok(result.startsWith("{"));
  assert.ok(result.endsWith("}"));
  assert.ok(result.includes("common: {"));
  assert.ok(result.includes('save: "Save"'));
});

test("Integration: preserve original structure when adding translations", () => {
  const original = {
    zebra: "last",
    alpha: "first",
    middle: {
      nested: "value",
    },
  };

  const newKey = buildObjectFromKey("middle.newTranslation", "新しい");
  const result = mergeDeep(original, newKey);
  const formatted = formatTypescriptObject(result);

  // Original order should be preserved
  const zebraIndex = formatted.indexOf("zebra:");
  const alphaIndex = formatted.indexOf("alpha:");
  assert.ok(zebraIndex < alphaIndex, "Original key order should be preserved");
});
