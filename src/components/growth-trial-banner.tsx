import { Link } from "@tanstack/react-router";
import { Rocket, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShineSweep, GlowHalo } from "@/components/landing/shine-sweep";
import { cn } from "@/lib/utils";
import { growthButtonLabel } from "@/lib/growth-trial-copy";

const BENEFITS = [
  "60 AI posts / month",
  "Premium quality generation",
  "Template Studio unlocked",
  "No watermark",
];

/**
 * Benefits-led Growth upsell for non-paying users — the dashboard's replacement
 * for a plain "you're on the free plan" nudge. Copy branches on trial eligibility
 * (see useGrowthTrialEligible) but always discloses duration, renewal price, and
 * cancellation window, per the no-surprises billing copy standard used app-wide.
 */
export function GrowthTrialBanner({
  eligible,
  className,
}: {
  eligible: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <GlowHalo inset="-inset-2" className="rounded-2xl" />
      <div className="relative rounded-2xl border border-primary/40 bg-primary/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Rocket className="h-4 w-4" /> Unlock Growth
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-1.5 text-foreground/90">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            {eligible
              ? "Start your 7-day trial for just ₹1. Then ₹499/month — auto-renews, cancel anytime before renewal."
              : "₹499/month, cancel anytime."}
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="relative gap-2 shrink-0 overflow-hidden shadow-[0_10px_30px_-10px_color-mix(in_oklch,var(--color-primary)_60%,transparent)] hover:shadow-[0_14px_36px_-8px_color-mix(in_oklch,var(--color-primary)_70%,transparent)]"
        >
          <Link to="/subscription">
            <ShineSweep />
            {growthButtonLabel(eligible)}
          </Link>
        </Button>
      </div>
    </div>
  );
}
