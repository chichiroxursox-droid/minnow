# Tasks — Minnow

**About:** OwlHacks 2026 articulation practice-set generator. Claude Haiku proposes words, cmudict verifies them, ElevenLabs voices them. Prod: https://minnow-chiethan.vercel.app. See STATE.md for the milestone log.

## Active

- **Priority:** P1 | **Status:** waiting on Ethan | **Description:** Approve the picture batch for the remaining cached words (about 20 images, roughly 8 kie credits each, 166 left), then run scripts/make-images.sh, scripts/make-seeds.ts, redeploy, re-record the video.

- **Priority:** P0 | **Status:** waiting on Ethan | **Description:** Submit on Devpost before Sun Sept 27 9:15am EDT with DEVPOST.md, the prod URL, the repo, track Health and Wellness, prize Best Use of ElevenLabs. Upload ~/Desktop/minnow-demo.mp4 unlisted for the video field.
- **Priority:** P2 | **Status:** optional | **Description:** Point minnowwords.com at the Vercel project minnow (team chiethan).

## Resolved

- 2026-09-26: Scaffolded, deployed to prod, public repo, four env vars on Vercel production.
- 2026-09-26: Verifier plus 7 node --test cases, three cached seeds with MP3s, propose/verify/speak routes, page, offline fallback, demo walk script, backup video, README, DEVPOST. Tagged v0-demo and v1.
- 2026-09-26: v1.1, three-syllable sets were nearly empty. Rejects and their phonemes now go back to the model once for replacements. /k/ initial 3 syllables went from 1 kept to 7 or 8.
- 2026-09-26: v1.2, minimal pairs from the dictionary, voice speed, homework print, Your turn record and playback, cached pictures for crab and coral.
