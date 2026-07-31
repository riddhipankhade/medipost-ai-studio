import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourStep } from "@/lib/onboarding-tour";

const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 12;
const GAP = 12;

function findVisibleTarget(selector: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(selector);
  for (const el of Array.from(candidates)) {
    if (el.offsetParent !== null) return el;
  }
  return null;
}

/**
 * Spotlight coach-mark tour. Steps whose target isn't currently visible (e.g.
 * a desktop-sidebar item while on a narrow viewport where it's unmounted or
 * hidden) are skipped automatically rather than shown against nothing.
 */
export function ProductTour({ steps, onFinish }: { steps: TourStep[]; onFinish: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = steps[stepIndex];

  useLayoutEffect(() => {
    if (!step) {
      onFinish();
      return;
    }

    // Falls through to the next step (rather than freezing the spotlight in
    // place) whenever the current target can no longer be found — covers a
    // window resize crossing the mobile breakpoint mid-tour, not just the
    // initial visibility check.
    function reposition() {
      const el = findVisibleTarget(step!.target);
      if (!el) {
        setStepIndex((i) => i + 1);
        return;
      }
      setRect(el.getBoundingClientRect());
    }

    const el = findVisibleTarget(step.target);
    if (!el) {
      setStepIndex((i) => i + 1);
      return;
    }
    el.scrollIntoView({ behavior: "auto", block: "center" });
    setRect(el.getBoundingClientRect());

    // Content-driven size changes (e.g. a skeleton resolving to real data
    // inside the spotlighted card) don't fire resize/scroll — a
    // ResizeObserver on the target itself catches those too.
    const resizeObserver = new ResizeObserver(reposition);
    resizeObserver.observe(el);

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onFinish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFinish]);

  if (!step || !rect) return null;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const spotlightStyle: CSSProperties = {
    position: "fixed",
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
    borderRadius: SPOTLIGHT_RADIUS,
    boxShadow: "0 0 0 9999px rgba(15, 15, 20, 0.65)",
    pointerEvents: "none",
    zIndex: 101,
    transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
  };

  const popoverWidth = Math.min(320, viewportW - 32);
  const spaceBelow = viewportH - (rect.bottom + SPOTLIGHT_PADDING);
  const placeBelow = spaceBelow > 180 || rect.top < 200;

  let popoverLeft = rect.left + rect.width / 2 - popoverWidth / 2;
  popoverLeft = Math.min(Math.max(popoverLeft, 16), viewportW - popoverWidth - 16);

  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0" style={{ zIndex: 100 }} onClick={(e) => e.stopPropagation()} />
      <div style={spotlightStyle} />
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: placeBelow ? -8 : 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "fixed",
            top: placeBelow ? rect.bottom + SPOTLIGHT_PADDING + GAP : undefined,
            bottom: !placeBelow ? viewportH - rect.top + SPOTLIGHT_PADDING + GAP : undefined,
            left: popoverLeft,
            width: popoverWidth,
            zIndex: 102,
          }}
          className="rounded-2xl border border-border/70 bg-popover text-popover-foreground shadow-xl p-5"
        >
          <button
            onClick={onFinish}
            aria-label="Skip tour"
            className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="font-semibold pr-6">{step.title}</p>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.description}</p>

          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIndex ? "w-4 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStepIndex((i) => i - 1)}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={() => (isLast ? onFinish() : setStepIndex((i) => i + 1))}>
                {isLast ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
