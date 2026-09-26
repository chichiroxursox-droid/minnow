// One-time build step: writes lib/common-words.json, the vocabulary minimal pairs may draw from.
// cmudict is full of surnames and rare words, so pairs are limited to common words a child knows.
//   node --env-file=.env.local scripts/make-common-words.ts ["what to ask for"]
// Runs merge into the existing list, so ask for different slices to grow it.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { dictionary } from "cmu-pronouncing-dictionary";
import { DEFAULT_MODEL } from "../lib/propose.ts";

// Classic minimal-pair vocabulary that the model tends to leave out. Always merged in.
const CORE =
  "pat mat bat cat hat rat sat fat tap cap map nap lap tea key pea bee sea tie pie sun ton bun fun run ship sip tip dip hip lip zip " +
  "tot dot pot hot cot got not lot tin pin bin fin win tick kick pick sick lick tool cool pool tail pail nail sail mail rail toe doe " +
  "go no so bow row low mow tow car tar jar far bar core tore door more sore wore ten den pen hen men tear dear fear gear near " +
  "tape cape toast coast most post tight kite bite light night right sight white tan can fan man pan ran van cold told bold fold " +
  "gold hold sold cub tub sub rub cup pup cut but hut nut gut shut coat tote boat goat note vote cane lane mane cage page wage " +
  "cop top mop hop pop cab tab dab lab comb home foam kid lid bid did hid kit bit fit hit lit pit sit kiss miss hiss dish fish " +
  "wish lock rock sock dock knock back pack sack tack rack duck luck truck tuck buck peek seek week leak beak lake bake cake " +
  "make rake take wake fake shake snake like bike hike book cook hook look took bug dug hug jug mug rug tug pig big dig fig wig " +
  "gum hum sum drum ring king sing wing thing gap rap sap zap clap flap slap snap trap wrap rip chip clip drip flip grip skip slip " +
  "trip whip wet pet set met net jet let get bet vet yet sun fun bus gas mass pass class glass lot loss toss boss moss dot";

const skipModel = process.argv.includes("--no-model");
// Plain text, one word per line: a truncated reply still yields a usable list.
const { text } = skipModel ? { text: "" } : await generateText({
  model: anthropic(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL),
  maxOutputTokens: 16000,
  system:
    "You are compiling a vocabulary list for children's speech therapy materials. " +
    "Return common, concrete, everyday English words that a child aged 4 to 10 knows: " +
    "animals, food, toys, clothes, body parts, home, school, nature, vehicles, simple verbs and adjectives. " +
    "Lowercase, no proper nouns, no plurals unless the plural is the usual form, no phrases. " +
    "One word per line. No numbering, no commentary, nothing but words.",
  prompt: process.argv.find((a, i) => i >= 2 && !a.startsWith("--")) || "Return 2000 such words.",
});

const seen = new Set<string>();
const existing: string[] = existsSync("lib/common-words.json") ? JSON.parse(readFileSync("lib/common-words.json", "utf8")) : [];
const proposed = [...existing, ...CORE.split(" "), ...text.split(/\s+/)];
const words = proposed
  .map((w) => w.toLowerCase().trim())
  .filter((w) => /^[a-z]{2,}$/.test(w) && w in dictionary && !seen.has(w) && seen.add(w))
  .sort();

writeFileSync("lib/common-words.json", JSON.stringify(words) + "\n");
console.log(`kept ${words.length} of ${proposed.length} proposed (must be alphabetic and in cmudict)`);
