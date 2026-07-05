import { Copy, Stethoscope, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoPatternProps {
  icon?: LucideIcon;
  className?: string;
}

/**
 * Stand-in for a real product photo: a soft gradient + dot texture + faint
 * icon watermark. Deliberately not a flat empty gradient. Swap for a real
 * <img> once photography is available — the surrounding layout won't change.
 */
export function PhotoPattern({ icon: Icon = Stethoscope, className }: PhotoPatternProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-linear-to-br from-primary/25 via-primary/10 to-background" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <Icon className="h-[45%] w-[45%] text-primary/25" strokeWidth={1} />
      </div>
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/25 via-black/0 to-black/5" />
    </div>
  );
}

interface GeneratedPostPreviewProps {
  clinic?: string;
  heading?: string;
  body?: string;
  hashtags?: string;
  icon?: LucideIcon;
  /** Real generated creative — replaces the mocked photo + caption card entirely (the creative carries its own text). */
  image?: string;
  imageAlt?: string;
  className?: string;
}

/** Mock of an actual generated post — photo background + overlaid caption card, matching the real product's output. */
export function GeneratedPostPreview({
  clinic = "Dr. Aisha Rao · Dentist",
  heading,
  body,
  hashtags,
  icon,
  image,
  imageAlt,
  className,
}: GeneratedPostPreviewProps) {
  return (
    <div className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Generated</p>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
          <Copy className="h-3 w-3" /> Copy
        </span>
      </div>
      {image ? (
        <div className="rounded-xl overflow-hidden border border-border/60 shadow-sm">
          <img src={image} alt={imageAlt ?? "Generated creative"} loading="lazy" decoding="async" className="block w-full h-auto" />
        </div>
      ) : (
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
          <PhotoPattern icon={icon} />
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 text-[11px] font-medium shadow-sm">
            <span className="h-4 w-4 rounded-full bg-primary shrink-0" />
            {clinic}
          </div>
          <div className="absolute inset-x-3 bottom-3 rounded-lg bg-background/95 backdrop-blur p-3.5 shadow-md">
            <p className="font-semibold text-sm leading-snug text-foreground">{heading}</p>
            <div className="h-px bg-border my-2" />
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{body}</p>
          </div>
        </div>
      )}
      {hashtags && <p className="text-xs text-primary/80 mt-3 leading-relaxed">{hashtags}</p>}
    </div>
  );
}
