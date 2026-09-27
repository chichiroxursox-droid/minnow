/** English consonants an SLP targets, IPA symbol to ARPAbet. Order is roughly the order kids acquire them. */
export const CONSONANTS: { ipa: string; arpabet: string }[] = [
  { ipa: "p", arpabet: "P" },
  { ipa: "b", arpabet: "B" },
  { ipa: "m", arpabet: "M" },
  { ipa: "n", arpabet: "N" },
  { ipa: "w", arpabet: "W" },
  { ipa: "h", arpabet: "HH" },
  { ipa: "t", arpabet: "T" },
  { ipa: "d", arpabet: "D" },
  { ipa: "k", arpabet: "K" },
  { ipa: "g", arpabet: "G" },
  { ipa: "f", arpabet: "F" },
  { ipa: "v", arpabet: "V" },
  { ipa: "j", arpabet: "Y" },
  { ipa: "ŋ", arpabet: "NG" },
  { ipa: "s", arpabet: "S" },
  { ipa: "z", arpabet: "Z" },
  { ipa: "l", arpabet: "L" },
  { ipa: "r", arpabet: "R" },
  { ipa: "ʃ", arpabet: "SH" },
  { ipa: "ʒ", arpabet: "ZH" },
  { ipa: "tʃ", arpabet: "CH" },
  { ipa: "dʒ", arpabet: "JH" },
  { ipa: "θ", arpabet: "TH" },
  { ipa: "ð", arpabet: "DH" },
];

export const ARPABET = new Set(CONSONANTS.map((c) => c.arpabet));

export function ipaFor(arpabet: string): string {
  return CONSONANTS.find((c) => c.arpabet === arpabet)?.ipa ?? arpabet.toLowerCase();
}

/** Every ARPAbet phone to IPA. Unstressed AH and ER are handled in toIpa. */
const ARPA_TO_IPA: Record<string, string> = {
  AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", EH: "ɛ", ER: "ɝ", EY: "eɪ", IH: "ɪ", IY: "i", OW: "oʊ", OY: "ɔɪ", UH: "ʊ", UW: "u",
  B: "b", CH: "tʃ", D: "d", DH: "ð", F: "f", G: "ɡ", HH: "h", JH: "dʒ", K: "k", L: "l", M: "m", N: "n", NG: "ŋ", P: "p", R: "r", S: "s", SH: "ʃ", T: "t", TH: "θ", V: "v", W: "w", Y: "j", Z: "z", ZH: "ʒ",
};

/** A raw cmudict entry with stress digits ("K AO1 R AH0 L") to broad IPA ("kɔrəl"). */
export function toIpa(entry: string): string {
  return entry
    .split(" ")
    .map((p) => {
      const m = p.match(/^([A-Z]+)(\d)?$/);
      if (!m) return p;
      const [, phone, stress] = m;
      if (phone === "AH" && stress === "0") return "ə";
      if (phone === "ER" && stress === "0") return "ɚ";
      return ARPA_TO_IPA[phone] ?? phone.toLowerCase();
    })
    .join("");
}
