import { NextResponse } from "next/server";
import { z } from "zod";
import { verify } from "@/lib/verify";
import { minimalPair } from "@/lib/pairs";

const Input = z.object({
  word: z.string().trim().min(1).max(40),
  phoneme: z.string().regex(/^[A-Z]{1,2}$/),
  position: z.enum(["initial", "medial", "final"]),
  syllables: z.enum(["1-2", "3"]),
  singleton: z.boolean().default(false),
  contrast: z.string().regex(/^[A-Z]{0,2}$/).default(""),
});

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { word, contrast, ...target } = parsed.data;
  const verdict = verify(word, target);
  const pair = verdict.status === "pass" && contrast ? minimalPair(word, target.phoneme, target.position, contrast) : null;
  return NextResponse.json(pair ? { ...verdict, pair } : verdict);
}
