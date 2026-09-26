"use client";

import { useEffect, useState } from "react";
import type { PracticeSet, ProposeInput, SetItem } from "@/lib/propose";
import type { Verdict } from "@/lib/verify";
import { CONSONANTS, ipaFor } from "@/lib/ipa";
import { PRESETS } from "@/lib/seeds";

type Form = Omit<ProposeInput, "count">;
const DEFAULT: Form = { phoneme: "K", position: "initial", syllables: "1-2", theme: "ocean", age: 6, singleton: false };
const COUNT = 8;

function Seg<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-md border border-stone-300 bg-white text-sm">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`px-3 py-1.5 first:rounded-l-md last:rounded-r-md ${o === value ? "bg-stone-800 text-white" : "hover:bg-stone-100"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Phones({ v }: { v: Verdict }) {
  if (v.status === "unverified") return <span className="font-mono text-xs text-stone-500">{v.reason}</span>;
  return <span className="font-mono text-xs text-stone-600">{v.status === "fail" ? v.reason : v.phones.join(" ")}</span>;
}

export default function Home() {
  const [form, setForm] = useState<Form>(DEFAULT);
  const [set, setSet] = useState<PracticeSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState("");
  const [checked, setChecked] = useState<Verdict | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);

  const target = { phoneme: form.phoneme, position: form.position, syllables: form.syllables, singleton: form.singleton };
  const label = `/${ipaFor(form.phoneme)}/ ${form.position}, ${form.syllables} syllables${form.singleton ? ", singletons only" : ""}`;

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
  }, [check, form.phoneme, form.position, form.syllables, form.singleton]);

  async function play(item: SetItem) {
    setPlaying(item.word);
    setPlayError(null);
    try {
      let url = item.audio;
      if (!url) {
        const r = await fetch(`/api/speak?word=${encodeURIComponent(item.word)}`);
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

  const rejects = set?.items.filter((i) => i.verdict.status === "fail") ?? [];
  const passes = set?.items.filter((i) => i.verdict.status === "pass") ?? [];
  const unverified = set?.items.filter((i) => i.verdict.status === "unverified") ?? [];

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">Minnow</h1>
        <p className="mt-2 max-w-xl text-stone-600">
          Articulation practice sets an SLP can trust. Claude proposes the words, the CMU Pronouncing Dictionary
          verifies every one, and ElevenLabs says them out loud.
        </p>
      </header>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="block text-stone-500">Sound</span>
            <select
              value={form.phoneme}
              onChange={(e) => setForm({ ...form, phoneme: e.target.value })}
              className="mt-1 rounded-md border border-stone-300 bg-white px-3 py-1.5"
            >
              {CONSONANTS.map((c) => (
                <option key={c.arpabet} value={c.arpabet}>
                  /{c.ipa}/ {c.arpabet}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-stone-500">Position</span>
            <div className="mt-1">
              <Seg value={form.position} options={["initial", "medial", "final"]} onChange={(position) => setForm({ ...form, position })} />
            </div>
          </label>
          <label className="text-sm">
            <span className="block text-stone-500">Syllables</span>
            <div className="mt-1">
              <Seg value={form.syllables} options={["1-2", "3"]} onChange={(syllables) => setForm({ ...form, syllables })} />
            </div>
          </label>
          <label className="text-sm">
            <span className="block text-stone-500">Theme</span>
            <input
              value={form.theme}
              maxLength={40}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              className="mt-1 w-32 rounded-md border border-stone-300 px-3 py-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="block text-stone-500">Age</span>
            <input
              type="number"
              min={2}
              max={18}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
              className="mt-1 w-16 rounded-md border border-stone-300 px-3 py-1.5"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" checked={form.singleton} onChange={(e) => setForm({ ...form, singleton: e.target.checked })} />
            Singletons only
          </label>
          <button
            type="button"
            onClick={build}
            disabled={loading || !form.theme.trim()}
            className="ml-auto rounded-md bg-sky-700 px-5 py-2 font-medium text-white hover:bg-sky-800 disabled:opacity-50"
          >
            {loading ? "Building" : "Build set"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span>Cached presets:</span>
          {PRESETS.map((p) => (
            <button
              key={`${p.phoneme}-${p.position}-${p.theme}`}
              type="button"
              onClick={() => setForm({ ...p })}
              className="rounded-full border border-stone-300 px-3 py-1 hover:bg-stone-100"
            >
              /{ipaFor(p.phoneme)}/ {p.position} · {p.theme} · age {p.age}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm print:hidden">
        <label className="text-sm">
          <span className="block text-stone-500">Check a word against {label}</span>
          <input
            value={check}
            onChange={(e) => setCheck(e.target.value)}
            placeholder="type any word"
            className="mt-1 w-full max-w-sm rounded-md border border-stone-300 px-3 py-1.5"
          />
        </label>
        {checked && (
          <div
            data-testid="check-result"
            className={`mt-3 rounded-md px-3 py-2 text-sm ${
              checked.status === "pass" ? "bg-emerald-50 text-emerald-900" : checked.status === "fail" ? "bg-rose-50 text-rose-900" : "bg-stone-100 text-stone-700"
            }`}
          >
            <span className={`font-semibold ${checked.status === "fail" ? "line-through" : ""}`}>{checked.word}</span>
            <span className="ml-2">
              {checked.status === "pass" ? "verified" : checked.status === "fail" ? "rejected" : "unverified"}
            </span>
            <div>
              <Phones v={checked} />
            </div>
          </div>
        )}
      </section>

      {error && <p className="mt-6 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>}

      {set && (
        <section className="mt-8">
          <p className="text-sm text-stone-500">
            {set.source === "live" ? `Live from ${set.model}` : "Cached set"} · {label} · theme {set.input.theme} · age {set.input.age} ·{" "}
            {set.proposed} proposed · {rejects.length} rejected · {passes.length} kept
            {unverified.length ? ` · ${unverified.length} unverified` : ""}
          </p>
          {set.note && <p className="mt-1 text-sm text-amber-800">{set.note}</p>}

          {rejects.length > 0 && (
            <div className="mt-4" data-testid="rejects">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-800">Rejected by the dictionary</h2>
              <ul className="mt-2 divide-y divide-rose-100 rounded-lg border border-rose-200 bg-rose-50">
                {rejects.map((it) => (
                  <li key={it.word} className="flex flex-wrap items-baseline gap-x-3 px-4 py-2">
                    <span className="text-lg font-medium line-through decoration-rose-500">{it.word}</span>
                    <Phones v={it.verdict} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6" data-testid="passes">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
              Verified {passes.length ? "" : ": none this time"}
            </h2>
            <ul className="mt-2 grid gap-3 sm:grid-cols-2">
              {passes.map((it) => (
                <li key={it.word} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-2xl font-semibold">{it.word}</span>
                    <button
                      type="button"
                      onClick={() => play(it)}
                      disabled={playing === it.word}
                      className="rounded-md border border-sky-700 px-3 py-1 text-sm text-sky-800 hover:bg-sky-50 disabled:opacity-60 print:hidden"
                      aria-label={`Play ${it.word}`}
                    >
                      {playing === it.word ? "Playing" : "Play"}
                    </button>
                  </div>
                  <Phones v={it.verdict} />
                  <p className="mt-2">{it.sentence}</p>
                  <p className="text-sm text-stone-500">{it.kid_definition}</p>
                </li>
              ))}
            </ul>
            {playError && <p className="mt-3 text-sm text-amber-800">{playError}</p>}
          </div>

          {unverified.length > 0 && (
            <div className="mt-6" data-testid="unverified">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Not in the dictionary, no verdict</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {unverified.map((it) => (
                  <li key={it.word} className="rounded-md bg-stone-100 px-3 py-1 text-sm text-stone-600">
                    {it.word}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <footer className="mt-12 border-t border-stone-200 pt-4 text-xs text-stone-500">
        <p>
          Voice by <a href="https://elevenlabs.io" className="underline">ElevenLabs</a>. Words proposed by Claude Haiku 4.5.
          Verification by the CMU Pronouncing Dictionary, US English only.
        </p>
        <p className="mt-1">Minnow is a practice-set drafting tool for clinicians, not a clinical or diagnostic instrument.</p>
      </footer>
    </main>
  );
}
