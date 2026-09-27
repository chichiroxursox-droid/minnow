// Small pieces shared by the therapist and family views.

export const btn =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-teal/40 disabled:cursor-default";
export const btnQuiet = `${btn} border border-sand-deep bg-shell text-ink hover:bg-paper disabled:opacity-50`;
export const btnPlay = `${btn} border border-teal/40 bg-teal-mist/60 text-teal-deep hover:bg-teal-mist disabled:opacity-60`;

export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg width="44" height="26" viewBox="0 0 44 26" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
      <ellipse cx="17" cy="13" rx="15" ry="8" fill="var(--color-teal)" />
      <path d="M30 13l11-7-3.5 7 3.5 7z" fill="var(--color-teal)" />
      <circle cx="9" cy="11.5" r="1.8" fill="var(--color-paper)" />
    </svg>
  );
}

export function PlayIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 1.8v8.4l7-4.2z" fill="currentColor" />
    </svg>
  );
}

export function MicIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <rect x="4" y="1" width="4" height="6" rx="2" />
      <path d="M2.5 6a3.5 3.5 0 0 0 7 0M6 9.5V11" />
    </svg>
  );
}

export function Seg<T extends string | number>({
  value,
  options,
  label,
  onChange,
  size = "md",
}: {
  value: T;
  options: readonly T[];
  label?: (o: T) => string;
  onChange: (v: T) => void;
  size?: "md" | "lg";
}) {
  return (
    <div className={`inline-flex items-center rounded-lg border border-sand-deep bg-shell p-0.5 ${size === "lg" ? "h-12 text-base" : "h-10 text-sm"}`}>
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          aria-pressed={o === value}
          onClick={() => onChange(o)}
          className={`rounded-md transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${size === "lg" ? "px-5 py-2" : "px-3 py-1"} ${
            o === value ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper hover:text-ink"
          }`}
        >
          {label ? label(o) : String(o)}
        </button>
      ))}
    </div>
  );
}
