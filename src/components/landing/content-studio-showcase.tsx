import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Instagram, Layers, Camera, Clapperboard, Megaphone, PartyPopper, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { GeneratedPostPreview } from "@/components/landing/generated-post-preview";

interface ContentType {
  id: string;
  label: string;
  icon: LucideIcon;
  blurb: string;
  preview: React.ReactNode;
}

const AUTOPLAY_MS = 4200;

const contentTypes: ContentType[] = [
  {
    id: "single-post",
    label: "Single Post",
    icon: Instagram,
    blurb: "A polished, on-brand Instagram post with caption and hashtags — ready in one shot.",
    preview: (
      <GeneratedPostPreview
        image="/showcase/medipost-post.png"
        imageAlt="Generated Instagram post — 'Tiny Humans, More Bones?' newborn-bones fact over a baby photo, with clinic branding and a Connect with us button"
        hashtags="#DidYouKnow #ChildHealth #Pediatrics"
      />
    ),
  },
  {
    id: "carousel",
    label: "Carousel",
    icon: Layers,
    blurb: "Multi-slide carousels that walk patients through a topic, slide by slide.",
    preview: (
      <div className="p-6">
        <div className="flex justify-center items-center max-w-md mx-auto">
          <div className="relative z-10 w-[54%] -rotate-2 rounded-xl border border-border shadow-lg overflow-hidden">
            <img
              src="/showcase/medipost-slide-1-of-3.png"
              alt="Generated carousel slide 1 of 3 — 'Can You Really Shrink Pores?' skincare myth-busting hook over a photo of people scrolling their phones, with clinic branding"
              loading="lazy"
              decoding="async"
              className="block w-full h-auto"
            />
          </div>
          <div className="relative w-[54%] ml-[-8%] rotate-2 rounded-xl border border-border shadow-md overflow-hidden">
            <img
              src="/showcase/medipost-slide-2-of-3.png"
              alt="Generated carousel slide 2 of 3 — 'Myth: Pores Shrink Permanently' myth-vs-fact skincare slide with clinic branding"
              loading="lazy"
              decoding="async"
              className="block w-full h-auto"
            />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "story",
    label: "Story",
    icon: Camera,
    blurb: "Vertical, full-screen stories with quick tips patients can tap through.",
    preview: (
      <div className="p-6 flex justify-center">
        <div className="w-48 rounded-2xl overflow-hidden border border-border shadow-md">
          <img
            src="/showcase/story-stat.jpg"
            alt="Generated Instagram story — statistic hook about flossing with a booking call-to-action"
            loading="lazy"
            decoding="async"
            className="block w-full h-auto"
          />
        </div>
      </div>
    ),
  },
  {
    id: "reel-script",
    label: "Reel Script",
    icon: Clapperboard,
    blurb: "Scene-by-scene reel scripts with hooks, timing and on-screen text cues.",
    preview: (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="bg-gradient-to-r from-[color:var(--teal)]/10 to-primary/10 px-4 py-2.5 flex items-center gap-2 border-b border-border">
            <Clapperboard className="h-4 w-4 text-[color:var(--teal)]" />
            <p className="text-xs font-semibold">30–45 second reel · Dentist</p>
          </div>
          <div className="p-4 space-y-3.5">
            <div className="rounded-lg border border-[color:var(--teal)]/40 bg-[color:var(--teal)]/5 p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground">HOOK</p>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">0–3s</Badge>
              </div>
              <p className="text-xs leading-relaxed">Most patients make *this* mistake when brushing their teeth.</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground">MAIN TALKING POINTS</p>
              {[
                "It feels thorough, but brushing too hard actually wears down enamel over time.",
                "Focus on gentle, circular motions for two full minutes, twice a day.",
              ].map((p, i) => (
                <div key={i} className="flex gap-2.5 text-xs">
                  <span className="h-4 w-4 shrink-0 grid place-items-center rounded-full bg-[color:var(--teal)]/15 text-[color:var(--teal)] text-[10px] font-semibold">{i + 1}</span>
                  <span className="leading-relaxed">{p}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground">CTA</p>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">End</Badge>
              </div>
              <p className="text-xs leading-relaxed">Book your cleaning with us — link in bio.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "awareness",
    label: "Awareness Campaign",
    icon: Megaphone,
    blurb: "A themed, multi-day post series built around a health-awareness observance.",
    preview: (
      <div className="p-6 space-y-4">
        <div className="rounded-xl border border-border bg-gradient-to-br from-[color:var(--teal)]/10 to-primary/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--teal)]">Campaign theme</p>
          <p className="text-base font-bold mt-1">Oral Health Awareness Week</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Help patients build daily habits that prevent cavities and gum disease — one post at a time.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Suggested weekly schedule</p>
          {[
            { day: "Mon", format: "Carousel", idea: "5 brushing mistakes patients don't know they're making" },
            { day: "Wed", format: "Reel", idea: "60-second flossing technique, done right" },
            { day: "Fri", format: "Single Post", idea: "Myth vs. fact: does sugar really cause cavities?" },
          ].map((d) => (
            <div key={d.day} className="flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-2.5">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-[color:var(--teal)]/10 text-[color:var(--teal)] grid place-items-center font-semibold text-[11px]">
                {d.day}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{d.format}</p>
                <p className="text-xs mt-0.5 truncate">{d.idea}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "festive",
    label: "Festive Wishes",
    icon: PartyPopper,
    blurb: "Warm, on-brand greetings for festivals and holidays your patients celebrate.",
    preview: (
      <GeneratedPostPreview
        image="/showcase/medipost-dr-raj-sharma-1785228026413.png"
        imageAlt="Generated festive greeting card — Happy Christmas wishes over a decorated tree, signed by the clinic"
        hashtags="#Diwali #FestiveWishes #FromOurClinic"
      />
    ),
  },
];

export function ContentStudioShowcase() {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const active = contentTypes[index];

  React.useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % contentTypes.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [reduce, paused, index]);

  function select(i: number) {
    setIndex(i);
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
      <div
        className="grid sm:grid-cols-2 gap-3.5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {contentTypes.map((type, i) => {
          const Icon = type.icon;
          const isActive = i === index;
          return (
            <SpotlightCard
              key={type.id}
              active={isActive}
              onClick={() => select(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") select(i);
              }}
              className={cn(
                "cursor-pointer p-5 transition-transform duration-200 hover:-translate-y-0.5",
                isActive && "ring-1 ring-primary/30",
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-xl grid place-items-center mb-3 transition-colors duration-200",
                  isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </div>
              <p className="font-medium text-sm">{type.label}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{type.blurb}</p>
              {isActive && !reduce && (
                <div className="mt-3 h-0.5 rounded-full bg-primary/15 overflow-hidden">
                  <motion.div
                    key={paused ? "paused" : index}
                    className="h-full bg-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: paused ? "0%" : "100%" }}
                    transition={paused ? { duration: 0 } : { duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                  />
                </div>
              )}
            </SpotlightCard>
          );
        })}
      </div>

      <div className="lg:sticky lg:top-24">
        <BrowserFrame title={`medipost.ai / generate · ${active.label}`}>
          <div className="min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, filter: "blur(6px)", y: 8 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(6px)", y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {active.preview}
              </motion.div>
            </AnimatePresence>
          </div>
        </BrowserFrame>
      </div>
    </div>
  );
}
