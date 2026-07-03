import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingPillProps {
  label: string;
  className?: string;
  delay?: number;
}

/** Small "floating" badge used to decorate the hero screenshot. Purely decorative. */
export function FloatingPill({ label, className, delay = 0 }: FloatingPillProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "hidden lg:flex absolute z-20 items-center gap-1.5 rounded-full border border-border/70 bg-card/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium shadow-md animate-float-slow",
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="grid h-4 w-4 place-items-center rounded-full bg-success/15 text-success">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
      {label}
    </div>
  );
}
