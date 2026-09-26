# STATE

Read this file first at every session start. Append after every milestone. Never rewrite history, only append.

Rule: if a milestone is 90 minutes late, apply the next item in the scope cut order and log it.

## NEEDED FROM ETHAN
- (nothing yet)

## Milestones (bell was Sat Sept 26 10:00am EDT; this build started 11:57am)

| Clock | Hour | Done-when | Status |
|---|---|---|---|
| Sat 11:00am | 1 | Repo live, deployed to prod once, hello world on the real URL | |
| Sat 1:00pm | 3 | Verifier works in isolation with a passing `node --test` | |
| Sat 3:00pm | 5 | The one AI call returns valid typed output, cached seed saved | |
| Sat 6:00pm | 8 | GATE: a judge could use it end to end on the prod URL | |
| Sat 8:00pm | 10 | ElevenLabs Play load-bearing and visible. No new dependencies after this | |
| Sat 10:00pm | 12 | First backup recording saved. Tagged v0-demo | |
| Sun 12:30am | 14.5 | README first draft done | |
| Sun 6:00am | 20 | Code freeze. Tagged v1. Bug fixes only | |
| Sun 7:00am | 21 | Demo run clean on prod three times | |
| Sun 8:00am | 22 | Final backup video at ~/Desktop/minnow-demo.mp4. Hard stop on code | |
| Sun 9:15am | 23 | SUBMITTED | |

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
