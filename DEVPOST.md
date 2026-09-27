# Minnow

**Track:** Health and Wellness
**Sponsor prize:** Best Use of ElevenLabs
**Live:** https://minnow-chiethan.vercel.app
**Code:** https://github.com/chichiroxursox-droid/minnow

## Inspiration

Speech-language pathologists build articulation practice sets by hand: eight words with /k/ at the start, one or two syllables, something a six-year-old cares about. Language models are happy to write that list, and they get it subtly wrong. "Knot" starts with the letter k and the sound /n/. "Stars" ends in /z/, not /s/. "Turkey" has the letter r but no consonant /r/. A clinician who trusts the list drills the wrong sound. Minnow lets the model do the creative part and makes a dictionary do the checking.

## What it does

Pick a sound, a position (initial, medial, final), a syllable range, a theme, and an age. Claude Haiku 4.5 proposes twice as many words as you asked for, each with a short sentence and a kid definition. Every word is looked up in the CMU Pronouncing Dictionary and checked against the target. Rejected words are shown first, struck through, with the dictionary's actual phonemes as the reason: "N AA T: starts with N, not K." Verified words become picture cards with a Play button, voiced by ElevenLabs at normal or slow speed. Pick what the child says instead of the target and every card shows its real minimal pair from the dictionary: cape and tape, bus and but. "Your turn" records the child in the browser and plays both back; nothing is uploaded. One click prints a homework sheet. A check-a-word box gives an instant verdict on anything the clinician types, with no AI involved.

## How I built it

Next.js 15 on Vercel, one structured call to Claude Haiku 4.5 through the AI SDK, and a verifier in about 70 lines of TypeScript on top of the cmudict package. The verifier strips stress digits, checks the target phone's position, counts vowel phones for syllables, and optionally rejects consonant clusters. It has its own test suite under the Node test runner. When too few words survive, the rejects and their phonemes go back to the model once for replacements, so the dictionary is feedback, not just a filter.

ElevenLabs is the voice. Every verified word gets a Play button. Cached practice words were synthesized once with `eleven_flash_v2_5` and stored as MP3s in the repo. New words are voiced live through the ElevenLabs API, and live words that match a cached one reuse the file. A usage guard stops live synthesis before the free plan runs dry, so cached audio always keeps playing.

Six practice sets ship cached, so the whole demo path, including Play, works with every API key removed. Phonemes show in both ARPAbet and IPA, since IPA is what SLPs read. The demo video is narrated by the same ElevenLabs voice.

## Challenges

The model reads ARPAbet "K" as the letter k and offers "kidney" for an ocean theme, so the prompt says the sound matters, not the spelling. It cannot count syllables at all; three-syllable sets came back almost empty until the rejects were fed back. Minimal pairs from the raw dictionary paired "coral" with the surname "tearle", so pairs are limited to a common-word list.

## What I learned

The interesting bugs are phonetic, not technical. Vocalic /r/ is a vowel (ER) in ARPAbet, so "farmer" has one consonant /r/ and "turkey" has none. Plural s is usually /z/. A dictionary catches those every time and a language model catches them most of the time, which is not good enough for therapy.

## What's next

Print-ready card sheets, a pass through the dictionary's alternate pronunciations, and a speaking-rate control on the ElevenLabs voice for younger kids.

## Disclosure

Built with Claude Code from a written spec and milestone plan. Runtime uses Claude Haiku 4.5 and ElevenLabs. Verification is deterministic. Minnow is a drafting tool, not a clinical instrument, and it handles no patient or child data. Voice audio generated with ElevenLabs (elevenlabs.io).
