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
  /** 1, or 2 when the dictionary's rejects were sent back once for replacements. */
  rounds: number;
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

function reasonFor(v: Verdict): string {
  return v.status === "fail" ? v.reason : "not in the pronunciation dictionary";
}

/**
 * Round one asks for 2x count. If fewer than count survive the dictionary, round two sends
 * the rejects with the dictionary's reasons back to the model once and asks for replacements.
 * Models are poor at counting syllables, so three-syllable sets almost always need round two.
 */
export async function proposeLive(input: ProposeInput, timeoutMs = 8000): Promise<PracticeSet> {
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const three = input.syllables === "3";
  const system =
    "You write articulation practice items for a speech-language pathologist. " +
    `Target the sound /${ipaFor(input.phoneme)}/ (ARPAbet ${input.phoneme}) in ${input.position} position, ` +
    `${three ? "exactly three syllables (three vowel sounds, like banana, elephant, or umbrella)" : "one or two syllables"}, ` +
    `theme "${input.theme}", child age ${input.age}. ` +
    "Common English words only, no proper nouns, no repeats. " +
    "The sound matters, not the spelling: count how the word is pronounced, and silent letters do not count. " +
    (input.singleton ? "The target sound must not be part of a consonant cluster. " : "") +
    "Each item: word, one 4-8 word sentence containing the word, a one-clause kid definition.";

  const seen = new Set<string>();
  const items: SetItem[] = [];
  const passes = () => items.filter((i) => i.verdict.status === "pass").length;

  async function ask(prompt: string) {
    const { output } = await generateText({
      model: anthropic(model),
      output: Output.object({ schema: Items }),
      abortSignal: AbortSignal.timeout(timeoutMs),
      maxOutputTokens: 1500,
      system,
      prompt,
    });
    for (const it of output.items) {
      const w = it.word.toLowerCase().trim();
      if (!w || seen.has(w)) continue;
      seen.add(w);
      items.push({ ...it, word: it.word.trim(), verdict: verify(it.word, input) });
    }
  }

  await ask(`Return ${input.count * 2} items now.`);
  let rounds = 1;
  let note: string | undefined;

  if (passes() < input.count) {
    const rejected = items
      .filter((i) => i.verdict.status !== "pass")
      .map((i) => `${i.word} (${reasonFor(i.verdict)})`)
      .join("; ");
    const need = Math.min(16, (input.count - passes()) * 2);
    try {
      await ask(
        `The pronunciation dictionary rejected these words: ${rejected}. ` +
          `Return ${need} different items that avoid those problems. Do not reuse any of: ${[...seen].join(", ")}.`,
      );
      rounds = 2;
    } catch (e) {
      note = `Second round failed (${e instanceof Error ? e.message.slice(0, 80) : "error"}). Showing round one.`;
    }
  }

  return {
    key: seedKey(input),
    input,
    items: arrange(items, input.count),
    proposed: items.length,
    rounds,
    source: "live",
    model,
    generatedAt: new Date().toISOString(),
    ...(note ? { note } : {}),
  };
}

/**
 * Rejects first, then at most `count` verified words, then unverified words last.
 * Surplus passes are dropped; a short list is never padded with unverified words.
 */
export function arrange(items: SetItem[], count: number): SetItem[] {
  let kept = 0;
  return [...items]
    .sort((a, b) => RANK[a.verdict.status] - RANK[b.verdict.status])
    .filter((it) => it.verdict.status !== "pass" || kept++ < count);
}
