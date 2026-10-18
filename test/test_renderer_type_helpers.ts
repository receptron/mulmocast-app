import test from "node:test";
import assert from "node:assert";
import type { MulmoBeat } from "mulmocast/browser";

import { valueForKey } from "../src/renderer/lib/key_lookup";
import { isArrayBufferUint8Array, isNonEmptyString, isOneOf } from "../src/renderer/lib/type_guards";
import { imageOfType, pathSourceOf, urlSourceOf } from "../src/renderer/lib/beat_util";
import { convCauseToErrorMessage, toErrorCause } from "../src/renderer/lib/error";

test("valueForKey returns the entry for a defined key", () => {
  assert.strictEqual(valueForKey({ a: "x", b: null }, "a"), "x");
  assert.strictEqual(valueForKey({ a: "x", b: null }, "b"), null);
});

test("valueForKey returns undefined for an undefined key, a missing key or missing entries", () => {
  assert.strictEqual(valueForKey({ undefined: "not-a-key" }, undefined), undefined);
  assert.strictEqual(valueForKey({ a: "x" }, "missing"), undefined);
  assert.strictEqual(valueForKey(undefined, "a"), undefined);
  assert.strictEqual(valueForKey<string>(undefined, undefined), undefined);
});

test("valueForKey keeps an empty-string key as a real key", () => {
  assert.strictEqual(valueForKey({ "": "empty" }, ""), "empty");
});

test("isOneOf accepts only listed candidates", () => {
  const tabs = ["movie", "pdf"] as const;
  assert.strictEqual(isOneOf(tabs, "movie"), true);
  assert.strictEqual(isOneOf(tabs, "slide"), false);
  assert.strictEqual(isOneOf(tabs, null), false);
  assert.strictEqual(isOneOf(tabs, undefined), false);
  assert.strictEqual(isOneOf(tabs, 1), false);
  assert.strictEqual(isOneOf(tabs, { value: "movie" }), false);
  assert.strictEqual(isOneOf([], "movie"), false);
});

test("isNonEmptyString matches the truthiness filter it replaces", () => {
  const values = ["en", "", null, "ja"];
  assert.deepStrictEqual(values.filter(isNonEmptyString), ["en", "ja"]);
  assert.strictEqual(isNonEmptyString(undefined), false);
});

test("isArrayBufferUint8Array accepts only ArrayBuffer-backed Uint8Arrays", () => {
  assert.strictEqual(isArrayBufferUint8Array(new Uint8Array([1, 2])), true);
  assert.strictEqual(isArrayBufferUint8Array(new Uint8Array(new ArrayBuffer(4), 1, 2)), true);
  assert.strictEqual(isArrayBufferUint8Array(new ArrayBuffer(2)), false);
  assert.strictEqual(isArrayBufferUint8Array(new Uint16Array(2)), false);
  assert.strictEqual(isArrayBufferUint8Array([1, 2]), false);
  assert.strictEqual(isArrayBufferUint8Array(null), false);
  assert.strictEqual(isArrayBufferUint8Array(undefined), false);
  assert.strictEqual(isArrayBufferUint8Array("abc"), false);
});

const beatWithImage = (image: unknown): MulmoBeat => {
  const beat: MulmoBeat = { text: "" };
  return Object.assign(beat, { image });
};

test("urlSourceOf / pathSourceOf read the source of the matching kind only", () => {
  const urlBeat = beatWithImage({ type: "image", source: { kind: "url", url: "https://example.com/a.png" } });
  const pathBeat = beatWithImage({ type: "movie", source: { kind: "path", path: "./a.mp4" } });
  assert.strictEqual(urlSourceOf(urlBeat), "https://example.com/a.png");
  assert.strictEqual(pathSourceOf(urlBeat), undefined);
  assert.strictEqual(pathSourceOf(pathBeat), "./a.mp4");
  assert.strictEqual(urlSourceOf(pathBeat), undefined);
});

test("urlSourceOf / pathSourceOf return undefined for beats without a media source", () => {
  const noImage: MulmoBeat = { text: "" };
  const markdown = beatWithImage({ type: "markdown", markdown: "# a" });
  const noSource = beatWithImage({ type: "image" });
  [noImage, markdown, noSource].forEach((beat) => {
    assert.strictEqual(urlSourceOf(beat), undefined);
    assert.strictEqual(pathSourceOf(beat), undefined);
  });
});

test("imageOfType returns the image only when its type matches", () => {
  const markdown = beatWithImage({ type: "markdown", markdown: ["a", "b"] });
  assert.deepStrictEqual(imageOfType(markdown, "markdown"), { type: "markdown", markdown: ["a", "b"] });
  assert.strictEqual(imageOfType(markdown, "chart"), undefined);
  assert.strictEqual(imageOfType({ text: "" }, "markdown"), undefined);
});

test("toErrorCause keeps well-typed fields and drops the rest", () => {
  const cause = toErrorCause({
    action: "images",
    type: "apiError",
    target: "videoDuration",
    beatIndex: 2,
    url: "https://example.com",
    key: "k",
    agentName: "openaiImageAgent",
    envVarName: "OPENAI_API_KEY",
    errorCode: "c",
    errorType: "t",
    unrelated: "x",
  });
  assert.deepStrictEqual(cause, {
    action: "images",
    type: "apiError",
    target: "videoDuration",
    beatIndex: 2,
    url: "https://example.com",
    key: "k",
    agentName: "openaiImageAgent",
    envVarName: "OPENAI_API_KEY",
    errorCode: "c",
    errorType: "t",
  });
  assert.deepStrictEqual(toErrorCause({ action: 1, beatIndex: "2" }), {});
});

test("toErrorCause maps non-objects to an empty cause", () => {
  [undefined, null, "cause", 1, true].forEach((value) => {
    assert.deepStrictEqual(toErrorCause(value), {});
  });
  assert.deepStrictEqual(convCauseToErrorMessage(toErrorCause("cause")), ["notify.error.unknownError"]);
});
