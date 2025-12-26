import test from "node:test";
import assert from "node:assert";
import {
  validateKeys,
  buildTranslationPrompt,
  cleanLLMResponse,
  withRetry,
  type TranslationService,
} from "../scripts/translate-i18n";

// Unit tests for pure functions

test("validateKeys: accepts valid keys", () => {
  assert.doesNotThrow(() => {
    validateKeys(["key1", "parent.child", "a.b.c.d"]);
  });
});

test("validateKeys: rejects __proto__", () => {
  assert.throws(
    () => validateKeys(["__proto__"]),
    /Dangerous key detected: "__proto__" contains forbidden segment "__proto__"/,
  );
  assert.throws(
    () => validateKeys(["parent.__proto__"]),
    /Dangerous key detected: "parent.__proto__" contains forbidden segment "__proto__"/,
  );
});

test("validateKeys: rejects constructor", () => {
  assert.throws(
    () => validateKeys(["constructor"]),
    /Dangerous key detected: "constructor" contains forbidden segment "constructor"/,
  );
  assert.throws(
    () => validateKeys(["parent.constructor.child"]),
    /Dangerous key detected: "parent.constructor.child" contains forbidden segment "constructor"/,
  );
});

test("validateKeys: rejects prototype", () => {
  assert.throws(
    () => validateKeys(["prototype"]),
    /Dangerous key detected: "prototype" contains forbidden segment "prototype"/,
  );
});

test("validateKeys: rejects empty segments (consecutive dots)", () => {
  assert.throws(() => validateKeys(["parent..child"]), /Invalid key format: "parent..child" contains empty segment/);
});

test("validateKeys: rejects leading dot", () => {
  assert.throws(() => validateKeys([".leadingDot"]), /Invalid key format: ".leadingDot" contains empty segment/);
});

test("validateKeys: rejects trailing dot", () => {
  assert.throws(() => validateKeys(["trailingDot."]), /Invalid key format: "trailingDot." contains empty segment/);
});

test("validateKeys: handles multiple keys with mixed validity", () => {
  assert.throws(() => validateKeys(["valid.key", "__proto__", "another.valid"]), /Dangerous key detected/);
});

// buildTranslationPrompt tests

test("buildTranslationPrompt: generates deterministic output", () => {
  const prompt1 = buildTranslationPrompt(
    "const lang = { test: 'value' };",
    [{ key: "ui.button", sourceValue: "Click me" }],
    "English",
    "Japanese",
  );

  const prompt2 = buildTranslationPrompt(
    "const lang = { test: 'value' };",
    [{ key: "ui.button", sourceValue: "Click me" }],
    "English",
    "Japanese",
  );

  assert.strictEqual(prompt1, prompt2, "Same inputs should produce identical prompts");
});

test("buildTranslationPrompt: includes all required sections", () => {
  const prompt = buildTranslationPrompt(
    "const lang = {};",
    [{ key: "test.key", sourceValue: "Test Value" }],
    "English",
    "Japanese",
  );

  assert.ok(prompt.includes("You are a TypeScript code editor"));
  assert.ok(prompt.includes("Translate missing keys from English to Japanese"));
  assert.ok(prompt.includes("ORIGINAL FILE CONTENT:"));
  assert.ok(prompt.includes("const lang = {};"));
  assert.ok(prompt.includes("MISSING KEYS TO TRANSLATE"));
  assert.ok(prompt.includes('test.key: "Test Value"'));
  assert.ok(prompt.includes("TRANSLATION REQUIREMENTS:"));
  assert.ok(prompt.includes("FILE EDITING REQUIREMENTS:"));
});

test("buildTranslationPrompt: formats multiple keys correctly", () => {
  const prompt = buildTranslationPrompt(
    "",
    [
      { key: "key1", sourceValue: "value1" },
      { key: "key2", sourceValue: "value2" },
      { key: "key3", sourceValue: "value3" },
    ],
    "English",
    "Japanese",
  );

  assert.ok(prompt.includes('key1: "value1"'));
  assert.ok(prompt.includes('key2: "value2"'));
  assert.ok(prompt.includes('key3: "value3"'));
});

test("buildTranslationPrompt: preserves special characters in values", () => {
  const prompt = buildTranslationPrompt(
    "",
    [{ key: "message", sourceValue: "Line 1\nLine 2\nLine 3" }],
    "English",
    "Japanese",
  );

  assert.ok(prompt.includes('message: "Line 1\nLine 2\nLine 3"'));
});

// cleanLLMResponse tests

test("cleanLLMResponse: removes typescript markdown fences", () => {
  const input = "```typescript\nconst x = 1;\n```";
  const expected = "const x = 1;";
  assert.strictEqual(cleanLLMResponse(input), expected);
});

test("cleanLLMResponse: removes plain markdown fences", () => {
  const input = "```\nconst x = 1;\n```";
  const expected = "const x = 1;";
  assert.strictEqual(cleanLLMResponse(input), expected);
});

test("cleanLLMResponse: trims whitespace", () => {
  const input = "  \n  const x = 1;  \n  ";
  const expected = "const x = 1;";
  assert.strictEqual(cleanLLMResponse(input), expected);
});

test("cleanLLMResponse: handles no fences", () => {
  const input = "const x = 1;";
  const expected = "const x = 1;";
  assert.strictEqual(cleanLLMResponse(input), expected);
});

test("cleanLLMResponse: handles both fence types", () => {
  const input = "```typescript\nconst x = 1;\n```";
  const expected = "const x = 1;";
  assert.strictEqual(cleanLLMResponse(input), expected);
});

// withRetry tests (using mock service)

class MockTranslationService implements TranslationService {
  private callCount = 0;
  constructor(private failuresBeforeSuccess: number) {}

  async translate(): Promise<string> {
    this.callCount++;
    if (this.callCount <= this.failuresBeforeSuccess) {
      const error = new Error("Rate limit") as Error & { status?: number; errorDetails?: Array<unknown> };
      error.status = 429;
      error.errorDetails = [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "0.1s" }];
      throw error;
    }
    return "translated content";
  }

  getCallCount(): number {
    return this.callCount;
  }
}

test("withRetry: succeeds on first try", async () => {
  const mockService = new MockTranslationService(0);
  const result = await withRetry(() => mockService.translate(), { maxRetries: 3 });
  assert.strictEqual(result, "translated content");
  assert.strictEqual(mockService.getCallCount(), 1);
});

test("withRetry: retries on 429 error and succeeds", async () => {
  const mockService = new MockTranslationService(2);
  let retryCallbacks = 0;

  const result = await withRetry(() => mockService.translate(), {
    maxRetries: 3,
    onRetry: (attempt, delay) => {
      retryCallbacks++;
      assert.ok(attempt > 0 && attempt <= 3);
      assert.ok(delay > 0);
    },
  });

  assert.strictEqual(result, "translated content");
  assert.strictEqual(mockService.getCallCount(), 3);
  assert.strictEqual(retryCallbacks, 2);
});

test("withRetry: fails after max retries", async () => {
  const mockService = new MockTranslationService(10); // Never succeeds
  let maxRetriesExceededCalled = false;

  await assert.rejects(async () => {
    await withRetry(() => mockService.translate(), {
      maxRetries: 3,
      onMaxRetriesExceeded: () => {
        maxRetriesExceededCalled = true;
      },
    });
  }, /Rate limit/);

  assert.strictEqual(mockService.getCallCount(), 4); // Initial + 3 retries
  assert.strictEqual(maxRetriesExceededCalled, true);
});

test("withRetry: throws non-429 errors immediately", async () => {
  const service = {
    async translate(): Promise<string> {
      throw new Error("Different error");
    },
  };

  await assert.rejects(async () => {
    await withRetry(() => service.translate(), { maxRetries: 3 });
  }, /Different error/);
});
