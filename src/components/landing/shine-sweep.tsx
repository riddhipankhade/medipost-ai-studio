import { cn } from "@/lib/utils";

/** Light sweep + pulsing glow for the one high-emphasis CTA on a section. Purely decorative. */
export function ShineSweep({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}
    >
      <span className="absolute inset-y-0 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/35 to-transparent animate-shimmer-sweep" />
    </span>
  );
}

/** Blurred pulsing halo placed behind a card/button to make it "pop". Render as a preceding sibling, parent must be relative. */
export function GlowHalo({ className, inset = "-inset-2" }: { className?: string; inset?: string }) {
  return (
    <div
      aria-hidden
      className={cn(inset, "absolute -z-10 rounded-[inherit] opacity-70 blur-xl animate-card-glow", className)}
      style={{ background: "radial-gradient(closest-side, color-mix(in oklch, var(--color-primary) 45%, transparent), transparent)" }}
    />
  );
}
