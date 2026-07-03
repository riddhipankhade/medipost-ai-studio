import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  title?: string;
  className?: string;
  glow?: boolean;
  tilt?: boolean;
  children: React.ReactNode;
}

/** Floating browser-chrome frame used to showcase real product UI on the landing page. */
export function BrowserFrame({ title = "medipost.ai", className, glow = true, tilt = false, children }: BrowserFrameProps) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [6, -6]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 150, damping: 20 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!tilt || reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <div className={cn("relative", className)} style={{ perspective: 1400 }}>
      {glow && (
        <div
          aria-hidden
          className="absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-3xl"
          style={{ background: "radial-gradient(closest-side, oklch(0.58 0.1 199 / 0.25), transparent)" }}
        />
      )}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={tilt && !reduce ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
        whileHover={tilt && !reduce ? { scale: 1.01 } : undefined}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="rounded-[1.75rem] border border-border bg-card shadow-lg overflow-hidden"
      >
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/70 bg-muted/40">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="ml-3 text-xs text-muted-foreground truncate">{title}</span>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
