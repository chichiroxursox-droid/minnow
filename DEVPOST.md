# Minnow

**Track:** Health and Wellness
**Sponsor prize:** Best Use of ElevenLabs
**Live:** https://minnow-chiethan.vercel.app
**Code:** https://github.com/chichiroxursox-droid/minnow

## Elevator pitch

Speech practice words you can trust. Claude suggests them, a pronunciation dictionary checks every sound, and ElevenLabs says them out loud for kids to copy.

## About the project

### Inspiration

Speech-language pathologists build articulation practice sets by hand: eight words that start with /k/, one or two syllables, about something a six-year-old loves. A language model writes that list instantly and gets it subtly wrong. "Knot" is spelled with a k but starts with /n/. "Stars" ends in /z/, not /s/. "Turkey" has an r but no consonant /r/. A child who drills a wrong word practices the wrong sound.

### What it does

**Therapist mode.** Pick a sound, position, syllable count, theme, and age. Claude Haiku 4.5 proposes twice the words needed and the CMU Pronouncing Dictionary checks each one. Rejects come first, struck through, with the dictionary's phonemes as the reason: `N AA T: starts with N, not K`, plus the IPA /nɑt/. Verified words become picture cards with a sentence, a minimal pair for the child's usual error (kite and tight), and a Play button voiced by ElevenLabs at normal or slow speed. A check box verifies any word, and one click prints a homework sheet.

**Family mode.** Twelve big sound buttons ("k as in kite"), start, middle, or end, then one picture card at a time with Hear it, Your turn, and Next. Only verified words appear.

### How I built it

Next.js 15 on Vercel, one structured call to Claude Haiku 4.5 through the AI SDK, and a verifier of about 90 lines of TypeScript over the CMU dictionary. It strips stress digits, checks where the target phone sits, and counts vowel phones as syllables. For /k/ at the start of a one or two syllable word:

$$\text{keep}(w)\iff p_1=\text{K}\;\land\;1\le\big|\{i:p_i\in V\}\big|\le2$$

where $p_1\dots p_n$ are the word's dictionary phones and $V$ is the 15 ARPAbet vowels. It has its own test suite.

Minimal pairs are computed, not generated: swap the target phone for the error sound and look the result up in a reverse index of about 2,900 common words. Every cached word and pair was voiced once with ElevenLabs `eleven_flash_v2_5` and saved, along with 22 pictures. Six practice sets ship cached, so the demo works with every API key removed.

### Challenges

- The model read ARPAbet `K` as the letter k and offered "kidney" for an ocean theme.
- It cannot count syllables. A three-syllable /k/ set kept 1 word of 16. Sending the rejects and their phonemes back for one more round now keeps 7 or 8, so the dictionary is feedback, not just a filter.
- The raw dictionary is full of surnames and rare spellings: "coral" paired with "tearle", "kick" with "tic". Pairs now come from a common-word list with a blocklist.
- Could ElevenLabs speech-to-text grade a child's attempt? It caught every real-word swap, but given the expected word, it rewrote 4 of 8 made-up errors like "tayak" as correct. That hides the very mistakes that matter, so Your turn stays record and play back.

### What I learned

Phonetics hides in plain sight. Vocalic r is a vowel in ARPAbet. Plural s is usually /z/. A dictionary catches these every time and a language model catches them most of the time, which is not good enough for therapy. The model proposes, the dictionary decides.

## What's next

- An on-device hint for therapists only: "we heard T AY T, the target was K AY T." Never a grade shown to a child.
- Dialect options and the dictionary's alternate pronunciations.
- Pictures for every word, and share links that carry an exact word list to a family.

## Disclosure

Built with Claude Code from my written spec. Minnow runs on Claude Haiku 4.5 and ElevenLabs; pictures were made once with Nano Banana 2 via kie.ai. Verification and minimal pairs are deterministic. Minnow is a practice tool, not a clinical instrument, and collects no patient or child data. Voice audio generated with ElevenLabs (elevenlabs.io).
