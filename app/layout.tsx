import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minnow",
  description:
    "Articulation practice sets for speech-language pathologists. Words proposed by AI, verified by a pronunciation dictionary, voiced by ElevenLabs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
