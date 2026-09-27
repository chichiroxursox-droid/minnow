"use client";

import { useEffect, useState } from "react";
import type { PracticeSet, ProposeInput } from "@/lib/propose";
import type { Verdict } from "@/lib/verify";
import { ARPABET, CONSONANTS, ipaFor } from "@/lib/ipa";
import { COMMON_ERRORS } from "@/lib/pairs";
import { PRESETS, SEEDS } from "@/lib/seeds";
import { arrange, seedKey } from "@/lib/sets";
import { SPEEDS } from "@/lib/tts";
import { FamilyView } from "./family";
import { Mark, MicIcon, PlayIcon, Seg, btn, btnPlay, btnQuiet } from "./ui";

type Form = Omit<ProposeInput, "count">;
type Mode = "therapist" | "family";
type Checked = Verdict & { pair?: { word: string; phones: string[]; ipa: string } };
const DEFAULT: Form = { phoneme: "K", position: "initial", syllables: "1-2", theme: "ocean", age: 6, singleton: false, contrast: "T" };
const COUNT = 8;
const SPEED_LABEL: Record<number, string> = { 1: "Normal", 0.85: "Slow", 0.7: "Slower" };
const POSITIONS = ["initial", "medial", "final"] as const;
const SYLLABLES = ["1-2", "3"] as const;
const MODE_LABEL: Record<Mode, string> = { therapist: "Therapist", family: "Family" };

const field = "mt-1 h-10 rounded-lg border border-sand-deep bg-shell px-3 text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] outline-none focus:border-teal focus:ring-2 focus:ring-teal/25";
const labelText = "block text-xs font-medium uppercase tracking-wide text-ink-soft";
const labelPlain = "block text-xs font-medium text-ink-soft";

/** The cached set for a target, arranged for display, or null when none is cached. */
function cachedFor(form: Form): PracticeSet | null {
  const seed = SEEDS[seedKey(form)];
  return seed ? { ...seed, items: arrange(seed.items, COUNT) } : null;
}

function modelName(id: string) {
  return id.startsWith("claude-haiku-4-5") ? "Claude Haiku 4.5" : id;
}

/** ARPAbet from the dictionary, then broad IPA, so an SLP can read either. */
function Phones({ v, tone = "muted" }: { v: Verdict; tone?: "muted" | "coral" }) {
  const text = v.status === "unverified" ? v.reason : v.status === "fail" ? v.reason : v.phones.join(" ");
  const ipa = v.status === "unverified" ? null : v.ipa;
  return (
    <span className={`font-mono text-[11px] tracking-wide ${tone === "coral" ? "text-coral" : "text-ink-soft"}`}>
      {text}
      {ipa && <span className="ml-2 font-sans text-xs tracking-normal">/{ipa}/</span>}
    </span>
  );
}

function Skeleton() {
  return (
    <ul className="mt-3 grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: COUNT }, (_, i) => (
        <li key={i} className="rounded-2xl border border-sand bg-shell p-4">
          <div className="flex gap-4">
            <div className="shimmer h-24 w-24 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="shimmer h-7 w-2/5 rounded-md" />
              <div className="shimmer h-3 w-1/3 rounded" />
              <div className="shimmer mt-4 h-4 w-full rounded" />
              <div className="shimmer h-3 w-4/5 rounded" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("therapist");
  const [form, setForm] = useState<Form>(DEFAULT);
  const [set, setSet] = useState<PracticeSet | null>(() => cachedFor(DEFAULT));
  const [starter, setStarter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState("");
  const [checked, setChecked] = useState<Checked | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [playing, setPlaying] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [recording, setRecording] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Record<string, string>>({});

  const target = { phoneme: form.phoneme, position: form.position, syllables: form.syllables, singleton: form.singleton, contrast: form.contrast };
  const label = `/${ipaFor(form.phoneme)}/ ${form.position}, ${form.syllables} syllables${form.singleton ? ", singletons only" : ""}`;

  function setPhoneme(phoneme: string) {
    setForm({ ...form, phoneme, contrast: COMMON_ERRORS[phoneme] ?? "" });
  }

  /** A preset shows its cached set straight away; Build set still makes a live one. */
  function choosePreset(p: Form) {
    setForm(p);
    setStarter(true);
  }

  /** Family mode keeps only the essentials, so the hidden therapist settings go back to plain defaults. */
  function switchMode(m: Mode) {
    setMode(m);
    setPlayError(null);
    setError(null);
    if (m === "family") {
      setForm({ ...form, syllables: "1-2", singleton: false });
      setSpeed(1); // family plays the cached clip; slowed speech is a paid live call
    }
  }

  // Shareable target: read it from the URL once, then keep the URL in sync.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("mode") === "family") setMode("family");
    if (!q.has("sound")) return;
    const next: Form = { ...DEFAULT };
    const sound = q.get("sound");
    if (sound && ARPABET.has(sound)) next.phoneme = sound;
    const position = q.get("position");
    if (position && (POSITIONS as readonly string[]).includes(position)) next.position = position as Form["position"];
    const syllables = q.get("syllables");
    if (syllables && (SYLLABLES as readonly string[]).includes(syllables)) next.syllables = syllables as Form["syllables"];
    const theme = q.get("theme");
    if (theme?.trim()) next.theme = theme.trim().slice(0, 40);
    const age = Number(q.get("age"));
    if (age >= 2 && age <= 18) next.age = age;
    const says = q.get("says");
    next.contrast = says === null ? (COMMON_ERRORS[next.phoneme] ?? "") : says === "" || ARPABET.has(says) ? says : "";
    next.singleton = q.get("singletons") === "1";
    setForm(next);
  }, []);
  useEffect(() => {
    const q = new URLSearchParams({ sound: form.phoneme, position: form.position, syllables: form.syllables, theme: form.theme, age: String(form.age), says: form.contrast });
    if (form.singleton) q.set("singletons", "1");
    if (mode === "family") q.set("mode", "family");
    window.history.replaceState(null, "", `?${q}`);
    // Until a live build, show whatever is cached for the current target.
    if (starter && !loading) setSet(cachedFor(form));
  }, [form, starter, loading, mode]);

  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 250);
    return () => clearInterval(id);
  }, [loading]);

  async function build() {
    setLoading(true);
    setError(null);
    setSet(null);
    try {
      const r = await fetch("/api/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, count: COUNT }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `Request failed (${r.status})`);
      setSet(j);
      setStarter(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Check a word against the current target, 250ms after typing stops. Dictionary only, no keys needed.
  useEffect(() => {
    const word = check.trim();
    if (!word) return setChecked(null);
    const t = setTimeout(async () => {
      const r = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, ...target }),
      });
      if (r.ok) setChecked(await r.json());
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check, form.phoneme, form.position, form.syllables, form.singleton, form.contrast]);

  /** Cached MP3s are normal speed; any other speed, or an uncached word, goes through ElevenLabs live. */
  async function play(word: string, cached?: string) {
    setPlaying(word);
    setPlayError(null);
    try {
      let url = speed === 1 ? cached : undefined;
      if (!url) {
        const r = await fetch(`/api/speak?word=${encodeURIComponent(word)}&speed=${speed}`);
        if (!r.ok) throw new Error((await r.json()).error ?? "Voice failed");
        url = URL.createObjectURL(await r.blob());
      }
      const audio = new Audio(url);
      audio.onended = () => setPlaying(null);
      await audio.play();
    } catch (e) {
      setPlayError(e instanceof Error ? e.message : "Voice failed");
      setPlaying(null);
    }
  }

  /** Records 2.5 seconds from the microphone into memory. Nothing is uploaded or stored. */
  async function record(word: string) {
    setPlayError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecordings((r) => ({ ...r, [word]: URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })) }));
        setRecording(null);
      };
      setRecording(word);
      rec.start();
      setTimeout(() => rec.state !== "inactive" && rec.stop(), 2500);
    } catch {
      setPlayError("Microphone unavailable. Your turn needs microphone permission; nothing is uploaded.");
      setRecording(null);
    }
  }

  const rejects = set?.items.filter((i) => i.verdict.status === "fail") ?? [];
  const passes = set?.items.filter((i) => i.verdict.status === "pass") ?? [];
  const unverified = set?.items.filter((i) => i.verdict.status === "unverified") ?? [];
  const contrastLabel = form.contrast ? `/${ipaFor(form.contrast)}/` : "";

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 print:max-w-none print:p-0">
      <header className="mb-8 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mark />
            <h1 className="font-display text-[2.6rem] font-semibold leading-none tracking-tight text-ink" style={{ fontVariationSettings: '"opsz" 72, "SOFT" 40' }}>
              Minnow
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">For</span>
            <Seg value={mode} options={["therapist", "family"] as const} label={(m) => MODE_LABEL[m]} onChange={switchMode} />
          </div>
        </div>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
          {mode === "therapist"
            ? "Articulation practice sets an SLP can trust. Claude proposes the words, the CMU Pronouncing Dictionary verifies every one, and ElevenLabs says them out loud."
            : "Practice speech sounds with picture cards. Pick a sound, hear the word, then say it back together."}
        </p>
      </header>

      {mode === "family" ? (
        <FamilyView
          form={form}
          setForm={setForm}
          choosePreset={choosePreset}
          set={set}
          loading={loading}
          elapsed={elapsed}
          error={error ?? playError}
          build={build}
          play={play}
          playing={playing}
          record={record}
          recording={recording}
          recordings={recordings}
        />
      ) : (
        <>
          <section className="rounded-2xl border border-sand bg-shell p-5 shadow-card print:hidden">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <label className="text-sm">
                <span className={labelText}>Sound</span>
                <select value={form.phoneme} onChange={(e) => setPhoneme(e.target.value)} className={field}>
                  {CONSONANTS.map((c) => (
                    <option key={c.arpabet} value={c.arpabet}>
                      /{c.ipa}/ {c.arpabet}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className={labelText}>Position</span>
                <div className="mt-1">
                  <Seg value={form.position} options={POSITIONS} onChange={(position) => setForm({ ...form, position })} />
                </div>
              </label>
              <label className="text-sm">
                <span className={labelText}>Syllables</span>
                <div className="mt-1">
                  <Seg value={form.syllables} options={SYLLABLES} onChange={(syllables) => setForm({ ...form, syllables })} />
                </div>
              </label>
              <label className="text-sm">
                <span className={labelText}>Theme</span>
                <input value={form.theme} maxLength={40} onChange={(e) => setForm({ ...form, theme: e.target.value })} className={`${field} w-32`} />
              </label>
              <label className="text-sm">
                <span className={labelText}>Age</span>
                <input type="number" min={2} max={18} value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} className={`${field} w-16`} />
              </label>
              <label className="text-sm">
                <span className={labelText}>Child says</span>
                <select value={form.contrast} onChange={(e) => setForm({ ...form, contrast: e.target.value })} className={field}>
                  <option value="">no pairs</option>
                  {CONSONANTS.filter((c) => c.arpabet !== form.phoneme).map((c) => (
                    <option key={c.arpabet} value={c.arpabet}>
                      /{c.ipa}/ for /{ipaFor(form.phoneme)}/
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex h-10 items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.singleton} onChange={(e) => setForm({ ...form, singleton: e.target.checked })} className="accent-teal" />
                Singletons only
              </label>
              <button
                type="button"
                onClick={build}
                disabled={loading || !form.theme.trim()}
                className={`${btn} ml-auto h-10 bg-teal px-5 text-[15px] text-white shadow-card hover:bg-teal-deep disabled:opacity-60`}
              >
                {loading && <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-white/90" aria-hidden="true" />}
                {loading ? "Building" : "Build set"}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand pt-4 text-xs text-ink-soft">
              <span>Cached presets</span>
              {PRESETS.map((p) => (
                <button
                  key={`${p.phoneme}-${p.position}-${p.theme}`}
                  type="button"
                  onClick={() => choosePreset({ ...p, contrast: COMMON_ERRORS[p.phoneme] ?? "" })}
                  className="rounded-full border border-sand-deep bg-paper px-3 py-1 text-ink transition-colors duration-150 hover:border-teal hover:text-teal-deep focus-visible:ring-2 focus-visible:ring-teal/40 outline-none"
                >
                  /{ipaFor(p.phoneme)}/ {p.position} · {p.theme} · age {p.age}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-sand bg-shell p-5 shadow-card print:hidden">
            <label className="text-sm">
              <span className={labelPlain}>Check a word against {label}</span>
              <input value={check} onChange={(e) => setCheck(e.target.value)} placeholder="type any word" className={`${field} w-full max-w-sm`} />
            </label>
            <div aria-live="polite">
              {checked && (
                <div
                  data-testid="check-result"
                  className={`mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm ${
                    checked.status === "pass" ? "bg-teal-mist text-teal-deep" : checked.status === "fail" ? "bg-coral-mist text-coral" : "bg-paper text-ink-soft"
                  }`}
                >
                  <span className={`font-display text-lg font-semibold ${checked.status === "fail" ? "line-through decoration-coral/70" : ""}`}>{checked.word}</span>
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {checked.status === "pass" ? "verified" : checked.status === "fail" ? "rejected" : "unverified"}
                  </span>
                  <span className="basis-full">
                    <Phones v={checked} tone={checked.status === "fail" ? "coral" : "muted"} />
                  </span>
                  {checked.pair && (
                    <span className="basis-full text-teal-deep">
                      Minimal pair with {contrastLabel}: <span className="font-semibold">{checked.pair.word}</span>{" "}
                      <span className="font-mono text-[11px] tracking-wide">{checked.pair.phones.join(" ")}</span> <span className="text-xs">/{checked.pair.ipa}/</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          {error && <p className="mt-5 rounded-lg bg-coral-mist px-4 py-3 text-sm text-coral print:hidden">{error}</p>}

          {loading && (
            <section className="rise mt-8 print:hidden" data-testid="loading" aria-busy="true">
              <div className="flex items-center gap-4 rounded-2xl border border-sand bg-shell p-5 shadow-card">
                <Mark className="swim" />
                <div className="min-w-0">
                  <p className="font-display text-xl font-semibold text-ink">Building your set</p>
                  <p className="text-sm text-ink-soft">Asking Claude Haiku 4.5 for {COUNT * 2} words, then checking every one in the dictionary.</p>
                </div>
                <span className="ml-auto font-mono text-sm tabular-nums text-ink-soft">{elapsed}s</span>
              </div>
              <Skeleton />
            </section>
          )}

          {set && !loading && (
            <section className="rise mt-8 print:mt-0" key={set.generatedAt + set.key}>
              <p className="text-sm leading-relaxed text-ink-soft print:hidden">
                <span className="font-medium text-ink">{starter ? "Cached set" : set.source === "live" ? `Live from ${modelName(set.model)}` : "Cached set"}</span> ·{" "}
                {label} · theme {set.input.theme} · age {set.input.age} · {set.proposed} proposed{(set.rounds ?? 1) > 1 ? ` in ${set.rounds} rounds` : ""} ·{" "}
                <span className={rejects.length ? "text-coral" : ""}>{rejects.length} rejected</span> ·{" "}
                <span className="text-teal-deep">{passes.length} kept</span>
                {starter && <span> · Build set makes a fresh one live</span>}
              </p>
              {set.note && <p className="mt-1 text-sm text-amber print:hidden">{set.note}</p>}

              {rejects.length > 0 && (
                <div className="mt-4 print:hidden" data-testid="rejects">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-coral">Rejected by the dictionary</h2>
                  <ul className="mt-2 divide-y divide-coral/15 rounded-xl border border-coral/25 bg-coral-mist/60">
                    {rejects.map((it) => (
                      <li key={it.word} className="flex flex-wrap items-baseline gap-x-3 px-4 py-2">
                        <span className="font-display text-lg font-semibold text-ink line-through decoration-coral/80 decoration-2">{it.word}</span>
                        <Phones v={it.verdict} tone="coral" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 print:mt-0" data-testid="passes">
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-deep">Verified{passes.length ? "" : ": none this time"}</h2>
                  <span className="ml-auto text-xs text-ink-soft">Voice speed</span>
                  <Seg value={speed} options={SPEEDS} label={(s) => SPEED_LABEL[s]} onChange={setSpeed} />
                  <button type="button" onClick={() => window.print()} className={btnQuiet}>
                    Print homework
                  </button>
                </div>
                <div className="hidden print:block">
                  <h1 className="font-display text-2xl font-semibold">Minnow practice: {label}</h1>
                  <p className="text-sm text-ink-soft">Theme {set.input.theme}. Say each word, then the sentence. Tick a box for each try.</p>
                </div>
                <ul className="mt-3 grid items-start gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-4">
                  {passes.map((it) => (
                    <li
                      key={it.word}
                      className="flex flex-col rounded-2xl border border-sand bg-shell p-4 shadow-card transition-shadow duration-200 hover:shadow-lift print:break-inside-avoid print:shadow-none"
                    >
                      <div className="flex gap-4">
                        {it.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.image} alt="" className="h-24 w-24 shrink-0 rounded-xl bg-paper object-cover ring-1 ring-sand print:h-28 print:w-28" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-display text-[1.75rem] font-semibold leading-tight text-ink" style={{ fontVariationSettings: '"opsz" 36, "SOFT" 30' }}>
                              {it.word}
                            </span>
                            <button type="button" onClick={() => play(it.word, it.audio)} disabled={playing === it.word} className={`${btnPlay} shrink-0 print:hidden`} aria-label={`Play ${it.word}`}>
                              <PlayIcon />
                              {playing === it.word ? "Playing" : "Play"}
                            </button>
                          </div>
                          <div className="mt-0.5">
                            <Phones v={it.verdict} />
                          </div>
                          <p className="mt-2 leading-snug text-ink">{it.sentence}</p>
                          <p className="mt-0.5 text-sm leading-snug text-ink-soft">{it.kid_definition}</p>
                        </div>
                      </div>
                      {it.pair && (
                        <p className="mt-3 flex items-center gap-2 rounded-lg bg-teal-mist/50 px-3 py-1.5 text-sm text-teal-deep">
                          <span className="min-w-0 flex-1">
                            Minimal pair with {contrastLabel}: <span className="font-display text-base font-semibold">{it.pair.word}</span>{" "}
                            <span className="whitespace-nowrap font-mono text-[11px] tracking-wide">{it.pair.phones.join(" ")}</span>{" "}
                            <span className="whitespace-nowrap text-xs">/{it.pair.ipa}/</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => play(it.pair!.word, it.pair!.audio)}
                            disabled={playing === it.pair.word}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-teal-deep transition-colors duration-150 hover:bg-teal/10 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-teal/40 print:hidden"
                            aria-label={`Play ${it.pair.word}`}
                          >
                            <PlayIcon />
                            {playing === it.pair.word ? "Playing" : "Play"}
                          </button>
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
                        <button type="button" onClick={() => record(it.word)} disabled={recording !== null} className={btnQuiet} aria-label={`Your turn ${it.word}`}>
                          {recording === it.word ? <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-coral" aria-hidden="true" /> : <MicIcon />}
                          {recording === it.word ? "Listening" : "Your turn"}
                        </button>
                        {recordings[it.word] && (
                          <button type="button" onClick={() => new Audio(recordings[it.word]).play()} className={btnQuiet} aria-label={`Play yours ${it.word}`}>
                            <PlayIcon />
                            Play yours
                          </button>
                        )}
                      </div>
                      <p className="mt-3 hidden text-sm text-ink-soft print:block">Tries: ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐</p>
                    </li>
                  ))}
                </ul>
                {playError && <p className="mt-3 text-sm text-amber print:hidden">{playError}</p>}
              </div>

              {unverified.length > 0 && (
                <div className="mt-6 print:hidden" data-testid="unverified">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Not in the dictionary, no verdict</h2>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {unverified.map((it) => (
                      <li key={it.word} className="rounded-md border border-sand bg-paper px-3 py-1 text-sm text-ink-soft">
                        {it.word}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </>
      )}

      <footer className="mt-12 border-t border-sand pt-4 text-xs leading-relaxed text-ink-soft print:hidden">
        <p>
          Voice by <a href="https://elevenlabs.io" className="underline decoration-sand-deep underline-offset-2 hover:text-teal-deep">ElevenLabs</a>. Words proposed by Claude Haiku 4.5. Verification and minimal pairs by the CMU Pronouncing
          Dictionary, US English only. Pictures made once for the cached sets.
        </p>
        <p className="mt-1">
          Minnow is a practice tool, not a clinical or diagnostic instrument. Recordings stay in this browser tab and are never uploaded.
        </p>
      </footer>
    </main>
  );
}
