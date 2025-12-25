import test from "node:test";
import assert from "node:assert";
import { buildObjectFromKey, mergeDeep, formatTypescriptObject } from "../scripts/translate-i18n";

// Tests for buildObjectFromKey
test("buildObjectFromKey: single level key", () => {
  const result = buildObjectFromKey("key", "value");
  assert.deepStrictEqual(result, { key: "value" });
});

test("buildObjectFromKey: rejects __proto__ pollution", () => {
  assert.throws(
    () => buildObjectFromKey("__proto__.polluted", "value"),
    /Invalid key segment: "__proto__"/,
    "Should reject __proto__ in key",
  );
});

test("buildObjectFromKey: rejects constructor pollution", () => {
  assert.throws(
    () => buildObjectFromKey("constructor.polluted", "value"),
    /Invalid key segment: "constructor"/,
    "Should reject constructor in key",
  );
});

test("buildObjectFromKey: rejects prototype pollution", () => {
  assert.throws(
    () => buildObjectFromKey("prototype.polluted", "value"),
    /Invalid key segment: "prototype"/,
    "Should reject prototype in key",
  );
});

test("buildObjectFromKey: rejects empty key segment", () => {
  assert.throws(
    () => buildObjectFromKey("key..nested", "value"),
    /Invalid key segment: ""/,
    "Should reject empty segment",
  );
});

test("buildObjectFromKey: rejects key starting with empty segment", () => {
  assert.throws(() => buildObjectFromKey(".key", "value"), /Invalid key segment: ""/, "Should reject leading dot");
});

test("buildObjectFromKey: rejects key ending with empty segment", () => {
  assert.throws(() => buildObjectFromKey("key.", "value"), /Invalid key segment: ""/, "Should reject trailing dot");
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
test("mergeDeep: ignores __proto__ in source", () => {
  const target = { a: "1" };
  const source = JSON.parse('{"__proto__": {"polluted": "bad"}, "b": "2"}');
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, { a: "1", b: "2" });
  // Verify prototype was not polluted
  assert.strictEqual((Object.prototype as Record<string, unknown>).polluted, undefined);
});

test("mergeDeep: ignores constructor in source", () => {
  const target = { a: "1" };
  const source = { constructor: { polluted: "bad" }, b: "2" };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, { a: "1", b: "2" });
});

test("mergeDeep: ignores prototype in source", () => {
  const target = { a: "1" };
  const source = { prototype: { polluted: "bad" }, b: "2" };
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, { a: "1", b: "2" });
});

test("mergeDeep: only processes own properties", () => {
  const target = { a: "1" };
  const parent = { inherited: "should not appear" };
  const source = Object.create(parent);
  source.own = "should appear";
  const result = mergeDeep(target, source);
  assert.deepStrictEqual(result, { a: "1", own: "should appear" });
  assert.strictEqual((result as Record<string, unknown>).inherited, undefined);
});

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
