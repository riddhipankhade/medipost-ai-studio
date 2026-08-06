import { Link } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/** Nudge shown in Content Studio while the brand kit is incomplete — hides itself at 100%. */
export function BrandKitProgressBanner({ percent }: { percent: number }) {
  if (percent >= 100) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
        <Palette className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-semibold text-primary">
            Complete your brand kit for the best personalized posts
          </p>
          <span className="text-sm font-semibold text-primary shrink-0">{percent}% complete</span>
        </div>
        <Progress value={percent} className="mt-2.5 h-1.5" />
      </div>
      <Button asChild size="sm" className="shrink-0 gap-2">
        <Link to="/brand">Complete Brand Kit</Link>
      </Button>
    </div>
  );
}
