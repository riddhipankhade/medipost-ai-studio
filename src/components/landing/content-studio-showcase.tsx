import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Instagram, Layers, Camera, Clapperboard, Megaphone, PartyPopper, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { GeneratedPostPreview, PhotoPattern } from "@/components/landing/generated-post-preview";

interface ContentType {
  id: string;
  label: string;
  icon: LucideIcon;
  blurb: string;
  preview: React.ReactNode;
}

const AUTOPLAY_MS = 4200;

function Lines({ n, className }: { n: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 rounded-full bg-foreground/10"
          style={{ width: `${i === n - 1 ? 55 : 92 - i * 6}%` }}
        />
      ))}
    </div>
  );
}

const contentTypes: ContentType[] = [
  {
    id: "single-post",
    label: "Single Post",
    icon: Instagram,
    blurb: "A polished, on-brand Instagram post with caption and hashtags — ready in one shot.",
    preview: (
      <GeneratedPostPreview
        icon={Instagram}
        heading="Your heart's urgent message: listen."
        body="Ever felt a sudden, unfamiliar squeeze in your chest? Here's what it could mean — and when to see a cardiologist."
        hashtags="#HeartHealth #Cardiology #PatientEducation"
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
        <div className="relative h-52 mb-4">
          <div className="absolute inset-x-8 top-3 h-48 rounded-xl bg-primary/10 rotate-3" />
          <div className="absolute inset-x-4 top-1.5 h-48 rounded-xl bg-primary/15 -rotate-2" />
          <div className="absolute inset-x-0 top-0 h-48 rounded-xl border border-border shadow-md overflow-hidden">
            <PhotoPattern icon={Layers} />
            <div className="absolute inset-x-3 bottom-3 rounded-lg bg-background/95 backdrop-blur px-3 py-2">
              <p className="text-xs font-semibold">Skin hydration: myth vs. fact</p>
            </div>
            <span className="absolute top-2 right-2.5 text-[10px] font-medium text-white/90 bg-black/30 rounded-full px-2 py-0.5">1 / 5</span>
          </div>
        </div>
        <Lines n={2} />
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
        <div className="relative w-36 rounded-2xl overflow-hidden aspect-9/16 p-2.5">
          <PhotoPattern icon={Camera} />
          <div className="relative flex gap-1 mb-3">
            <div className="h-1 flex-1 rounded-full bg-white/90" />
            <div className="h-1 flex-1 rounded-full bg-white/35" />
            <div className="h-1 flex-1 rounded-full bg-white/35" />
          </div>
          <div className="absolute inset-x-2.5 bottom-2.5 rounded-md bg-background/95 backdrop-blur px-2.5 py-2">
            <p className="text-[11px] font-semibold leading-tight">3 signs you shouldn't ignore</p>
          </div>
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
      <div className="p-6 space-y-3">
        {["0:00 — Hook", "0:03 — Problem", "0:09 — Solution", "0:15 — CTA"].map((s) => (
          <div key={s} className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2.5">
            <span className="text-xs font-medium text-primary whitespace-nowrap">{s}</span>
            <div className="h-2 flex-1 rounded-full bg-foreground/10" />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "awareness",
    label: "Awareness Campaign",
    icon: Megaphone,
    blurb: "A themed, multi-day post series built around a health-awareness observance.",
    preview: (
      <div className="p-6 grid grid-cols-2 gap-3">
        {["Day 1", "Day 2", "Day 3", "Day 4"].map((d) => (
          <div key={d} className="relative rounded-xl overflow-hidden aspect-square">
            <PhotoPattern icon={Megaphone} />
            <span className="absolute bottom-2 left-2.5 text-[11px] font-medium text-white bg-black/30 rounded-full px-2 py-0.5">{d}</span>
          </div>
        ))}
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
        icon={PartyPopper}
        clinic="Sunrise Dental Clinic"
        heading="Wishing you a bright, healthy Diwali! ✨"
        body="From our clinic family to yours — may this festival bring joy, warmth and radiant smiles."
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
