import test from "node:test";
import assert from "node:assert";
import { parseConcurrency } from "../src/shared/concurrency";

// Boundary matrix: each row is [input, expected].
// `undefined` means the parser rejected the input — Settings stores nothing
// and the createProject injection skips that field entirely.
const cases: Array<[string | number, number | undefined]> = [
  // Happy path
  ["1", 1],
  ["3", 3],
  ["10", 10],
  [1, 1],
  [42, 42],

  // Decimal → floor (concurrency is an integer)
  ["2.7", 2],
  [3.9, 3],

  // Blank / non-numeric → undefined
  ["", undefined],
  [" ", undefined],
  ["abc", undefined],
  ["1abc", undefined],
  [NaN, undefined],
  [Infinity, undefined],
  [-Infinity, undefined],

  // Zero / negative → undefined (zero would block all generation)
  ["0", undefined],
  [0, undefined],
  ["-1", undefined],
  [-3, undefined],
  ["-2.5", undefined],
];

test("parseConcurrency boundary matrix", () => {
  for (const [input, expected] of cases) {
    const result = parseConcurrency(input);
    assert.strictEqual(result, expected, `input=${JSON.stringify(input)}`);
  }
});
