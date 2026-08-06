import { Sparkles } from "lucide-react";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { FloatingPill } from "@/components/landing/floating-pill";
import { GeneratedPostPreview } from "@/components/landing/generated-post-preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

interface FloatingCreativeProps {
  image: string;
  alt: string;
  label: string;
  className: string;
  aspect?: string;
  delay?: number;
}

/** Small tilted card showing a real generated creative, floating around the hero demo. Purely decorative — hidden below lg so mobile stays clean. */
function FloatingCreative({ image, alt, label, className, aspect = "aspect-square", delay = 0 }: FloatingCreativeProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "hidden lg:block absolute z-20 w-28 xl:w-32 rounded-xl border border-border/70 bg-card p-1.5 shadow-xl animate-float-slow",
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={cn("overflow-hidden rounded-lg", aspect)}>
        <img src={image} alt={alt} loading="lazy" decoding="async" className="block h-full w-full object-cover" />
      </div>
      <p className="mt-1.5 px-0.5 pb-0.5 text-[10px] font-medium text-muted-foreground truncate">{label}</p>
    </div>
  );
}

/**
 * Hero visual: a live-looking "brief → generate → real creative" demo, surrounded by
 * floating real generated creatives in other formats/specialties. Replaces empty hero
 * space with direct product proof — every image here is an actual Medipost output.
 */
export function HeroShowcase() {
  return (
    <div className="relative">
      <FloatingCreative
        image="/showcase/serif-card.jpg"
        alt="Generated carousel slide — myth-busting skincare hook, dermatology"
        label="Carousel · Dermatology"
        className="-left-6 -top-10 -rotate-6"
        delay={0}
      />
      <FloatingCreative
        image="/showcase/story-stat.jpg"
        alt="Generated Instagram story — flossing statistic, dentistry"
        label="Story · Dentistry"
        aspect="aspect-[9/16]"
        className="-right-12 top-4 rotate-6"
        delay={0.9}
      />
      <FloatingPill label="On-brand colors applied" className="-left-8 bottom-1/4" delay={1.6} />
      <FloatingPill label="Generated in 12s" className="-right-8 -bottom-5" delay={2.4} />

      <BrowserFrame title="medipost.ai / generate" tilt>
        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-7 border-r border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Brief</p>
            <div className="space-y-2 text-sm">
              <Row label="Specialty" value="Dentist" />
              <Row label="Content type" value="Instagram Post" />
              <Row label="Topic" value="Brushing myths" />
              <Row label="Tone" value="Friendly" />
            </div>
            <Button size="sm" className="mt-5 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Generate
            </Button>
          </div>
          <GeneratedPostPreview
            className="bg-surface"
            image="/showcase/faq-photo.jpg"
            imageAlt="Generated Instagram post — question and answer bubbles about brushing technique over an AI photo"
            hashtags="#DentalCare #HealthySmile #OralHygiene"
          />
        </div>
      </BrowserFrame>
    </div>
  );
}
