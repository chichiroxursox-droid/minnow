# STATE

Read this file first at every session start. Append after every milestone. Never rewrite history, only append.

Rule: if a milestone is 90 minutes late, apply the next item in the scope cut order and log it.

## NEEDED FROM ETHAN
- Submit on Devpost before Sun 9:15am EDT. Paste DEVPOST.md, prod URL https://minnow-chiethan.vercel.app, repo https://github.com/chichiroxursox-droid/minnow, track Health and Wellness, prize Best Use of ElevenLabs. Screenshot the confirmation.
- Upload ~/Desktop/minnow-demo.mp4 unlisted to YouTube for the Devpost video field (needs your account). The file is H.264, 39s, no audio track; it is the backup, the live demo has sound.
- Optional: point minnowwords.com at the Vercel project minnow (team chiethan) and add the domain in the dashboard. Not blocking.
- Before the live demo: open the prod URL on your laptop and phone once, pair the Bluetooth speaker, and press Play on a cached word to confirm audio. Live words cost ElevenLabs characters; usage was 63 of 10,000 at 2:00pm Saturday.

## Milestones (bell was Sat Sept 26 10:00am EDT; this build started 11:57am)

| Clock | Hour | Done-when | Status |
|---|---|---|---|
| Sat 11:00am | 1 | Repo live, deployed to prod once, hello world on the real URL |  hit 12:26pm (86 min late) |
| Sat 1:00pm | 3 | Verifier works in isolation with a passing `node --test` |  hit 12:36pm |
| Sat 3:00pm | 5 | The one AI call returns valid typed output, cached seed saved |  hit 1:12pm |
| Sat 6:00pm | 8 | GATE: a judge could use it end to end on the prod URL |  hit 1:42pm |
| Sat 8:00pm | 10 | ElevenLabs Play load-bearing and visible. No new dependencies after this |  hit 1:42pm |
| Sat 10:00pm | 12 | First backup recording saved. Tagged v0-demo |  hit 1:58pm, v0-demo |
| Sun 12:30am | 14.5 | README first draft done |  hit 2:10pm |
| Sun 6:00am | 20 | Code freeze. Tagged v1. Bug fixes only |  hit 2:15pm, v1 |
| Sun 7:00am | 21 | Demo run clean on prod three times |  hit 2:12pm |
| Sun 8:00am | 22 | Final backup video at ~/Desktop/minnow-demo.mp4. Hard stop on code |  hit 1:58pm (same file) |
| Sun 9:15am | 23 | SUBMITTED |  NEEDS ETHAN |

## Log

### Sat 11:57am, Hour 2, start
- Milestone: started late (bell was 10:00am)
- Done-when result: empty folder with .env.local and .gitignore only
- What broke: nothing yet
- Next step: scaffold Next.js 15, git init, gh repo, first prod deploy
- Scope cuts applied so far: none

### Sat 12:26pm, Hour 1 milestone
- Milestone: hit, MISSED by 86 minutes against the 11:00am clock (build started 11:57am)
- Done-when result: https://minnow-chiethan.vercel.app returns 200 with a hello world page; public repo at https://github.com/chichiroxursox-droid/minnow; four env vars set on Vercel production
- What broke: the chiethan team has Vercel Authentication on by default, so every URL redirected to SSO. Disabled ssoProtection for this project through the Vercel API. Note: minnow.vercel.app belongs to someone else, the prod alias is minnow-chiethan.vercel.app (also minnow-eta.vercel.app)
- Next step: lib/verify.ts and lib/verify.test.ts green under node --test
- Scope cuts applied so far: none (shadcn/ui skipped in favor of plain Tailwind, not a feature cut)

### Sat 12:36pm, Hour 3 milestone
- Milestone: hit, 24 minutes early against the 1:00pm clock
- Done-when result: `npm test` runs `node --test lib/verify.test.ts`, 7 tests green: stress stripping, initial/medial/final position, syllable count, singleton clusters, missing word returns unverified, input normalization. Committed, pushed, redeployed to prod
- What broke: nothing. Node 24 runs the .ts test directly; tsconfig needed allowImportingTsExtensions so next build type-checks the test import
- Next step: lib/propose.ts with generateObject + 8s timeout, /api/propose route, scripts/make-seeds.mjs, first seed JSON for K initial ocean age 6
- Scope cuts applied so far: none

### Sat 1:12pm, Hour 5 milestone
- Milestone: hit, 1h48m early against the 3:00pm clock
- Done-when result: `node --env-file=.env.local scripts/make-seeds.ts k-initial-1-2-ocean-6` produced public/seeds/k-initial-1-2-ocean-6.json (16 items from claude-haiku-4-5-20251001, all 16 verified) plus 16 MP3s. ElevenLabs usage 28 of 10,000 characters after seeding
- What broke: (1) checking ElevenLabs usage before every word hit a 429 on the subscription endpoint, and the script crashed before writing the JSON, so the first Haiku call was lost. Now the JSON is written before any TTS call, usage is checked once per run, and words are spaced 600ms. (2) The model read ARPAbet K as the letter k (kidney, kitten, kernel for ocean). Prompt now says the sound matters, not the spelling. Ten orphan MP3s from the first run stay on disk under the never-re-synthesize rule
- Next step: build the page, wire /api/propose, /api/verify, /api/speak, deploy, walk the demo path on prod
- Scope cuts applied so far: none

### Sat 1:42pm, Hour 8 GATE and Hour 10 milestone
- Milestone: both hit, 4h18m and 6h18m early against the 6:00pm and 8:00pm clocks
- Done-when result: headless Playwright walk on https://minnow-chiethan.vercel.app: pre-filled /k/ initial ocean age 6 builds live from claude-haiku-4-5-20251001 (16 proposed, 0 rejected, 8 kept), check box rejects "knot" with "N AA T: starts with N, not K" and "ocean" with "OW SH AH N: starts with OW, not K", Play on a verified word shows the Playing state, and the /r/ medial farm preset builds live with 5 rejects rendered first (fern "F ER N: no R", tore "T AO R: R is only at the edge, not medial"). Three seeds cached with MP3s. ElevenLabs usage 63 of 10,000 characters
- What broke: nothing on prod. Note the K ocean seed and live set had zero rejects this run, so the reject list is only visible on /k/ when the model slips; the check box and the /r/ and /s/ sets show it every time
- Next step: convert the recording to H.264 at ~/Desktop/minnow-demo.mp4, check frames, tag v0-demo, README, DEVPOST
- Scope cuts applied so far: none

### Sat 1:58pm, Hour 12 milestone
- Milestone: hit, 8h02m early against the 10:00pm clock
- Done-when result: ~/Desktop/minnow-demo.mp4 exists, H.264 1280x800, 39.4s, recorded headlessly from the prod URL by scripts/demo-video.cjs. Frames checked at 6s intervals: Building state, check box verdicts, /r/ medial rejects first. Tagged v0-demo. Offline walk against a local server with all four env vars blanked also passes: cached set with a visible note, Play from the static MP3, /r/ cached set shows 3 rejects first
- What broke: nothing
- Next step: README and DEVPOST drafts, three clean prod runs including a phone viewport, tag v1
- Scope cuts applied so far: none

### Sat 2:10pm, Hour 14.5 milestone
- Milestone: hit, 10h20m early against the Sun 12:30am clock
- Done-when result: README.md covers what it does, how the dictionary check works with a worked examples table, the one AI call, voice and caching, local run steps, limitations (US English only, no dialect variation, first pronunciation only, not a clinical tool, no child data), an AI disclosure (built with Claude Code; runtime Claude Haiku 4.5 and ElevenLabs), and the ElevenLabs attribution with a link. DEVPOST.md is 569 words and names the Health and Wellness track and Best Use of ElevenLabs. No em dashes in README, DEVPOST, UI copy, CLAUDE.md, or STATE.md
- What broke: I wrote a .env.example that .gitignore's .env* rule blocks. Removed it; README now shows the four lines to create by hand
- Next step: three clean prod runs, tag v1, final deploy
- Scope cuts applied so far: none

### Sat 2:12pm, Hour 21 milestone
- Milestone: hit, 16h48m early against the Sun 7:00am clock
- Done-when result: scripts/demo-video.cjs ran clean on https://minnow-chiethan.vercel.app three times at 1280x800 and once at an iPhone 13 viewport, exit 0 with no errors each time. Each run builds the /k/ initial ocean set live, rejects knot and ocean in the check box, plays a word, and builds the /r/ medial farm set live with rejects first. Phone layout checked by screenshot
- What broke: nothing
- Next step: tag v1 and deploy
- Scope cuts applied so far: none

### Sat 2:15pm, Hour 20 code freeze and Hour 22 final video
- Milestone: both hit early. Tagged v1 on the last commit. No code changes after this, only docs if needed. Hard stop for code stays Sun 8:00am EDT
- Done-when result: `npm test` 7 pass 0 fail; `next build` clean; prod deployed from main HEAD; ~/Desktop/minnow-demo.mp4 (H.264, 1280x800, 39.4s, frames checked) was recorded from the same app code that is on prod, so it stands as the final backup video
- What broke: nothing
- Next step: Ethan submits on Devpost, see NEEDED FROM ETHAN at the top
- Scope cuts applied so far: none. Everything in the kit's layout shipped except HALLWAY.md (no hallway testing happened) and shadcn/ui (plain Tailwind instead)

### Sat 2:15pm, Hour 23 submission
- Milestone: NOT DONE by Claude Code, needs Ethan. Devpost submission requires his account
- Done-when result: everything the submission needs exists: prod URL, public repo, DEVPOST.md text, backup video on the Desktop
- What broke: nothing
- Next step: submit before Sun 9:15am EDT and screenshot the confirmation
- Scope cuts applied so far: none
