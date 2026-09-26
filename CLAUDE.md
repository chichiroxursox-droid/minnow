# Minnow

Articulation practice-set generator for speech-language pathologists. Claude Haiku proposes candidate words, the CMU Pronouncing Dictionary verifies phoneme position and syllable count, ElevenLabs voices the words that survive. Built solo for OwlHacks 2026. Track: Health and Wellness. Sponsor prize: Best Use of ElevenLabs.

## Session start
Read `STATE.md` first. Do not re-explore the repo. If anything at the top of STATE.md is listed under NEEDED FROM ETHAN, it is blocked on a human; work on everything else.

## Stack
Next.js 15 App Router, TypeScript, Tailwind v4, `ai` + `@ai-sdk/anthropic` (generateObject), zod v3, `cmu-pronouncing-dictionary`, ElevenLabs REST (`eleven_flash_v2_5`), Vercel production. No database, no auth, no new dependencies.

## Layout
- `app/page.tsx` form, preset chips, card list with rejects rendered first, check-a-word box, Play buttons
- `app/api/propose/route.ts` Haiku structured output (`generateText` + `Output.object`, the current form of generateObject in ai v7) with 8s timeout, verifies every word, falls back to the cached seed for that key
- `app/api/verify/route.ts` dictionary-only check for the check-a-word box, works with no keys
- `app/api/speak/route.ts` ElevenLabs text to speech, returns audio/mpeg, refuses when usage passes the credit ceiling
- `lib/verify.ts` cmudict verifier: strip stress digits, position check, vowel count, singleton option
- `lib/verify.test.ts` `node --test lib/verify.test.ts`, must stay green
- `lib/ipa.ts` IPA to ARPAbet consonant map
- `lib/seeds.ts` imports the cached seed JSON so the fallback works with every API key removed
- `public/seeds/<key>.json` and `public/seeds/<key>/<word>.mp3` cached output for three targets
- `scripts/make-seeds.ts` generates seed JSON and MP3s once, skips any MP3 that already exists: `node --env-file=.env.local scripts/make-seeds.ts [key]`
- `scripts/demo-video.cjs` headless Playwright walk and recording of the demo path: `NODE_PATH=$(npm root -g) node scripts/demo-video.cjs [url] [outdir]`

## The one AI mechanism
Input: `{ phoneme: ARPAbet, position: initial|medial|final, syllables: '1-2'|'3', theme, age, count }`. Ask the model for 2x count. Output schema: `{ items: [{ word, sentence, kid_definition }] }`. Then `verify()` runs on every word. If fewer than count pass, send the rejects with the dictionary's reasons back once for replacements (two rounds max, 8s timeout per round). A reject's reason is the dictionary's actual phonemes. A word missing from the dictionary is "unverified", never a verdict.

## Rules
- Never show a verdict the dictionary did not give.
- Never pad a short list with unverified words.
- No patient or child data anywhere.
- Generate each seed MP3 once and serve the cached file. Never re-synthesize a word that already has an MP3. Stop live TTS if ElevenLabs usage passes 7,000 characters and log it in STATE.md.
- No em dashes in UI copy, README, or DEVPOST.md.
- `.env*` is gitignored. Env vars: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`.
- Pipe build and test output to a file and read only the failures.
- If the same error survives 3 fix attempts, apply the next scope cut and log it.

## Scope cut order
rate slider, print cards, singleton toggle, theme field, kid definition, medial position, third seed. Never cut: verifier + test, rejects list, check box, Play, first seed.

## Deploy
`vercel --prod`. Never demo a preview URL. Hard stop for code changes: Sun Sept 27 8:00am EDT. Submit by 9:15am.
