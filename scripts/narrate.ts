// Lays an ElevenLabs narration over the demo recording.
//   node --env-file=.env.local scripts/narrate.ts <walk outdir with beats.json and .webm> <out.mp4>
// Each beat's line is synthesized once into ~/Desktop/minnow-narration/<beat>.mp3 and reused after that,
// so re-running never spends voice characters. Lines never overlap: a line that would start before the
// previous one ends is pushed back, and the video is padded on its last frame if narration runs long.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { assertUnderCeiling, synthesize } from "../lib/tts.ts";

const LINES: Record<string, string> = {
  intro:
    "This is Minnow. Speech therapists build articulation practice sets by hand, and language models get the phonetics subtly wrong. " +
    "Minnow lets the model propose the words, and makes a pronunciation dictionary check every one.",
  build:
    "The target is the k sound at the start of a word, one or two syllables, ocean theme, age six. " +
    "Claude Haiku proposes sixteen words, and the C M U dictionary keeps the ones that really start with k.",
  check:
    "Type any word. Knot is rejected, because it starts with the n sound. Ocean starts with a vowel. " +
    "Coral passes, and the evidence is the dictionary's own phonemes.",
  play: "Every verified word is voiced by ElevenLabs. The child records their turn and hears both back. Nothing is uploaded.",
  slow: "Slow the voice down for younger kids.",
  rmedial:
    "Switch to medial r on a farm theme, and the dictionary strikes out the model's mistakes first, each with the reason. " +
    "That is Minnow. The model proposes, the dictionary decides.",
};

const [walkDir, outFile] = process.argv.slice(2);
if (!walkDir || !outFile) throw new Error("usage: narrate.ts <walkdir> <out.mp4>");
const webm = readdirSync(walkDir).find((f) => f.endsWith(".webm"));
if (!webm) throw new Error("no .webm in " + walkDir);
const beats: { name: string; t: number }[] = JSON.parse(readFileSync(join(walkDir, "beats.json"), "utf8"));
const dir = join(homedir(), "Desktop", "minnow-narration");
mkdirSync(dir, { recursive: true });

const duration = (file: string) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).trim());

let checked = false;
const cues: { file: string; at: number }[] = [];
let prevEnd = 0;
for (const b of beats) {
  const line = LINES[b.name];
  if (!line) continue;
  const file = join(dir, `${b.name}.mp3`);
  if (!existsSync(file)) {
    if (!checked) {
      await assertUnderCeiling();
      checked = true;
    }
    writeFileSync(file, Buffer.from(await synthesize(line, { checkUsage: false })));
    console.log(`synthesized ${b.name} (${line.length} chars)`);
  }
  const at = Math.max(b.t, prevEnd + 0.4);
  const len = duration(file);
  if (at > b.t) console.log(`  ${b.name}: pushed from ${b.t.toFixed(1)}s to ${at.toFixed(1)}s so lines do not overlap`);
  cues.push({ file, at });
  prevEnd = at + len;
}

const videoLen = duration(join(walkDir, webm));
const need = Math.max(videoLen, prevEnd + 0.8);
const pad = need - videoLen;
const inputs = cues.flatMap((c) => ["-i", c.file]);
const delays = cues.map((c, i) => `[${i + 1}:a]adelay=${Math.round(c.at * 1000)}|${Math.round(c.at * 1000)}[a${i}]`).join(";");
const mix = cues.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${cues.length}:normalize=0[aout]`;
const vf = pad > 0 ? `tpad=stop_mode=clone:stop_duration=${pad.toFixed(2)}` : "null";
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-i", join(walkDir, webm), ...inputs,
  "-filter_complex", `[0:v]${vf}[v];${delays};${mix}`,
  "-map", "[v]", "-map", "[aout]",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "25", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
  outFile,
]);
console.log(`wrote ${outFile}: video ${videoLen.toFixed(1)}s, padded ${pad.toFixed(1)}s, narration ends ${prevEnd.toFixed(1)}s`);
