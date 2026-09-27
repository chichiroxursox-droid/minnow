// Generates the cached seed sets. Run once per target:
//   node --env-file=.env.local scripts/make-seeds.ts [key]
// Reuses an existing seed JSON instead of calling Claude again, and never
// re-synthesizes a word that already has an MP3 on disk.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { proposeLive, seedKey, type PracticeSet, type ProposeInput } from "../lib/propose.ts";
import { normalizeWord, verify } from "../lib/verify.ts";
import { assertUnderCeiling, synthesize, usage } from "../lib/tts.ts";
import { COMMON_ERRORS, minimalPair } from "../lib/pairs.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TARGETS: ProposeInput[] = [
  { phoneme: "K", position: "initial", syllables: "1-2", theme: "ocean", age: 6, count: 8, singleton: false, contrast: "T" },
  { phoneme: "R", position: "medial", syllables: "1-2", theme: "farm", age: 7, count: 8, singleton: false, contrast: "W" },
  { phoneme: "S", position: "final", syllables: "1-2", theme: "space", age: 8, count: 8, singleton: false, contrast: "T" },
  { phoneme: "S", position: "initial", syllables: "1-2", theme: "school", age: 6, count: 8, singleton: false, contrast: "T" },
  { phoneme: "L", position: "initial", syllables: "1-2", theme: "zoo", age: 5, count: 8, singleton: false, contrast: "W" },
  { phoneme: "SH", position: "initial", syllables: "1-2", theme: "kitchen", age: 7, count: 8, singleton: false, contrast: "S" },
];

const only = process.argv[2];

for (const input of TARGETS) {
  const key = seedKey(input);
  if (only && key !== only) continue;
  const jsonPath = `public/seeds/${key}.json`;
  const dir = `public/seeds/${key}`;
  mkdirSync(dir, { recursive: true });

  let set: PracticeSet;
  if (existsSync(jsonPath)) {
    set = JSON.parse(readFileSync(jsonPath, "utf8"));
    // Re-verify so verdict fields added since (like IPA) land in the cached JSON. Dictionary only, no cost.
    for (const it of set.items) it.verdict = verify(it.word, input);
    console.log(`${key}: reusing cached JSON (${set.items.length} items)`);
  } else {
    set = await proposeLive(input, 20000);
    set.source = "seed";
    const tally = { pass: 0, fail: 0, unverified: 0 };
    for (const it of set.items) tally[it.verdict.status]++;
    console.log(`${key}: ${set.items.length} items from ${set.model}:`, tally);
    // Save the proposal before any TTS call so a voice failure never costs a second Claude call.
    writeFileSync(jsonPath, JSON.stringify(set, null, 2) + "\n");
  }

  await assertUnderCeiling();
  const speak = async (w: string) => {
    const file = `${dir}/${w}.mp3`;
    if (!existsSync(file)) {
      writeFileSync(file, Buffer.from(await synthesize(w, { checkUsage: false })));
      console.log(`  synthesized ${w}`);
      await sleep(600);
    }
    return `/seeds/${key}/${w}.mp3`;
  };
  const contrast = COMMON_ERRORS[input.phoneme] ?? "";
  for (const item of set.items) {
    if (item.verdict.status !== "pass") continue;
    const w = normalizeWord(item.word);
    item.audio = await speak(w);
    // Illustrations are made separately by scripts/make-images.sh; attach any that exist.
    const img = `${dir}/${w}.jpg`;
    if (existsSync(img)) item.image = `/seeds/${key}/${w}.jpg`;
    else delete item.image;
    // Minimal pair for the typical error sound, voiced once so the demo works offline.
    const pair = contrast ? minimalPair(w, input.phoneme, input.position, contrast) : null;
    if (pair) item.pair = { ...pair, audio: await speak(pair.word) };
    else delete item.pair;
  }
  writeFileSync(jsonPath, JSON.stringify(set, null, 2) + "\n");
  console.log(`  wrote ${jsonPath}`);
}

const u = await usage();
console.log(`ElevenLabs usage: ${u.used} of ${u.limit} characters`);
