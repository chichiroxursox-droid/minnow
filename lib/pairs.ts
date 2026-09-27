import { dictionary } from "cmu-pronouncing-dictionary";
import { phonesFor, stripStress, type Position } from "./verify.ts";
import { toIpa } from "./ipa.ts";
// cmudict is full of surnames and rare words, so pairs only come from this common-word list.
// Built once by scripts/make-common-words.ts and checked against the dictionary.
import commonWords from "./common-words.json" with { type: "json" };

/** Typical substitution patterns in child speech: target sound, what the child says instead. */
export const COMMON_ERRORS: Record<string, string> = {
  K: "T", // fronting
  G: "D",
  SH: "S",
  CH: "T",
  JH: "D",
  S: "T", // stopping
  Z: "D",
  F: "P",
  V: "B",
  TH: "F",
  DH: "D",
  R: "W", // gliding
  L: "W",
  NG: "N",
};

export type Pair = { word: string; phones: string[]; ipa: string };

let index: Map<string, string[]> | null = null;

/** Pronunciation to common words, built once. */
function reverseIndex(): Map<string, string[]> {
  if (index) return index;
  index = new Map();
  for (const word of commonWords as string[]) {
    const entry = dictionary[word];
    if (!entry) continue;
    const key = entry.split(" ").map(stripStress).join(" ");
    const list = index.get(key);
    if (list) list.push(word);
    else index.set(key, [word]);
  }
  // Prefer ordinary-looking words: three or more letters, then shortest, then alphabetical.
  for (const list of index.values()) {
    list.sort((a, b) => Number(a.length < 3) - Number(b.length < 3) || a.length - b.length || a.localeCompare(b));
  }
  return index;
}

/**
 * The word you get by swapping the target phone, at the position being drilled, for the child's
 * error sound. Only returns a word the dictionary actually has, so it is a real minimal pair.
 */
export function minimalPair(word: string, target: string, position: Position, contrast: string): Pair | null {
  const phones = phonesFor(word);
  if (!phones) return null;
  const t = target.toUpperCase();
  const c = contrast.toUpperCase();
  if (!c || c === t) return null;
  const last = phones.length - 1;
  const i =
    position === "initial" ? 0 : position === "final" ? last : phones.findIndex((p, j) => p === t && j > 0 && j < last);
  if (i < 0 || phones[i] !== t) return null;
  const swapped = [...phones];
  swapped[i] = c;
  const hit = reverseIndex()
    .get(swapped.join(" "))
    ?.find((w) => w !== word.toLowerCase());
  return hit ? { word: hit, phones: swapped, ipa: toIpa(dictionary[hit]) } : null;
}
