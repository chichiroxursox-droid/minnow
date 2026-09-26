import { NextResponse } from "next/server";
import { configured, synthesize } from "@/lib/tts";

export const maxDuration = 15;

/** GET /api/speak?word=coral returns audio/mpeg. Cached words are served as static files instead, see PracticeSet.audio. */
export async function GET(req: Request) {
  const word = (new URL(req.url).searchParams.get("word") ?? "").toLowerCase();
  if (!/^[a-z']{1,30}$/.test(word)) return NextResponse.json({ error: "Invalid word" }, { status: 400 });
  if (!configured()) {
    return NextResponse.json(
      { error: "Live voice is offline (no ElevenLabs key on this deployment). Cached words still play." },
      { status: 503 },
    );
  }
  try {
    const bytes = await synthesize(word);
    return new Response(bytes, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (e) {
    console.error("speak failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Voice failed" }, { status: 502 });
  }
}
