import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Reveal } from "@/components/landing/reveal";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { MeshGlow } from "@/components/landing/mesh-glow";
import { PlayCircle } from "lucide-react";

type DemoLang = "en" | "hi";

const DEMOS: Record<DemoLang, { src: string; label: string; toggleLabel: string }> = {
  en: { src: "/demo/medipost-demo-en.mp4", label: "English", toggleLabel: "Watch the demo in English" },
  hi: { src: "/demo/medipost-demo-hi.mp4", label: "हिंदी", toggleLabel: "हिंदी में डेमो देखें" },
};

/** "See Medipost in action" — a single native <video>, language-switchable in
 *  place (no navigation, no second video mounted). Reuses BrowserFrame (the
 *  same product-frame treatment as the Brand Kit / Content History showcases
 *  above) so the demo reads as more real product, not a generic embed. */
export function ProductDemo() {
  const [lang, setLang] = useState<DemoLang>("en");
  const demo = DEMOS[lang];

  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      <MeshGlow variant="soft" className="opacity-50" />
      <div className="max-w-3xl mx-auto px-6">
        <Reveal className="text-center mb-9">
          <Badge variant="outline" className="mb-4 border-primary/25 bg-primary/5 text-primary">
            <PlayCircle className="h-3 w-3" /> Product demo
          </Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">See Medipost in action</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed max-w-xl mx-auto">
            Watch how a clinic brief becomes finished, on-brand medical content — from idea to publish-ready post.
          </p>
        </Reveal>

        <Reveal direction="scale" delay={0.05}>
          <div className="flex justify-center mb-6">
            <ToggleGroup
              type="single"
              value={lang}
              onValueChange={(value) => {
                if (value) setLang(value as DemoLang);
              }}
              aria-label="Choose demo language"
              className="inline-flex gap-0.5 rounded-full border border-border bg-card p-1 shadow-sm"
            >
              {(Object.keys(DEMOS) as DemoLang[]).map((key) => (
                <ToggleGroupItem
                  key={key}
                  value={key}
                  aria-label={DEMOS[key].toggleLabel}
                  className="h-8 min-w-16 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
                >
                  {DEMOS[key].label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <BrowserFrame title="medipost.ai — product demo">
            <div className="aspect-video bg-black">
              {/* key={lang} forces a clean remount on switch, so playback
                  position/state never bleeds between languages. */}
              <video
                key={lang}
                className="h-full w-full"
                controls
                playsInline
                preload="metadata"
                poster="/demo/medipost-demo-poster.jpg"
                src={demo.src}
              >
                Your browser doesn't support embedded video. You can{" "}
                <a href={demo.src} className="underline">download the demo</a> instead.
              </video>
            </div>
          </BrowserFrame>
        </Reveal>
      </div>
    </section>
  );
}
