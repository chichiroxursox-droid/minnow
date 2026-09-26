import { dictionary } from "cmu-pronouncing-dictionary";

export type Position = "initial" | "medial" | "final";
export type SyllableRange = "1-2" | "3";

export type Target = {
  /** ARPAbet consonant, e.g. "K" */
  phoneme: string;
  position: Position;
  syllables: SyllableRange;
  /** When true, the target may not sit next to another consonant (no clusters). */
  singleton?: boolean;
};

export type Verdict =
  | { status: "pass"; word: string; phones: string[] }
  | { status: "fail"; word: string; phones: string[]; reason: string }
  | { status: "unverified"; word: string; reason: string };

const VOWELS = new Set([
  "AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY", "OW", "OY", "UH", "UW",
]);

export function stripStress(phone: string): string {
  return phone.replace(/\d$/, "");
}

export function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/[^a-z']/g, "");
}

/** Dictionary phones with stress digits removed, or null when the word is not in cmudict. */
export function phonesFor(word: string): string[] | null {
  const entry = dictionary[normalizeWord(word)];
  return entry ? entry.split(" ").map(stripStress) : null;
}

export function syllableCount(phones: string[]): number {
  return phones.filter((p) => VOWELS.has(p)).length;
}

function isSingletonAt(phones: string[], i: number): boolean {
  const before = phones[i - 1];
  const after = phones[i + 1];
  return (before === undefined || VOWELS.has(before)) && (after === undefined || VOWELS.has(after));
}

export function verify(word: string, target: Target): Verdict {
  const phones = phonesFor(word);
  if (!phones) return { status: "unverified", word, reason: "Not in the CMU dictionary" };

  const t = target.phoneme.toUpperCase();
  const spelled = phones.join(" ");
  const fail = (reason: string): Verdict => ({ status: "fail", word, phones, reason: `${spelled}: ${reason}` });
  const last = phones.length - 1;

  // Position: which indexes count as a hit for this position.
  let hits: number[];
  if (target.position === "initial") {
    if (phones[0] !== t) return fail(`starts with ${phones[0]}, not ${t}`);
    hits = [0];
  } else if (target.position === "final") {
    if (phones[last] !== t) return fail(`ends with ${phones[last]}, not ${t}`);
    hits = [last];
  } else {
    hits = phones.map((p, i) => (p === t && i > 0 && i < last ? i : -1)).filter((i) => i >= 0);
    if (hits.length === 0) {
      return fail(phones.includes(t) ? `${t} is only at the edge, not medial` : `no ${t}`);
    }
  }

  const n = syllableCount(phones);
  const okSyllables = target.syllables === "3" ? n === 3 : n >= 1 && n <= 2;
  if (!okSyllables) return fail(`${n} syllable${n === 1 ? "" : "s"}, wanted ${target.syllables}`);

  if (target.singleton && !hits.some((i) => isSingletonAt(phones, i))) {
    return fail(`${t} is in a consonant cluster`);
  }

  return { status: "pass", word, phones };
}
