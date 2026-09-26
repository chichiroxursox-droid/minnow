import { NextResponse } from "next/server";
import { ProposeInput, arrange, proposeLive, seedKey, type PracticeSet } from "@/lib/propose";
import { verify } from "@/lib/verify";
import { SEEDS } from "@/lib/seeds";

export const maxDuration = 30;

function describe(e: unknown): string {
  if (e instanceof Error && e.name === "TimeoutError") return "timed out after 8s";
  return (e instanceof Error ? e.message : String(e)).slice(0, 120);
}

/** Reuse cached MP3s for any live word that also appears in the seed for this target. */
function attachAudio(set: PracticeSet, seed: PracticeSet) {
  const audio = new Map(seed.items.filter((i) => i.audio).map((i) => [i.word.toLowerCase(), i.audio!]));
  for (const item of set.items) {
    const a = audio.get(item.word.toLowerCase());
    if (a && item.verdict.status === "pass") item.audio = a;
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
      if (seed) attachAudio(set, seed);
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
    const items = arrange(seed.items.map((it) => ({ ...it, verdict: verify(it.word, input) })), input.count);
    return NextResponse.json({ ...seed, input, items, note });
  }
  return NextResponse.json(
    { error: `${note.replace(" Showing the cached set.", "")} There is no cached set for this target.` },
    { status: 503 },
  );
}
