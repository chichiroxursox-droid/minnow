const BASE = "https://api.elevenlabs.io/v1";
export const MODEL_ID = "eleven_flash_v2_5";
/** Free tier is 10,000 characters a month. Live synthesis stops here to keep headroom for the demo. */
export const CHAR_CEILING = 7000;

function creds() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  return apiKey && voiceId ? { apiKey, voiceId } : null;
}

export const configured = () => creds() !== null;

export async function usage(): Promise<{ used: number; limit: number }> {
  const c = creds();
  if (!c) throw new Error("ElevenLabs is not configured");
  const r = await fetch(`${BASE}/user/subscription`, { headers: { "xi-api-key": c.apiKey } });
  if (!r.ok) throw new Error(`ElevenLabs subscription check failed: ${r.status}`);
  const j = (await r.json()) as { character_count: number; character_limit: number };
  return { used: j.character_count, limit: j.character_limit };
}

export async function assertUnderCeiling() {
  const u = await usage();
  if (u.used >= CHAR_CEILING) {
    throw new Error(`ElevenLabs credit ceiling reached (${u.used} of ${u.limit} characters used)`);
  }
  return u;
}

/** ElevenLabs accepts 0.7 to 1.2. Slower is easier for a young child to hear the target sound. */
export const SPEEDS = [1, 0.85, 0.7] as const;

/** Returns MP3 bytes. Throws when unconfigured, over the credit ceiling, or on an API error. */
export async function synthesize(text: string, { checkUsage = true, speed = 1 } = {}): Promise<ArrayBuffer> {
  const c = creds();
  if (!c) throw new Error("ElevenLabs is not configured");
  if (checkUsage) await assertUnderCeiling();
  const r = await fetch(`${BASE}/text-to-speech/${c.voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": c.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL_ID, ...(speed !== 1 ? { voice_settings: { speed } } : {}) }),
  });
  if (!r.ok) throw new Error(`ElevenLabs TTS failed: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.arrayBuffer();
}
