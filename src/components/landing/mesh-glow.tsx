import { cn } from "@/lib/utils";

interface MeshGlowProps {
  className?: string;
  variant?: "hero" | "soft" | "corner";
}

/** Decorative blurred gradient blobs used to add depth behind sections. Purely visual, aria-hidden. */
export function MeshGlow({ className, variant = "soft" }: MeshGlowProps) {
  if (variant === "hero") {
    return (
      <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
        <div
          className="absolute left-1/2 top-[-10%] h-[560px] w-[820px] -translate-x-1/2 rounded-full opacity-60 blur-[110px] animate-mesh-drift"
          style={{ background: "radial-gradient(closest-side, color-mix(in oklch, var(--color-primary) 28%, transparent), transparent)" }}
        />
        <div
          className="absolute right-[8%] top-[8%] h-[320px] w-[320px] rounded-full opacity-40 blur-[90px] animate-mesh-drift"
          style={{ background: "radial-gradient(closest-side, color-mix(in oklch, var(--color-brand-sky) 30%, transparent), transparent)", animationDelay: "-6s" }}
        />
        <div className="absolute inset-0 bg-grid-texture" />
      </div>
    );
  }

  if (variant === "corner") {
    return (
      <div aria-hidden className={cn("pointer-events-none absolute -z-10 overflow-hidden", className)}>
        <div
          className="h-[420px] w-[420px] rounded-full opacity-30 blur-[100px]"
          style={{ background: "radial-gradient(closest-side, color-mix(in oklch, var(--color-primary) 30%, transparent), transparent)" }}
        />
      </div>
    );
  }

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div
        className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklch, var(--color-primary) 22%, transparent), transparent)" }}
      />
    </div>
  );
}
