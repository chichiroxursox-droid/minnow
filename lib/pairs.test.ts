import { test } from "node:test";
import assert from "node:assert/strict";
import { minimalPair, COMMON_ERRORS } from "./pairs.ts";

test("fronting pairs for /k/ initial come from the dictionary", () => {
  assert.deepEqual(minimalPair("cape", "K", "initial", "T"), { word: "tape", phones: ["T", "EY", "P"] });
  assert.equal(minimalPair("coast", "K", "initial", "T")?.word, "toast");
  assert.equal(minimalPair("kite", "K", "initial", "T")?.word, "tight");
  assert.equal(minimalPair("key", "K", "initial", "T")?.word, "tea");
});

test("final position swaps the last phone", () => {
  assert.equal(minimalPair("bus", "S", "final", "T")?.word, "but");
  assert.equal(minimalPair("pass", "S", "final", "T")?.word, "pat");
});

test("no pair when the dictionary has no such word, or the target is not there", () => {
  assert.equal(minimalPair("coral", "K", "initial", "T"), null);
  assert.equal(minimalPair("knot", "K", "initial", "T"), null);
  assert.equal(minimalPair("zzqx", "K", "initial", "T"), null);
  assert.equal(minimalPair("cape", "K", "initial", ""), null);
  assert.equal(minimalPair("cape", "K", "initial", "K"), null);
});

test("common error map covers the sounds kids front, stop, and glide", () => {
  assert.equal(COMMON_ERRORS.K, "T");
  assert.equal(COMMON_ERRORS.R, "W");
  assert.equal(COMMON_ERRORS.S, "T");
});
