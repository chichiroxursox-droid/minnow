import { NextResponse } from "next/server";
import { configured, synthesize, SPEEDS } from "@/lib/tts";

export const maxDuration = 15;

/**
 * GET /api/speak?word=coral&speed=0.85 returns audio/mpeg.
 * Cached words at normal speed are served as static files instead, see SetItem.audio.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const word = (url.searchParams.get("word") ?? "").toLowerCase();
  const speed = Number(url.searchParams.get("speed") ?? 1);
  if (!/^[a-z']{1,30}$/.test(word)) return NextResponse.json({ error: "Invalid word" }, { status: 400 });
  if (!(SPEEDS as readonly number[]).includes(speed)) return NextResponse.json({ error: "Invalid speed" }, { status: 400 });
  if (!configured()) {
    return NextResponse.json(
      { error: "Live voice is offline (no ElevenLabs key on this deployment). Cached words still play at normal speed." },
      { status: 503 },
    );
  }
  try {
    const bytes = await synthesize(word, { speed });
    return new Response(bytes, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (e) {
    console.error("speak failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Voice failed" }, { status: 502 });
  }
}
