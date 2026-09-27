// Pure helpers shared by the server routes and the page. No AI imports here, so the client bundle stays small.
import type { Verdict } from "./verify.ts";

export type TargetInput = {
  phoneme: string;
  position: "initial" | "medial" | "final";
  syllables: "1-2" | "3";
  theme: string;
  age: number;
};

export function seedKey(input: TargetInput): string {
  const theme = input.theme.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${input.phoneme}-${input.position}-${input.syllables}-${theme}-${input.age}`.toLowerCase();
}

/** Order for display: rejects first, then verified words, then unverified words last. */
const RANK: Record<Verdict["status"], number> = { fail: 0, pass: 1, unverified: 2 };

/**
 * Rejects first, then at most `count` verified words, then unverified words last.
 * Surplus passes are dropped; a short list is never padded with unverified words.
 */
export function arrange<T extends { verdict: Verdict }>(items: T[], count: number): T[] {
  let kept = 0;
  return [...items]
    .sort((a, b) => RANK[a.verdict.status] - RANK[b.verdict.status])
    .filter((it) => it.verdict.status !== "pass" || kept++ < count);
}
