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
