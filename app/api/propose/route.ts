import { NextResponse } from "next/server";
import { ProposeInput, arrange, proposeLive, seedKey, type PracticeSet } from "@/lib/propose";
import { verify } from "@/lib/verify";
import { minimalPair } from "@/lib/pairs";
import { SEEDS } from "@/lib/seeds";

export const maxDuration = 30;

function describe(e: unknown): string {
  if (e instanceof Error && e.name === "TimeoutError") return "timed out after 8s";
  return (e instanceof Error ? e.message : String(e)).slice(0, 120);
}

/**
 * Attach what the seed has cached (MP3s, illustrations, pair MP3s) to any matching word, and
 * compute the minimal pair for the requested contrast on every verified word.
 */
function decorate(set: PracticeSet, input: ProposeInput, seed?: PracticeSet) {
  const audio = new Map<string, string>();
  const image = new Map<string, string>();
  for (const it of seed?.items ?? []) {
    const w = it.word.toLowerCase();
    if (it.audio) audio.set(w, it.audio);
    if (it.image) image.set(w, it.image);
    if (it.pair?.audio) audio.set(it.pair.word, it.pair.audio);
  }
  for (const it of set.items) {
    delete it.audio;
    delete it.image;
    delete it.pair;
    if (it.verdict.status !== "pass") continue;
    const w = it.word.toLowerCase();
    if (audio.has(w)) it.audio = audio.get(w);
    if (image.has(w)) it.image = image.get(w);
    const pair = input.contrast ? minimalPair(w, input.phoneme, input.position, input.contrast) : null;
    if (pair) it.pair = { ...pair, ...(audio.has(pair.word) ? { audio: audio.get(pair.word) } : {}) };
  }
}

export async function POST(req: Request) {
  const parsed = ProposeInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const input = parsed.data;
  const seed = SEEDS[seedKey(input)];

  let note: string;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const set = await proposeLive(input);
      decorate(set, input, seed);
      return NextResponse.json(set);
    } catch (e) {
      console.error("propose live failed", e);
      note = `Live generation failed (${describe(e)}). Showing the cached set.`;
    }
  } else {
    note = "No ANTHROPIC_API_KEY on this deployment. Showing the cached set.";
  }

  if (seed) {
    // Re-verify against the requested target so a different singleton setting still gets honest verdicts.
    const items = arrange(
      seed.items.map((it) => ({ ...it, verdict: verify(it.word, input) })),
      input.count,
    );
    const set: PracticeSet = { ...seed, input, items, note };
    decorate(set, input, seed);
    return NextResponse.json(set);
  }
  return NextResponse.json(
    { error: `${note.replace(" Showing the cached set.", "")} There is no cached set for this target.` },
    { status: 503 },
  );
}
