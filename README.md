# Minnow

Articulation practice sets a speech-language pathologist can trust.

Claude proposes candidate words for a target sound. The CMU Pronouncing Dictionary verifies every word's phoneme position and syllable count. ElevenLabs says the survivors out loud. Words the dictionary rejects are shown first, struck through, with the dictionary's actual phonemes as the reason.

- Live: https://minnow-chiethan.vercel.app
- Built solo at OwlHacks 2026 (Temple University). Track: Health and Wellness. Sponsor prize entry: Best Use of ElevenLabs.

## What it does

An SLP picks a target sound (for example /k/), a word position (initial, medial, final), a syllable range, a theme, and a child's age, then clicks Build set.

1. Claude Haiku 4.5 is asked for twice as many words as needed, each with a short practice sentence and a kid definition.
2. Every proposed word is looked up in the CMU Pronouncing Dictionary and checked against the target. Rejects are listed first with the reason. Verified words are shown as practice cards, capped at the requested count. A short list is never padded.
3. Each verified word has a Play button. Cached words play from a stored MP3. New words are voiced live through ElevenLabs.
4. A check-a-word box lets the clinician type any word and get the dictionary's verdict instantly, no AI involved.

Three practice sets are cached in the repo, so the app still works with every API key removed.

## How the dictionary check works

`lib/verify.ts` is the whole mechanism. For a word and a target `{ phoneme, position, syllables, singleton }`:

1. **Lookup.** Normalize the word (lowercase, letters and apostrophes only) and look it up in `cmu-pronouncing-dictionary`, a packaged copy of cmudict. If it is missing, the result is `unverified`. That is not a verdict. Unverified words are shown separately and never counted as verified.
2. **Strip stress digits.** cmudict writes vowels with stress markers, for example `K AO1 R AH0 L`. The digits are removed so `AO1` and `AO0` both read as `AO`.
3. **Position check.** Initial means the first phone must be the target. Final means the last phone must be. Medial means the target appears at some index that is neither first nor last.
4. **Syllable count.** Syllables are counted as the number of vowel phones (the 15 ARPAbet vowels, including `ER`). The target range is 1 to 2 or exactly 3.
5. **Singletons only (optional).** The target may not sit next to another consonant, so `crab` (`K R AE B`) fails for /k/ initial when this is on.

A reject's reason is built from the dictionary's phones, never from the model. Examples:

| Word | Target | Verdict |
|---|---|---|
| knot | /k/ initial | `N AA T: starts with N, not K` |
| ocean | /k/ initial | `OW SH AH N: starts with OW, not K` |
| stars | /s/ final | `S T AA R Z: ends with Z, not S` |
| turkey | /r/ medial | `T ER K IY: no R` (vocalic `ER` is a vowel in ARPAbet, not consonantal R) |
| octopus | /k/ medial, 1 to 2 syllables | `AA K T AH P UH S: 3 syllables, wanted 1-2` |
| coral | /k/ initial | verified, `K AO R AH L` |

Tests live in `lib/verify.test.ts` and run with the Node test runner: `npm test`. They cover stress stripping, all three positions, syllable counting, the singleton option, and the missing-word case.

## The one AI call

`lib/propose.ts` makes a single structured call with the AI SDK (`generateText` with `Output.object`) to Claude Haiku 4.5, schema `{ items: [{ word, sentence, kid_definition }] }`, with an 8 second timeout. Only the word is verified. The sentence and definition come from the model and are not checked.

If the call fails or times out, `/api/propose` serves the cached seed for that target and says so on screen. If there is no seed for the target, it returns an error rather than inventing words.

## Voice

`/api/speak` calls the ElevenLabs text to speech API with `eleven_flash_v2_5` and returns `audio/mpeg`. Each cached practice word was synthesized once and stored under `public/seeds/<key>/<word>.mp3`. Live words that match a cached word reuse the file. Live synthesis stops when the account passes 7,000 of the free plan's 10,000 monthly characters, and cached words keep playing.

Voice audio is generated with ElevenLabs: https://elevenlabs.io

## Run it locally

```
npm install
npm run dev
```

Create `.env.local` with these four lines. The file is gitignored. With no keys the app still runs on the cached seeds.

```
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

- `npm test` runs the verifier tests.
- `node --env-file=.env.local scripts/make-seeds.ts` regenerates seed JSON and MP3s, reusing anything that already exists.
- `NODE_PATH=$(npm root -g) node scripts/demo-video.cjs [url] [outdir]` walks the demo path headlessly with the globally installed Playwright and records a video.

Stack: Next.js 15 App Router, TypeScript, Tailwind v4, AI SDK 7 with `@ai-sdk/anthropic`, zod 3, `cmu-pronouncing-dictionary`, ElevenLabs REST, Vercel.

## Limitations

- cmudict covers US English only. Words are checked against one General American pronunciation, the first entry in the dictionary.
- There is no dialect variation. A non-rhotic speaker's /r/, a regional vowel, or a child's own production are not modeled.
- The dictionary has about 135,000 entries. Real words that are missing come back as unverified, not as rejects.
- Only the word is verified. Sentences and kid definitions are model output.
- Syllables are counted from vowel phones, which is right for cmudict transcriptions but is not a clinical syllabification.
- Minnow is a drafting tool for clinicians. It is not a clinical or diagnostic instrument and it does not store, ask for, or process any patient or child data.

## AI disclosure

This project was built with Claude Code, Anthropic's coding agent, working from a written spec and milestone plan by the author. At runtime it uses Claude Haiku 4.5 to propose words and ElevenLabs to voice them. The dictionary verification is deterministic code with no AI in the loop.

## Credits

- Voice: ElevenLabs, https://elevenlabs.io
- Dictionary: the CMU Pronouncing Dictionary via the `cmu-pronouncing-dictionary` npm package
- Words, sentences, and definitions: Claude Haiku 4.5 by Anthropic
