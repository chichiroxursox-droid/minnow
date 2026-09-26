import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { verify, type Verdict } from "./verify.ts";
import { ipaFor } from "./ipa.ts";

export const ProposeInput = z.object({
  phoneme: z.string().regex(/^[A-Z]{1,2}$/, "ARPAbet consonant"),
  position: z.enum(["initial", "medial", "final"]),
  syllables: z.enum(["1-2", "3"]),
  theme: z.string().trim().min(1).max(40),
  age: z.number().int().min(2).max(18),
  count: z.number().int().min(1).max(12).default(8),
  singleton: z.boolean().default(false),
});
export type ProposeInput = z.infer<typeof ProposeInput>;

const Items = z.object({
  items: z.array(
    z.object({
      word: z.string(),
      sentence: z.string(),
      kid_definition: z.string(),
    }),
  ),
});

export type SetItem = z.infer<typeof Items>["items"][number] & {
  verdict: Verdict;
  /** Path to a cached MP3 under /public/seeds, when one exists. */
  audio?: string;
};

export type PracticeSet = {
  key: string;
  input: ProposeInput;
  items: SetItem[];
  /** How many distinct words the model proposed before verification. */
  proposed: number;
  source: "live" | "seed";
  model: string;
  generatedAt: string;
  note?: string;
};

export function seedKey(input: ProposeInput): string {
  const theme = input.theme.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${input.phoneme}-${input.position}-${input.syllables}-${theme}-${input.age}`.toLowerCase();
}

export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

/** Order for display: rejects first, then verified words, then unverified words last. */
const RANK: Record<Verdict["status"], number> = { fail: 0, pass: 1, unverified: 2 };

export async function proposeLive(input: ProposeInput, timeoutMs = 8000): Promise<PracticeSet> {
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const ipa = ipaFor(input.phoneme);
  const ask = input.count * 2;

  const { output } = await generateText({
    model: anthropic(model),
    output: Output.object({ schema: Items }),
    abortSignal: AbortSignal.timeout(timeoutMs),
    maxOutputTokens: 1500,
    system:
      "You write articulation practice items for a speech-language pathologist. " +
      `Target the sound /${ipa}/ (ARPAbet ${input.phoneme}) in ${input.position} position, ` +
      `${input.syllables} syllables, theme "${input.theme}", child age ${input.age}. ` +
      `Return ${ask} items. Common English words only, no proper nouns, no repeats. ` +
      "The sound matters, not the spelling: count how the word is pronounced, and silent letters do not count. " +
      "Each item: word, one 4-8 word sentence containing the word, a one-clause kid definition.",
    prompt: `Give me ${ask} practice words now.`,
  });

  const seen = new Set<string>();
  const items: SetItem[] = output.items
    .filter((it) => {
      const w = it.word.toLowerCase().trim();
      if (!w || seen.has(w)) return false;
      seen.add(w);
      return true;
    })
    .map((it) => ({ ...it, word: it.word.trim(), verdict: verify(it.word, input) }));

  return {
    key: seedKey(input),
    input,
    items: arrange(items, input.count),
    proposed: items.length,
    source: "live",
    model,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Rejects first, then at most `count` verified words, then unverified words last.
 * Surplus passes are dropped; a short list is never padded with unverified words.
 */
export function arrange(items: SetItem[], count: number): SetItem[] {
  let passes = 0;
  return [...items]
    .sort((a, b) => RANK[a.verdict.status] - RANK[b.verdict.status])
    .filter((it) => it.verdict.status !== "pass" || passes++ < count);
}
