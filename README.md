# Minnow

Articulation practice sets a speech-language pathologist can trust.

Claude proposes candidate words for a target sound. The CMU Pronouncing Dictionary verifies every word's phoneme position and syllable count. ElevenLabs says the survivors out loud. Words the dictionary rejects are shown first, struck through, with the dictionary's actual phonemes as the reason.

- Live: https://minnow-chiethan.vercel.app
- Built solo at OwlHacks 2026 (Temple University). Track: Health and Wellness. Sponsor prize entry: Best Use of ElevenLabs.

## What it does

An SLP picks a target sound (for example /k/), a word position (initial, medial, final), a syllable range, a theme, and a child's age, then clicks Build set.

1. Claude Haiku 4.5 is asked for twice as many words as needed, each with a short practice sentence and a kid definition.
2. Every proposed word is looked up in the CMU Pronouncing Dictionary and checked against the target. Rejects are listed first with the reason. Verified words are shown as practice cards, capped at the requested count. A short list is never padded.
3. Each verified word has a Play button. Cached words play from a stored MP3. New words are voiced live through ElevenLabs, at normal, slow, or slower speed.
4. Pick what the child says instead of the target (it defaults to the usual pattern, /t/ for /k/, /w/ for /r/) and every verified word shows its minimal pair when the dictionary has one: cape and tape, bus and but.
5. "Your turn" records the child for 2.5 seconds in the browser and plays it back next to the model. Nothing is uploaded or stored.
6. Cached words have a picture. "Print homework" turns the verified cards into a sheet with a tally row.
7. A check-a-word box lets the clinician type any word and get the dictionary's verdict, and its pair, instantly. No AI involved.

Six practice sets are cached in the repo, so the app still works with every API key removed. The cached /k/ ocean set is on screen the moment the page loads; Build set replaces it with a fresh live one. Every phoneme string is shown in both the dictionary's ARPAbet and broad IPA (`K AO R AH L /kɔrəl/`), and the whole target lives in the URL, so a link like `?sound=SH&position=initial&theme=kitchen&age=7` opens straight to that set.

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

Tests live in `lib/verify.test.ts` and run with the Node test runner: `npm test`. They cover stress stripping, all three positions, syllable counting, the singleton option, the missing-word case, and the ARPAbet to IPA conversion (unstressed `AH0` becomes schwa).

## Minimal pairs

Minimal pairs therapy contrasts the target with the sound the child produces instead. `lib/pairs.ts` swaps the target phone, at the position being drilled, for the child's error sound and looks the result up in a reverse index of the dictionary. Only a real dictionary word comes back, so "cape" gives "tape", "coast" gives "toast", "kite" gives "tight", "bus" gives "but", and "coral" gives nothing. The index is limited to `lib/common-words.json`, about 2,900 common words, because cmudict is full of surnames ("coral" would otherwise pair with "tearle"). That list was drafted once by Claude Haiku, filtered against the dictionary, and topped up with a hand list of classic minimal-pair words. Tests are in `lib/pairs.test.ts`.

## The one AI call

`lib/propose.ts` makes a structured call with the AI SDK (`generateText` with `Output.object`) to Claude Haiku 4.5, schema `{ items: [{ word, sentence, kid_definition }] }`, with an 8 second timeout, asking for twice the words needed. Only the word is verified. The sentence and definition come from the model and are not checked.

If fewer words survive than were asked for, the rejected words and the dictionary's reasons go back to the model once ("carrot (K AE R AH T: 2 syllables, wanted 3)") with a request for replacements. Three-syllable sets almost always need this second round, because the model is poor at counting syllables. The status line says "in 2 rounds" when it happened.

If the call fails or times out, `/api/propose` serves the cached seed for that target and says so on screen. If there is no seed for the target, it returns an error rather than inventing words.

## Voice

`/api/speak` calls the ElevenLabs text to speech API with `eleven_flash_v2_5` and returns `audio/mpeg`. Each cached practice word and its minimal pair was synthesized once and stored under `public/seeds/<key>/<word>.mp3`. Live words that match a cached word reuse the file. The voice speed control (normal, slow, slower) uses the ElevenLabs `speed` voice setting; slowed words are always live calls. Live synthesis stops when the account passes 7,000 of the free plan's 10,000 monthly characters, and cached words keep playing.

Voice audio is generated with ElevenLabs: https://elevenlabs.io

## Your turn

Each verified card has a "Your turn" button. It records 2.5 seconds from the microphone with the browser's MediaRecorder, keeps the clip in memory as an object URL, and offers "Play yours" next to the model's Play. Nothing leaves the browser tab. There is no scoring on purpose: speech recognition normalizes articulation errors, so it would grade a lisp as correct.

## Pictures

Each cached word has a flat illustration made once with Nano Banana 2 through kie.ai (`scripts/make-images.sh`), stored at 512px under `public/seeds/<key>/<word>.jpg`. Live words that match a cached word reuse the picture. Other live words have no picture rather than a wrong one.

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
- `NODE_PATH=$(npm root -g) node scripts/demo-video.cjs [url] [outdir]` walks the demo path headlessly with the globally installed Playwright, records a video, and writes the time of each demo beat.
- `node --env-file=.env.local scripts/narrate.ts [outdir] [out.mp4]` voices one narration line per beat with ElevenLabs (each line is synthesized once and cached) and mixes it over the recording.

Stack: Next.js 15 App Router, TypeScript, Tailwind v4, AI SDK 7 with `@ai-sdk/anthropic`, zod 3, `cmu-pronouncing-dictionary`, ElevenLabs REST, Vercel.

## Limitations

- cmudict covers US English only. Words are checked against one General American pronunciation, the first entry in the dictionary.
- There is no dialect variation. A non-rhotic speaker's /r/, a regional vowel, or a child's own production are not modeled.
- The dictionary has about 135,000 entries. Real words that are missing come back as unverified, not as rejects.
- Only the word is verified. Sentences and kid definitions are model output.
- Minimal pairs only come from the common-word list, so some real pairs are missed. Medial /r/ rarely has a pair in English.
- Pictures exist only for cached words. "Your turn" plays back, it does not judge.
- Syllables are counted from vowel phones, which is right for cmudict transcriptions but is not a clinical syllabification.
- Minnow is a drafting tool for clinicians. It is not a clinical or diagnostic instrument and it does not store, ask for, or process any patient or child data.

## AI disclosure

This project was built with Claude Code, Anthropic's coding agent, working from a written spec and milestone plan by the author. At runtime it uses Claude Haiku 4.5 to propose words and ElevenLabs to voice them. The dictionary verification and the minimal pairs are deterministic code with no AI in the loop. The common-word list was drafted once by Claude Haiku and the cached pictures were made once with Nano Banana 2 via kie.ai.

## Credits

- Voice: ElevenLabs, https://elevenlabs.io
- Pictures: Nano Banana 2 via kie.ai
- Dictionary: the CMU Pronouncing Dictionary via the `cmu-pronouncing-dictionary` npm package
- Words, sentences, and definitions: Claude Haiku 4.5 by Anthropic
