import { Link } from "@tanstack/react-router";
import { Rocket, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div
      className={cn(
        "rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5",
        className,
      )}
    >
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
      <Button asChild size="lg" className="gap-2 shrink-0">
        <Link to="/subscription">{growthButtonLabel(eligible)}</Link>
      </Button>
    </div>
  );
}
