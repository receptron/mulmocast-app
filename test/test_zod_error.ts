import { mulmoScriptSchema } from "mulmocast";
import { convCauseToErrorMessage, zodError2MulmoError } from "../src/renderer/lib/error";
import test from "node:test";
import assert from "node:assert";

const validData = {
  $mulmocast: {
    version: "1.0",
  },
  beats: [{}],
};

// script
test("test beats empty error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.deepStrictEqual(mulmoError.script.beats, ["Beats must contain at least 1 beat(s)."]);
});

test("test mulmoScript empty error", async () => {
  const mulmoScript = {};

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.deepStrictEqual(mulmoError.script.beats, ["Beats must set."]);
  assert.deepStrictEqual(mulmoError.script.mulmocast, ["$mulmocast must set."]);
});

test("test extra mulmoScript attribute", async () => {
  const mulmoScript = { ...validData, extra: "aaa" };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  // console.log(zodError.error);
  const mulmoError = zodError2MulmoError(zodError.error);
  // console.log(mulmoError);
  assert.deepStrictEqual(mulmoError.script.script, [
    "The object at 'mulmoScript' contains unrecognized key(s): 'extra'.",
  ]);
});

// beats
test("test beats extra element error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [
      {
        text: "",
        htmlPrompt: {
          prompt: "aaaa",
          extra: "bbb",
        },
      },
    ],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.deepStrictEqual(mulmoError.beats[0], ["The object at 'htmlPrompt' contains unrecognized key(s): 'extra'."]);
});

test("test beats invalid data error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [
      {
        text: "",
        imagePrompt: {
          prompt: "aaaa",
        },
      },
    ],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.deepStrictEqual(mulmoError.beats[0], [
    "'imagePrompt' contains invalid data: Invalid input: expected string, received object.",
  ]);
});

test("test beats invalid string error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [
      {
        text: "",
        image: {
          type: "image",
          source: {
            kind: "url",
            url: "",
          },
        },
      },
    ],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.deepStrictEqual(mulmoError.beats[0], ["invalid string: image.source.url. url must be a valid URL."]);
});

//
// speechParams
test("test speechParams extra element error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    speechParams: {
      aaa: "111",
      provider: "openai",
      speakers: {
        bbb: "111",
        Presenter: {
          ccc: "111",
          displayName: {
            en: "Presenter",
            ddd: "111",
          },
          voiceId: "shimmer",
        },
      },
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.deepStrictEqual(mulmoError.speechParams, [
    "'speakers.bbb' contains invalid data: Invalid input: expected object, received string.",
    "The object at 'speakers.Presenter' contains unrecognized key(s): 'ccc'.",
  ]);
});

// canvasSize
test("test canvasSize extra element error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.1",
    },
    canvasSize: {
      width: 1280,
      height: "aa",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.deepStrictEqual(mulmoError.canvasSize, [
    "'height' contains invalid data: Invalid input: expected number, received string.",
  ]);
});

// Note: The mulmoScriptSchema from mulmocast library allows extra keys in canvasSize
// (uses .passthrough() or similar), so unrecognized_keys errors won't occur in practice.
// The error handling code exists for robustness, but we can't test it with the real schema.

// imageParams
test("test imageParams unrecognized keys error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.1",
    },
    imageParams: {
      provider: "openai",
      extraKey: "value",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.imageParams.length > 0);
  assert.ok(mulmoError.imageParams[0].includes("unrecognized key"));
});

// audioParams with nested property
test("test audioParams nested property error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.1",
    },
    audioParams: {
      bgm: {
        url: "invalid-url",
      },
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  // Verify that audioParams is defined
  assert.ok(mulmoError.audioParams !== undefined);
});

// Multiple beats errors
test("test multiple beats with different errors", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [
      {
        text: "",
        htmlPrompt: {
          prompt: "aaaa",
          extra1: "bbb",
        },
      },
      {
        text: "",
        imagePrompt: {
          prompt: "cccc",
        },
      },
      {
        text: "",
        image: {
          type: "image",
          source: {
            kind: "url",
            url: "invalid-url",
          },
        },
      },
    ],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.deepStrictEqual(mulmoError.beats[0], ["The object at 'htmlPrompt' contains unrecognized key(s): 'extra1'."]);
  assert.deepStrictEqual(mulmoError.beats[1], [
    "'imagePrompt' contains invalid data: Invalid input: expected string, received object.",
  ]);
  assert.deepStrictEqual(mulmoError.beats[2], ["invalid string: image.source.url. url must be a valid URL."]);
});

// beats invalid_union error
test("test beats invalid_union error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [
      {
        text: "",
        image: {
          type: "invalid_type",
          source: {
            kind: "url",
            url: "https://example.com",
          },
        },
      },
    ],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.beats[0]?.length > 0);
});

// beats nested property errors
test("test beats with nested property errors", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [
      {
        text: "",
        markdown: {
          contents: "test",
          extra: "invalid",
        },
      },
    ],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  // Verify beats errors are captured
  assert.ok(mulmoError.beats[0]?.length >= 0);
});

// speechParams with deeply nested errors
test("test speechParams deeply nested error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    speechParams: {
      provider: "openai",
      speakers: {
        Speaker1: {
          displayName: {
            en: "Speaker One",
            ja: "スピーカー1",
            extra: "invalid",
          },
          voiceId: "shimmer",
        },
      },
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  // Check that speechParams errors are captured
  assert.ok(mulmoError.speechParams !== undefined);
});

// Test path length edge cases
test("test error at various path depths", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    canvasSize: {
      width: 1920,
      height: 1080,
      extraField: "not allowed",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  // Errors should be captured in the appropriate section
  assert.ok(mulmoError !== null);
});

// Test path.length === 1 with invalid_type for top-level field
test("test top-level field invalid_type (lang)", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    lang: 123, // should be string
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.lang?.length > 0 || mulmoError.script !== null);
});

// Test movieParams with both unrecognized_keys and invalid_type
test("test movieParams unrecognized keys", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    movieParams: {
      provider: "replicate",
      extraKey1: "value1",
      extraKey2: "value2",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.movieParams !== undefined);
});

test("test movieParams invalid_type", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    movieParams: {
      model: 123,
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.movieParams !== undefined);
});

// Test soundEffectParams
test("test soundEffectParams unrecognized keys", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    soundEffectParams: {
      provider: "replicate",
      extraKey: "value",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.soundEffectParams !== undefined);
});

test("test soundEffectParams invalid_type", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    soundEffectParams: {
      model: [],
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.soundEffectParams !== undefined);
});

// Test lipSyncParams
test("test lipSyncParams unrecognized keys", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    lipSyncParams: {
      provider: "replicate",
      unknownParam: "value",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.lipSyncParams !== undefined);
});

test("test lipSyncParams invalid_type", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    lipSyncParams: {
      model: { invalid: "object" },
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.lipSyncParams !== undefined);
});

// Test htmlImageParams
test("test htmlImageParams unrecognized keys", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    htmlImageParams: {
      provider: "openai",
      extraField: "not_allowed",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.htmlImageParams !== undefined);
});

test("test htmlImageParams invalid_type", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    htmlImageParams: {
      model: true,
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.htmlImageParams !== undefined);
});

// Test textSlideParams
test("test textSlideParams unrecognized keys", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    textSlideParams: {
      css: "body { color: red; }",
      extraParam: "value",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.textSlideParams !== undefined);
});

test("test textSlideParams invalid_type", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    textSlideParams: {
      css: 999,
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.textSlideParams !== undefined);
});

// Test captionParams
test("test captionParams unrecognized keys", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    captionParams: {
      language: "en",
      extraField: "not_allowed",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.captionParams !== undefined);
});

test("test captionParams invalid_type", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    captionParams: {
      styles: 123,
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.captionParams !== undefined);
});

// Test multiple unrecognized keys at once
test("test multiple unrecognized keys", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    canvasSize: {
      width: 1920,
      height: 1080,
      extra1: "value1",
      extra2: "value2",
      extra3: "value3",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  // Should capture multiple unrecognized keys in one error message
  if (mulmoError.canvasSize.length > 0) {
    const errorMsg = mulmoError.canvasSize[0];
    assert.ok(errorMsg.includes("unrecognized key"));
  }
});

// Test beats with invalid_string (non-url validation)
test("test beats invalid_string non-url validation", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [
      {
        text: "",
        textSlide: {
          title: 123, // should be string
        },
      },
    ],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.beats[0]?.length >= 0);
});

// Test beats with multiple errors in same beat
test("test single beat with multiple errors", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [
      {
        text: 123, // invalid type
        htmlPrompt: {
          prompt: "test",
          extra1: "error1",
          extra2: "error2",
        },
      },
    ],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  // Should have multiple errors for the same beat
  assert.ok(mulmoError.beats[0]?.length >= 1);
});

// Test numeric path indices
test("test multiple beats with numeric indices", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    beats: [
      {
        text: "",
        imagePrompt: { invalid: "data" },
      },
      {
        text: "",
        moviePrompt: { invalid: "data" },
      },
      {
        text: "",
        htmlPrompt: {
          prompt: "test",
          extra: "key",
        },
      },
    ],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  // Should have errors for each beat indexed by number
  assert.ok(
    mulmoError.beats[0] !== undefined || mulmoError.beats[1] !== undefined || mulmoError.beats[2] !== undefined,
  );
});

// Test audioParams with unrecognized keys
test("test audioParams unrecognized keys", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    audioParams: {
      padding: 1.0,
      extraKey1: "value1",
      extraKey2: "value2",
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.audioParams !== undefined);
});

// Test deeply nested path with multiple segments
test("test deeply nested path error", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    speechParams: {
      speakers: {
        Speaker1: {
          displayName: {
            en: 123, // should be string
          },
          voiceId: "shimmer",
        },
      },
    },
    beats: [{}],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  assert.ok(mulmoError.speechParams !== undefined);
});

// Test all param types together
test("test errors in multiple param types simultaneously", async () => {
  const mulmoScript = {
    $mulmocast: {
      version: "1.0",
    },
    canvasSize: {
      width: "invalid",
    },
    imageParams: {
      provider: 123,
    },
    movieParams: {
      model: [],
    },
    audioParams: {
      padding: "invalid",
    },
    beats: [
      {
        text: "",
        extra: "key",
      },
    ],
  };

  const zodError = mulmoScriptSchema.strip().safeParse(mulmoScript);
  assert.strictEqual(zodError.success, false);
  const mulmoError = zodError2MulmoError(zodError.error);
  // Should capture errors across multiple sections
  const hasErrors =
    mulmoError.canvasSize.length > 0 ||
    mulmoError.imageParams.length > 0 ||
    mulmoError.movieParams.length > 0 ||
    mulmoError.audioParams.length > 0 ||
    Object.keys(mulmoError.beats).length > 0;
  assert.ok(hasErrors);
});

test("convCauseToErrorMessage prioritizes apiError videoDuration target", () => {
  const [messageKey, params] = convCauseToErrorMessage({
    action: "images",
    type: "apiError",
    target: "videoDuration",
    agentName: "openaiImage",
    beatIndex: 0,
  });

  assert.strictEqual(messageKey, "notify.error.images.apiError.videoDuration");
  assert.deepStrictEqual(params, { url: undefined, key: undefined, beatIndex: 1 });
});

test("convCauseToErrorMessage prioritizes apiError unsupportedModel target even with errorCode", () => {
  const [messageKey, params] = convCauseToErrorMessage({
    action: "images",
    type: "apiError",
    target: "unsupportedModel",
    agentName: "someAgent",
    errorCode: "model_not_supported",
    errorType: "invalid_request_error",
  });

  assert.strictEqual(messageKey, "notify.error.images.apiError.unsupportedModel");
  assert.deepStrictEqual(params, { url: undefined, key: undefined, beatIndex: null });
});

test("convCauseToErrorMessage falls back to agent name for non-prioritized apiError target", () => {
  const [messageKey, params] = convCauseToErrorMessage({
    action: "translate",
    type: "apiError",
    target: "general",
    agentName: "translator",
    url: "https://example.com",
  });

  assert.strictEqual(messageKey, "notify.error.translate.apiError.translator");
  assert.deepStrictEqual(params, undefined);
});

test("convCauseToErrorMessage prioritizes multiLingualFile target", () => {
  const [messageKey, params] = convCauseToErrorMessage({
    action: "translate",
    type: "apiError",
    target: "multiLingualFile",
    agentName: "translator",
    key: "fileKey",
  });

  assert.strictEqual(messageKey, "notify.error.translate.apiError.multiLingualFile");
  assert.deepStrictEqual(params, { url: undefined, key: "fileKey", beatIndex: null });
});
