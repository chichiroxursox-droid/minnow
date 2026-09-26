import type { PracticeSet } from "./propose.ts";
import kOcean from "../public/seeds/k-initial-1-2-ocean-6.json";
import rFarm from "../public/seeds/r-medial-1-2-farm-7.json";
import sSpace from "../public/seeds/s-final-1-2-space-8.json";

const all = [kOcean, rFarm, sSpace] as unknown as PracticeSet[];

/** Cached sets keyed by seedKey(). The /api/propose fallback and the offline demo path read from here. */
export const SEEDS: Record<string, PracticeSet> = Object.fromEntries(all.map((s) => [s.key, s]));

export const PRESETS = all.map((s) => s.input);
