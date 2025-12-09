import test from "node:test";
import assert from "node:assert";
import { isPlainObject, collectKeysWithValues } from "../scripts/check-i18n";

// isPlainObject のテスト
test("isPlainObject: basic object returns true", () => {
  assert.strictEqual(isPlainObject({}), true);
  assert.strictEqual(isPlainObject({ key: "value" }), true);
});

test("isPlainObject: non-objects return false", () => {
  assert.strictEqual(isPlainObject(null), false);
  assert.strictEqual(isPlainObject(undefined), false);
  assert.strictEqual(isPlainObject("string"), false);
  assert.strictEqual(isPlainObject(123), false);
  assert.strictEqual(isPlainObject(true), false);
});

test("isPlainObject: arrays return false", () => {
  assert.strictEqual(isPlainObject([]), false);
  assert.strictEqual(isPlainObject([1, 2, 3]), false);
});

// collectKeysWithValues のテスト - 基本ケース
test("collectKeysWithValues: empty object", () => {
  const result = collectKeysWithValues({});
  assert.strictEqual(result.size, 0);
});

test("collectKeysWithValues: flat object", () => {
  const obj = {
    key1: "value1",
    key2: "value2",
    key3: "value3",
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 3);
  assert.strictEqual(result.get("key1"), "value1");
  assert.strictEqual(result.get("key2"), "value2");
  assert.strictEqual(result.get("key3"), "value3");
});

test("collectKeysWithValues: nested object", () => {
  const obj = {
    parent: {
      child1: "value1",
      child2: "value2",
    },
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("parent.child1"), "value1");
  assert.strictEqual(result.get("parent.child2"), "value2");
});

test("collectKeysWithValues: deeply nested object", () => {
  const obj = {
    level1: {
      level2: {
        level3: {
          level4: "deep value",
        },
      },
    },
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 1);
  assert.strictEqual(result.get("level1.level2.level3.level4"), "deep value");
});

test("collectKeysWithValues: mixed flat and nested", () => {
  const obj = {
    flatKey: "flat value",
    nested: {
      child: "nested value",
    },
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("flatKey"), "flat value");
  assert.strictEqual(result.get("nested.child"), "nested value");
});

// Edge cases
test("collectKeysWithValues: object with number values", () => {
  const obj = {
    count: 123,
    price: 99.99,
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("count"), "123");
  assert.strictEqual(result.get("price"), "99.99");
});

test("collectKeysWithValues: object with boolean values", () => {
  const obj = {
    enabled: true,
    disabled: false,
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("enabled"), "true");
  assert.strictEqual(result.get("disabled"), "false");
});

test("collectKeysWithValues: object with special characters in keys", () => {
  const obj = {
    "key-with-dash": "value1",
    key_with_underscore: "value2",
    "key.with.dot": "value3",
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 3);
  assert.strictEqual(result.get("key-with-dash"), "value1");
  assert.strictEqual(result.get("key_with_underscore"), "value2");
  assert.strictEqual(result.get("key.with.dot"), "value3");
});

test("collectKeysWithValues: object with array values (arrays should be treated as leaf nodes)", () => {
  const obj = {
    items: ["a", "b", "c"],
    nested: {
      list: [1, 2, 3],
    },
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("items"), "a,b,c");
  assert.strictEqual(result.get("nested.list"), "1,2,3");
});

test("collectKeysWithValues: object with null values", () => {
  const obj = {
    nullValue: null,
    normalValue: "value",
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("nullValue"), "null");
  assert.strictEqual(result.get("normalValue"), "value");
});

test("collectKeysWithValues: object with undefined values", () => {
  const obj = {
    undefinedValue: undefined,
    normalValue: "value",
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("undefinedValue"), "undefined");
  assert.strictEqual(result.get("normalValue"), "value");
});

test("collectKeysWithValues: object with empty string values", () => {
  const obj = {
    emptyString: "",
    normalString: "value",
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("emptyString"), "");
  assert.strictEqual(result.get("normalString"), "value");
});

test("collectKeysWithValues: very deeply nested object (10 levels)", () => {
  const obj = {
    l1: {
      l2: {
        l3: {
          l4: {
            l5: {
              l6: {
                l7: {
                  l8: {
                    l9: {
                      l10: "deep",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 1);
  assert.strictEqual(result.get("l1.l2.l3.l4.l5.l6.l7.l8.l9.l10"), "deep");
});

test("collectKeysWithValues: object with unicode characters in keys", () => {
  const obj = {
    日本語: "japanese",
    中文: "chinese",
    한글: "korean",
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 3);
  assert.strictEqual(result.get("日本語"), "japanese");
  assert.strictEqual(result.get("中文"), "chinese");
  assert.strictEqual(result.get("한글"), "korean");
});

test("collectKeysWithValues: object with numeric string keys", () => {
  const obj = {
    "123": "numeric string key",
    "456": "another one",
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("123"), "numeric string key");
  assert.strictEqual(result.get("456"), "another one");
});

test("collectKeysWithValues: large flat object (100 keys)", () => {
  const obj: Record<string, string> = {};
  for (let i = 0; i < 100; i++) {
    obj[`key${i}`] = `value${i}`;
  }
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 100);
  for (let i = 0; i < 100; i++) {
    assert.strictEqual(result.get(`key${i}`), `value${i}`);
  }
});

test("collectKeysWithValues: complex real-world structure", () => {
  const obj = {
    common: {
      buttons: {
        save: "Save",
        cancel: "Cancel",
      },
    },
    settings: {
      api: {
        title: "API Settings",
        keys: {
          openai: "OpenAI Key",
        },
      },
    },
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 4);
  assert.strictEqual(result.get("common.buttons.save"), "Save");
  assert.strictEqual(result.get("common.buttons.cancel"), "Cancel");
  assert.strictEqual(result.get("settings.api.title"), "API Settings");
  assert.strictEqual(result.get("settings.api.keys.openai"), "OpenAI Key");
});

test("collectKeysWithValues: object with value 'missing' (should not be confused with [MISSING])", () => {
  const obj = {
    key1: "missing",
    key2: "normal value",
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("key1"), "missing");
  assert.strictEqual(result.get("key2"), "normal value");
});

test("collectKeysWithValues: object with value '[MISSING]' (should preserve literal value)", () => {
  const obj = {
    key1: "[MISSING]",
    key2: "normal value",
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("key1"), "[MISSING]");
  assert.strictEqual(result.get("key2"), "normal value");
});

test("collectKeysWithValues: multiple levels with same key names", () => {
  const obj = {
    parent1: {
      child: "value1",
    },
    parent2: {
      child: "value2",
    },
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 2);
  assert.strictEqual(result.get("parent1.child"), "value1");
  assert.strictEqual(result.get("parent2.child"), "value2");
});

test("collectKeysWithValues: objects with whitespace in values", () => {
  const obj = {
    key1: "  leading spaces",
    key2: "trailing spaces  ",
    key3: "  both  ",
    key4: "multiple   spaces",
  };
  const result = collectKeysWithValues(obj);
  assert.strictEqual(result.size, 4);
  assert.strictEqual(result.get("key1"), "  leading spaces");
  assert.strictEqual(result.get("key2"), "trailing spaces  ");
  assert.strictEqual(result.get("key3"), "  both  ");
  assert.strictEqual(result.get("key4"), "multiple   spaces");
});
