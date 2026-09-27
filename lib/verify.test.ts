import { test } from "node:test";
import assert from "node:assert/strict";
import { verify, stripStress, phonesFor, syllableCount, type Target } from "./verify.ts";
import { toIpa } from "./ipa.ts";

const kInitial: Target = { phoneme: "K", position: "initial", syllables: "1-2" };
const rMedial: Target = { phoneme: "R", position: "medial", syllables: "1-2" };
const kFinal: Target = { phoneme: "K", position: "final", syllables: "1-2" };

test("stress digits are stripped from dictionary phones", () => {
  assert.equal(stripStress("AA1"), "AA");
  assert.equal(stripStress("AH0"), "AH");
  assert.equal(stripStress("K"), "K");
  assert.deepEqual(phonesFor("coral"), ["K", "AO", "R", "AH", "L"]);
});

test("position check: initial", () => {
  assert.equal(verify("coral", kInitial).status, "pass");
  const knot = verify("knot", kInitial);
  assert.equal(knot.status, "fail");
  assert.match((knot as { reason: string }).reason, /^N AA T: starts with N, not K$/);
  const ocean = verify("ocean", kInitial);
  assert.equal(ocean.status, "fail");
  assert.match((ocean as { reason: string }).reason, /^OW SH AH N: starts with OW, not K$/);
});

test("position check: medial and final", () => {
  assert.equal(verify("coral", rMedial).status, "pass");
  assert.equal(verify("rabbit", rMedial).status, "fail");
  assert.equal(verify("duck", kFinal).status, "pass");
  const kite = verify("kite", kFinal);
  assert.equal(kite.status, "fail");
  assert.match((kite as { reason: string }).reason, /ends with T, not K/);
});

test("syllable count", () => {
  assert.equal(syllableCount(["K", "AO", "R", "AH", "L"]), 2);
  assert.equal(syllableCount(["N", "AA", "T"]), 1);
  const octopus = verify("octopus", { phoneme: "K", position: "medial", syllables: "1-2" });
  assert.equal(octopus.status, "fail");
  assert.match((octopus as { reason: string }).reason, /3 syllables, wanted 1-2/);
  assert.equal(verify("octopus", { phoneme: "K", position: "medial", syllables: "3" }).status, "pass");
});

test("singleton option rejects clusters", () => {
  assert.equal(verify("crab", { ...kInitial, singleton: true }).status, "fail");
  assert.equal(verify("coral", { ...kInitial, singleton: true }).status, "pass");
});

test("a word missing from cmudict is unverified, never a verdict", () => {
  const v = verify("zzzqxv", kInitial);
  assert.equal(v.status, "unverified");
  assert.equal("phones" in v, false);
});

test("input is normalized before lookup", () => {
  assert.equal(verify("  Coral! ", kInitial).status, "pass");
});

test("verdicts carry broad IPA with schwa for unstressed AH", () => {
  assert.equal(toIpa("N AA1 T"), "nɑt");
  assert.equal(toIpa("K AO1 R AH0 L"), "kɔrəl");
  assert.equal(toIpa("B ER1 D"), "bɝd");
  const v = verify("coral", kInitial);
  assert.equal(v.status === "pass" && v.ipa, "kɔrəl");
});
