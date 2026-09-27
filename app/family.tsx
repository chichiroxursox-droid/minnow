"use client";

// Family mode: the essentials for a parent and child. Pick a sound, see the picture,
// hear the word, say it back. Only dictionary-verified words are ever shown here.
import { useState } from "react";
import type { PracticeSet, ProposeInput, SetItem } from "@/lib/propose";
import { PRESETS } from "@/lib/seeds";
import { Mark, MicIcon, PlayIcon, Seg, btn } from "./ui";

type Form = Omit<ProposeInput, "count">;

/** Sounds kids most often practice, spelled the way a parent would say them, with a word that starts with each. */
const SOUNDS: { arpabet: string; label: string; example: string }[] = [
  { arpabet: "K", label: "k", example: "kite" },
  { arpabet: "G", label: "g", example: "goat" },
  { arpabet: "F", label: "f", example: "fish" },
  { arpabet: "V", label: "v", example: "van" },
  { arpabet: "S", label: "s", example: "sun" },
  { arpabet: "Z", label: "z", example: "zoo" },
  { arpabet: "L", label: "l", example: "lion" },
  { arpabet: "R", label: "r", example: "rabbit" },
  { arpabet: "SH", label: "sh", example: "shoe" },
  { arpabet: "CH", label: "ch", example: "chair" },
  { arpabet: "JH", label: "j", example: "jam" },
  { arpabet: "TH", label: "th", example: "thumb" },
];
const WHERE = ["Start", "Middle", "End"] as const;
const TO_POSITION = { Start: "initial", Middle: "medial", End: "final" } as const;
const FROM_POSITION = { initial: "Start", medial: "Middle", final: "End" } as const;
const IDEAS = ["animals", "ocean", "space", "trucks", "food", "dinosaurs"];

export function soundLabel(arpabet: string) {
  return SOUNDS.find((s) => s.arpabet === arpabet)?.label ?? arpabet.toLowerCase();
}

type Props = {
  form: Form;
  setForm: (f: Form) => void;
  choosePreset: (f: Form) => void;
  set: PracticeSet | null;
  loading: boolean;
  elapsed: number;
  error: string | null;
  build: () => void;
  play: (word: string, cached?: string) => void;
  playing: string | null;
  record: (word: string) => void;
  recording: string | null;
  recordings: Record<string, string>;
};

export function FamilyView(p: Props) {
  const { form, setForm, set, loading } = p;
  const cards = set?.items.filter((i) => i.verdict.status === "pass") ?? [];

  return (
    <>
      <section className="rounded-2xl border border-sand bg-shell p-5 shadow-card sm:p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Which sound?</h2>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {SOUNDS.map((s) => {
            const on = form.phoneme === s.arpabet;
            return (
              <button
                key={s.arpabet}
                type="button"
                aria-pressed={on}
                aria-label={`${s.label} as in ${s.example}`}
                onClick={() => setForm({ ...form, phoneme: s.arpabet })}
                className={`rounded-xl border px-2 py-2.5 text-center transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                  on ? "border-teal bg-teal text-white" : "border-sand-deep bg-paper text-ink hover:border-teal"
                }`}
              >
                <span className="block font-display text-2xl font-semibold leading-none">{s.label}</span>
                <span className={`mt-1 block text-xs ${on ? "text-white/85" : "text-ink-soft"}`}>as in {s.example}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Where in the word?</h2>
            <div className="mt-2">
              <Seg size="lg" value={FROM_POSITION[form.position]} options={WHERE} onChange={(w) => setForm({ ...form, position: TO_POSITION[w] })} />
            </div>
          </div>
          <label className="min-w-0 flex-1">
            <span className="block font-display text-xl font-semibold text-ink">What do they love?</span>
            <input
              value={form.theme}
              maxLength={40}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              className="mt-2 h-12 w-full max-w-xs rounded-lg border border-sand-deep bg-shell px-3 text-base text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/25"
            />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setForm({ ...form, theme: idea })}
              className="rounded-full border border-sand-deep bg-paper px-3 py-1 text-sm text-ink transition-colors duration-150 hover:border-teal hover:text-teal-deep outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
            >
              {idea}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={p.build}
          disabled={loading || !form.theme.trim()}
          className={`${btn} mt-6 h-12 w-full justify-center bg-teal text-base text-white shadow-card hover:bg-teal-deep disabled:opacity-60 sm:w-auto sm:px-8`}
        >
          {loading && <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-white/90" aria-hidden="true" />}
          {loading ? "Finding words" : "Make practice words"}
        </button>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-sand pt-4 text-sm text-ink-soft">
          <span>Ready now:</span>
          {PRESETS.filter((x) => x.syllables === "1-2").map((x) => (
            <button
              key={`${x.phoneme}-${x.position}-${x.theme}`}
              type="button"
              onClick={() => p.choosePreset({ ...x, contrast: "" })}
              className="rounded-full border border-sand-deep bg-paper px-3 py-1 text-ink transition-colors duration-150 hover:border-teal hover:text-teal-deep outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
            >
              {soundLabel(x.phoneme)} {FROM_POSITION[x.position].toLowerCase()} · {x.theme}
            </button>
          ))}
        </div>
      </section>

      {p.error && <p className="mt-5 rounded-lg bg-coral-mist px-4 py-3 text-coral">{p.error}</p>}

      {loading && (
        <section className="rise mt-8" data-testid="loading" aria-busy="true">
          <div className="flex items-center gap-4 rounded-2xl border border-sand bg-shell p-5 shadow-card">
            <Mark className="swim" />
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold text-ink">Finding words for you</p>
              <p className="text-sm text-ink-soft">Claude suggests words, and a pronunciation dictionary checks each one really has the sound.</p>
            </div>
            <span className="ml-auto font-mono text-sm tabular-nums text-ink-soft">{p.elapsed}s</span>
          </div>
          <div className="mt-4 rounded-3xl border border-sand bg-shell p-6" aria-hidden="true">
            <div className="shimmer mx-auto h-56 w-56 rounded-2xl" />
            <div className="shimmer mx-auto mt-6 h-12 w-48 rounded-lg" />
            <div className="shimmer mx-auto mt-4 h-4 w-64 rounded" />
          </div>
        </section>
      )}

      {!loading && set && cards.length > 0 && <Flashcards key={set.generatedAt + set.key} cards={cards} {...p} />}
      {!loading && set && cards.length === 0 && (
        <p className="mt-8 rounded-2xl border border-sand bg-shell p-6 text-center text-ink-soft">No words this time. Try another theme.</p>
      )}
      {!loading && !set && !p.error && (
        <p className="mt-8 rounded-2xl border border-dashed border-sand-deep p-6 text-center text-ink-soft">
          Press <span className="font-medium text-ink">Make practice words</span> to get picture cards for this sound.
        </p>
      )}
    </>
  );
}

function Flashcards({ cards, play, playing, record, recording, recordings }: Props & { cards: SetItem[] }) {
  const [i, setI] = useState(0);
  const card = cards[Math.min(i, cards.length - 1)];
  const tried = cards.filter((c) => recordings[c.word]).length;
  const heard = playing === card.word;

  return (
    <section className="rise mt-8" data-testid="flashcards">
      <div className="rounded-3xl border border-sand bg-shell p-6 text-center shadow-card sm:p-8">
        {card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image} alt={card.word} className="mx-auto h-56 w-56 rounded-2xl bg-paper object-cover ring-1 ring-sand sm:h-64 sm:w-64" />
        ) : (
          <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl bg-teal-mist font-display text-8xl font-semibold text-teal sm:h-64 sm:w-64" aria-hidden="true">
            {card.word[0]}
          </div>
        )}
        <p className="mt-6 font-display text-6xl font-semibold leading-none text-ink" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}>
          {card.word}
        </p>
        <p className="mx-auto mt-4 max-w-md text-lg leading-snug text-ink">{card.sentence}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => play(card.word, card.audio)}
            disabled={heard}
            aria-label={`Play ${card.word}`}
            className={`${btn} h-12 bg-teal px-6 text-base text-white shadow-card hover:bg-teal-deep disabled:opacity-70`}
          >
            <PlayIcon size={14} />
            {heard ? "Listening" : "Hear it"}
          </button>
          <button
            type="button"
            onClick={() => record(card.word)}
            disabled={recording !== null}
            aria-label={`Your turn ${card.word}`}
            className={`${btn} h-12 border border-sand-deep bg-paper px-6 text-base text-ink hover:border-teal disabled:opacity-60`}
          >
            {recording === card.word ? <span className="pulse-dot inline-block h-2.5 w-2.5 rounded-full bg-coral" aria-hidden="true" /> : <MicIcon size={14} />}
            {recording === card.word ? "Say it now" : "Your turn"}
          </button>
          {recordings[card.word] && (
            <button
              type="button"
              onClick={() => new Audio(recordings[card.word]).play()}
              aria-label={`Play yours ${card.word}`}
              className={`${btn} h-12 border border-sand-deep bg-paper px-6 text-base text-ink hover:border-teal`}
            >
              <PlayIcon size={14} />
              Hear yourself
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setI(i - 1)} disabled={i === 0} className={`${btn} h-11 border border-sand-deep bg-shell px-4 text-ink hover:bg-paper disabled:opacity-40`}>
          Back
        </button>
        <div className="flex items-center gap-1.5" aria-label={`Card ${i + 1} of ${cards.length}, ${tried} tried`}>
          {cards.map((c, j) => (
            <button
              key={c.word}
              type="button"
              onClick={() => setI(j)}
              aria-label={`Go to ${c.word}`}
              className={`h-2.5 rounded-full transition-all duration-200 ${j === i ? "w-6 bg-teal" : recordings[c.word] ? "w-2.5 bg-teal/60" : "w-2.5 bg-sand-deep"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setI(i + 1)}
          disabled={i === cards.length - 1}
          className={`${btn} h-11 bg-ink px-5 text-paper hover:bg-teal-deep disabled:opacity-40`}
        >
          Next
        </button>
      </div>
      {tried > 0 && (
        <p className="mt-3 text-center text-sm text-teal-deep" aria-live="polite">
          {tried === cards.length ? `All ${cards.length} words practiced. Nice work!` : `${tried} of ${cards.length} words practiced`}
        </p>
      )}
    </section>
  );
}
