import { ShieldCheck, Lock, Stethoscope } from "lucide-react";
import { AnimatedNumber } from "@/components/landing/animated-number";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";

const badges = [
  { icon: ShieldCheck, label: "Built for healthcare professionals" },
  { icon: Lock, label: "Patient privacy respected" },
  { icon: Stethoscope, label: "Medical-review recommended before posting" },
];

const stats = [
  { value: 12400, suffix: "+", label: "posts generated" },
  { value: 540, suffix: "+", label: "clinics onboarded" },
  { value: 6, suffix: " hrs", label: "saved weekly, per clinic" },
];

/** Credibility strip shown directly under the hero: badges, stat counters. Placeholder figures — swap for real numbers once available. */
export function TrustBar() {
  return (
    <div className="relative border-y border-border/60 bg-surface/60">
      <div className="max-w-6xl mx-auto px-6 py-7 md:py-8">
        <Reveal className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 text-center mb-6">
          {badges.map((b) => (
            <span key={b.label} className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
              <b.icon className="h-4 w-4 text-primary shrink-0" strokeWidth={2} /> {b.label}
            </span>
          ))}
        </Reveal>
        <RevealGroup className="grid grid-cols-3 gap-4 md:gap-10 max-w-xl mx-auto text-center">
          {stats.map((s) => (
            <RevealItem key={s.label} direction="scale">
              <p className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[11px] md:text-xs text-muted-foreground mt-1 leading-snug">{s.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </div>
  );
}
