import { mulmoScriptSchema } from "mulmocast";
import { zodError2MulmoError } from "../src/renderer/lib/error";
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
  // console.log(zodError.error.issues);
  const mulmoError = zodError2MulmoError(zodError.error);
  // console.log(mulmoError);
  assert.deepStrictEqual(mulmoError.speechParams, [
    "'speakers.bbb' contains invalid data: Invalid input: expected object, received string.",
    "The object at 'speakers.Presenter' contains unrecognized key(s): 'ccc'.",
    // "The object at 'speechParams' contains unrecognized key(s): 'aaa'.",
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
  // console.log(zodError.error.issues);
  const mulmoError = zodError2MulmoError(zodError.error);
  // console.log(mulmoError);
  assert.deepStrictEqual(mulmoError.canvasSize, ["'height' contains invalid data: Invalid input: expected number, received string."]);
});
