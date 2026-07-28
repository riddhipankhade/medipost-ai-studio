import { useState } from "react";
import { Crown, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useShowWatermark } from "@/lib/use-subscription";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * Medipost brand badge (icon + wordmark) shown only on Starter/free-plan
 * creatives. Self-hydrates plan state via useAuth()/useShowWatermark() so it
 * can be dropped into any shared render component (SlideCanvas, StoryCard,
 * FestiveCard, template FrameShell) with zero prop-threading — mirrors
 * useBrandKit()'s self-hydrating pattern. Defaults to the top-right corner,
 * which is the one spot free across every layout's brand header/CTA/contact
 * bar placement; pass `style` to override per call site where it isn't.
 */
export function Watermark({ style }: { style?: React.CSSProperties }) {
  const { user } = useAuth();
  const show = useShowWatermark(user?.id);
  if (!show) return null;
  return (
    <div
      aria-hidden
      className="absolute z-40 flex items-center gap-1 rounded-full pl-1 pr-2 py-1 pointer-events-none select-none shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
      style={{ top: 8, right: 8, background: "rgba(255,255,255,0.95)", ...style }}
    >
      <img src="/logo-icon.png" alt="" className="h-3.5 w-3.5 object-contain shrink-0" />
      <span className="text-[9px] font-bold tracking-wide whitespace-nowrap" style={{ color: "#0f4c4c" }}>
        Medipost
      </span>
    </div>
  );
}

/**
 * "Remove watermark" nudge for the action row beneath a Starter/free-plan
 * creative preview — the same free-tier-to-upgrade prompt Canva/Descript/etc.
 * put next to their download button. Self-hydrates plan state the same way
 * Watermark does, so it renders as nothing at all once a shop is on Growth.
 * Lives outside the creative canvas (unlike Watermark), so no export filter
 * is needed here.
 */
export function RemoveWatermarkRow({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const show = useShowWatermark(user?.id);
  const [open, setOpen] = useState(false);
  if (!show) return null;
  return (
    <div className={`text-center ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Lock className="h-3 w-3" />
        Remove watermark — Upgrade to Growth
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[color:var(--teal)]" />
              Remove the Medipost watermark
            </DialogTitle>
            <DialogDescription>
              Starter/free-plan creatives carry a small Medipost badge. Upgrade to Growth to export clean, watermark-free posts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-col sm:justify-stretch sm:space-x-0 gap-2">
            <Button onClick={() => (window.location.href = "/subscription")} className="w-full">
              Upgrade to Growth — ₹499/mo
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
              Maybe later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
