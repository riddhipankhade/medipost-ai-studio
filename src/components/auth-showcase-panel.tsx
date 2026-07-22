import type { CSSProperties, ReactNode } from "react";
import { Check, Gift, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";

function GlassPill({ label, className, delay = 0 }: { label: string; className?: string; delay?: number }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute z-20 flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-white shadow-lg shadow-black/10 animate-float-slow",
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="grid h-4 w-4 place-items-center rounded-full bg-white/25">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
      {label}
    </div>
  );
}

export interface ShowcaseCreative {
  image: string;
  initials: string;
  name: string;
  role: string;
  caption: string;
  hashtags: string;
}

/** Floating card showing a real generated creative, rendered in glass on the primary-color panel. Purely decorative. */
function FloatingCreative({ creative, pills }: { creative: ShowcaseCreative; pills: [string, string, string] }) {
  return (
    <div className="relative" aria-hidden>
      {/* Back card — depth layer */}
      <div className="absolute inset-0 translate-x-7 translate-y-5 rotate-[5deg] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm" />

      <div className="relative w-[clamp(180px,34vh,280px)] -rotate-2 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl shadow-2xl shadow-black/20 animate-float-slow">
        {/* Shimmer sweep */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
          <div className="absolute inset-y-0 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/10 to-transparent animate-shimmer-sweep" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 px-1 pb-2.5 pt-1">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-[10px] font-semibold text-white">{creative.initials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{creative.name}</p>
            <p className="truncate text-[10px] text-white/70">{creative.role}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-medium text-white">
            <Sparkles className="h-2.5 w-2.5" /> AI
          </span>
        </div>

        {/* Real generated creative */}
        <div className="overflow-hidden rounded-xl border border-white/10 shadow-md">
          <img
            src={creative.image}
            alt=""
            loading="eager"
            decoding="async"
            className="block aspect-square w-full object-cover"
          />
        </div>

        {/* Generated caption */}
        <div className="px-1 pb-1 pt-2.5">
          <p className="truncate text-[11px] leading-snug text-white/85">{creative.caption}</p>
          <p className="mt-1 truncate text-[10px] font-medium text-white/60">{creative.hashtags}</p>
        </div>
      </div>

      <GlassPill label={pills[0]} className="-left-14 -top-6" delay={0.8} />
      <GlassPill label={pills[1]} className="-right-28 top-[42%]" delay={2} />
      <GlassPill label={pills[2]} className="-bottom-5 -left-10" delay={3.2} />
    </div>
  );
}

interface FanCard {
  image: string;
  label: string;
  sway: string;
  delay: string;
}

const fanCards: FanCard[] = [
  { image: "/showcase/carousel-slide-1.png", label: "Carousel", sway: "-9deg", delay: "0s" },
  { image: "/showcase/medipost-post.png", label: "Post", sway: "0deg", delay: "-2.7s" },
  { image: "/showcase/medipost-riddhi-pankhade-1783481372872.png", label: "Festive", sway: "9deg", delay: "-5.4s" },
];

/** Fanned deck of real creatives in different formats, each swaying on its own axis. Purely decorative. */
export function FanShowcase() {
  return (
    <div className="relative pb-8" aria-hidden>
      <div className="flex items-center justify-center">
        {fanCards.map((card, i) => {
          const center = i === 1;
          return (
            <div
              key={card.label}
              className={cn(
                "relative shrink-0 rounded-2xl border border-white/20 bg-white/10 p-1.5 backdrop-blur-xl animate-card-sway",
                center
                  ? "z-10 w-[clamp(150px,27vh,215px)] shadow-2xl shadow-black/30"
                  : "w-[clamp(120px,22vh,175px)] translate-y-5 shadow-xl shadow-black/20",
                i === 0 && "-mr-9",
                i === 2 && "-ml-9",
              )}
              style={{ "--sway": card.sway, transform: `rotate(${card.sway})`, animationDelay: card.delay } as CSSProperties}
            >
              <img
                src={card.image}
                alt=""
                loading="eager"
                decoding="async"
                className="block aspect-square w-full rounded-[10px] object-cover"
              />
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                {card.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="absolute -bottom-1 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-semibold text-primary shadow-xl shadow-black/20 animate-float-slow">
        <Gift className="h-3.5 w-3.5" />
        First 10 posts on us
      </div>
    </div>
  );
}

const defaultCreative: ShowcaseCreative = {
  image: "/showcase/login-showcase-post.png",
  initials: "RS",
  name: "Dr Raj Sharma",
  role: "Dermatologist · Raj Clinic",
  caption: "Your skin is your body's first line of defence — here's how to keep it strong.",
  hashtags: "#SkinHealth #DermTips #RajClinic",
};

const defaultPills: [string, string, string] = [
  "Generated in 12s",
  "On-brand colors applied",
  "Medically accurate tone",
];

interface AuthShowcasePanelProps {
  headline: ReactNode;
  subtext: string;
  creative?: ShowcaseCreative;
  pills?: [string, string, string];
  /** Custom middle composition; replaces the default single floating creative. */
  showcase?: ReactNode;
}

/** Premium left panel for the auth pages: drifting glows, floating creative mock, staggered copy. Hidden below lg. */
export function AuthShowcasePanel({ headline, subtext, creative = defaultCreative, pills = defaultPills, showcase }: AuthShowcasePanelProps) {
  return (
    <div className="relative hidden lg:flex h-full min-h-0 flex-col overflow-hidden bg-primary p-8 text-primary-foreground xl:p-12">
      {/* Ambient background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-32 -top-32 h-[440px] w-[440px] rounded-full opacity-50 blur-[100px] animate-mesh-drift"
          style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.35), transparent)" }}
        />
        <div
          className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full opacity-40 blur-[110px] animate-mesh-drift"
          style={{ background: "radial-gradient(closest-side, color-mix(in oklch, var(--color-brand-sky) 50%, transparent), transparent)", animationDelay: "-9s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 80% 65% at 50% 35%, black 30%, transparent 80%)",
          }}
        />
        <div className="absolute inset-0 bg-noise" />
      </div>

      <FadeIn className="relative z-10">
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/25 bg-white/85 backdrop-blur p-1">
            <img src="/logo-icon.png" alt="" className="h-full w-full" />
          </span>
          <span className="text-[1.05rem] tracking-tight">
            Medipost <span className="text-white/85">AI</span>
          </span>
        </Link>
      </FadeIn>

      <div className="relative z-10 grid min-h-0 flex-1 place-items-center py-6">
        <FadeIn delay={0.15}>
          {showcase ?? <FloatingCreative creative={creative} pills={pills} />}
        </FadeIn>
      </div>

      <div className="relative z-10 space-y-4">
        <FadeIn delay={0.25}>
          <h2 className="text-[clamp(1.4rem,3.4vh,1.875rem)] font-semibold leading-tight tracking-tight">{headline}</h2>
          <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-primary-foreground/80 xl:text-base">{subtext}</p>
        </FadeIn>
        <FadeIn delay={0.35} className="flex items-center gap-3">
          <div className="flex -space-x-2" aria-hidden>
            {["SK", "MP", "JD", "AV"].map((initials) => (
              <span
                key={initials}
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-primary bg-white/25 text-[9px] font-semibold text-white backdrop-blur"
              >
                {initials}
              </span>
            ))}
          </div>
          <p className="text-sm text-primary-foreground/80">Trusted by 1,200+ clinicians</p>
        </FadeIn>
        <p className="text-sm text-primary-foreground/70">© 2026 Medipost AI</p>
      </div>
    </div>
  );
}
