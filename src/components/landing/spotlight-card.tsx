import * as React from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

/**
 * Card wrapper with a soft radial highlight that follows the cursor.
 * Uses a ref + direct style writes (not React state) so mousemove never
 * triggers a re-render.
 */
export const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  ({ className, active, children, onMouseMove, ...props }, forwardedRef) => {
    const innerRef = React.useRef<HTMLDivElement>(null);

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
      const el = innerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
        el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
      }
      onMouseMove?.(e);
    }

    return (
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        onMouseMove={handleMouseMove}
        className={cn(
          "group/spotlight relative overflow-hidden rounded-2xl border bg-card transition-all duration-300",
          active ? "border-primary/40 shadow-lg" : "border-border/70 shadow-sm hover:shadow-md",
          className,
        )}
        {...props}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
          style={{
            background:
              "radial-gradient(240px circle at var(--spot-x, 50%) var(--spot-y, 0%), color-mix(in oklch, var(--color-primary) 10%, transparent), transparent 70%)",
          }}
        />
        <div className="relative">{children}</div>
      </div>
    );
  },
);
SpotlightCard.displayName = "SpotlightCard";
