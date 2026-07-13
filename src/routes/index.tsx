import type { ComponentType } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/brand";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";
import { MeshGlow } from "@/components/landing/mesh-glow";
import { AmbientCursor } from "@/components/landing/ambient-cursor";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { FloatingPill } from "@/components/landing/floating-pill";
import { ContentStudioShowcase } from "@/components/landing/content-studio-showcase";
import { GeneratedPostPreview } from "@/components/landing/generated-post-preview";
import { AnimatedNumber } from "@/components/landing/animated-number";
import { LandingNav } from "@/components/landing/landing-nav";
import { Sparkles, Check, Palette, History, Zap, Crown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/landing/spotlight-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medipost AI — AI content for doctors & clinics" },
      { name: "description", content: "AI-powered social media and patient education content built for doctors, dentists, and clinics." },
      { property: "og:title", content: "Medipost AI" },
      { property: "og:description", content: "AI content for healthcare professionals." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background relative">
      <div aria-hidden className="fixed inset-0 z-40 bg-noise pointer-events-none" />
      <AmbientCursor />

      <LandingNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <MeshGlow variant="hero" />
        <Reveal className="max-w-6xl mx-auto px-6 pt-20 pb-14 md:pt-28 text-center">
          <Badge variant="outline" className="mb-6 gap-1.5 border-primary/25 bg-primary/5 text-primary">
            <Sparkles className="h-3 w-3" /> Built for healthcare professionals
          </Badge>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl mx-auto text-balance">
            AI content your <span className="text-primary">patients actually read.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Medipost AI helps doctors, dentists, and clinics generate Instagram posts, patient education and blog articles in seconds — without sounding robotic.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild className="gap-2"><Link to="/register"><Sparkles className="h-4 w-4" /> Start free</Link></Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">No credit card required · 10 free generations</p>
        </Reveal>

        <Reveal direction="scale" delay={0.1} className="max-w-4xl mx-auto px-6 pb-28 md:pb-36">
          <div className="relative">
            <FloatingPill label="AI Generated" className="-left-6 -top-4" delay={0} />
            <FloatingPill label="Patient Friendly" className="-right-8 top-1/4" delay={0.6} />
            <FloatingPill label="Clinic Ready" className="-left-8 bottom-1/4" delay={1.1} />
            <FloatingPill label="Instagram Ready" className="-right-6 -bottom-4" delay={1.7} />

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
                  <Button size="sm" className="mt-5 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Generate</Button>
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
        </Reveal>
      </section>

      {/* ── Content Studio (interactive) ───────────────────────────────────── */}
      <section id="features" className="relative py-20 md:py-28 border-y border-border/60">
        <MeshGlow variant="soft" className="opacity-60" />
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="max-w-2xl mb-14">
            <Badge variant="outline" className="mb-4 border-primary/25 bg-primary/5 text-primary">Content Studio</Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">One studio. Every format your practice needs.</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Pick a format on the left — the preview updates instantly on the right.
            </p>
          </Reveal>
          <Reveal direction="scale" delay={0.05}>
            <ContentStudioShowcase />
          </Reveal>
        </div>
      </section>

      {/* ── Product showcase (alternating) ─────────────────────────────────── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 space-y-28 md:space-y-36">
          <Showcase
            eyebrow="Brand Kit"
            icon={Palette}
            title="Content that always sounds like your clinic."
            desc="Set your specialty, tone and visual identity once. Every post, story and handout Medipost generates stays consistent with your brand — no re-explaining yourself every time."
            chips={["Tone presets", "Color palette", "Specialty-aware voice"]}
            direction="left"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                {["oklch(0.58 0.1 199)", "oklch(0.7 0.12 60)", "oklch(0.6 0.15 25)", "oklch(0.5 0.02 235)"].map((c) => (
                  <span key={c} className="h-9 w-9 rounded-full border border-border/70 shadow-sm" style={{ background: c }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {["Friendly", "Reassuring", "Clinical", "Warm"].map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
          </Showcase>

          <Showcase
            eyebrow="Content History"
            icon={History}
            title="Never lose a post you've already written."
            desc="Every generation is saved and instantly searchable — find exactly what you posted last month in a couple of clicks."
            chips={["Full-text search", "Filter by format"]}
            direction="right"
          >
            <div className="p-6 space-y-3">
              {[
                { t: "Instagram Post", s: "Dentist", d: "2d ago" },
                { t: "Patient Education", s: "Cardiology", d: "5d ago" },
                { t: "Reel Script", s: "Dermatology", d: "1w ago" },
              ].map((r) => (
                <div key={r.t} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3.5 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">{r.s}</Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{r.t}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{r.d}</span>
                </div>
              ))}
            </div>
          </Showcase>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how" className="relative py-20 md:py-28 border-y border-border/60 bg-surface">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">How it works</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">Three steps from blank page to published post.</p>
          </Reveal>
          <RevealGroup className="relative grid md:grid-cols-3 gap-10 text-center">
            <div aria-hidden className="hidden md:block absolute top-5 left-[16.5%] right-[16.5%] h-px bg-linear-to-r from-transparent via-border to-transparent" />
            {[
              { n: "1", t: "Pick your brief", d: "Specialty, content type, topic, tone." },
              { n: "2", t: "Generate in seconds", d: "Medipost drafts content tailored to your patients." },
              { n: "3", t: "Copy, save, post", d: "Share to Instagram or print as a handout." },
            ].map((s) => (
              <RevealItem key={s.n} direction="scale" className="relative">
                <div className="mx-auto h-11 w-11 rounded-full grid place-items-center bg-primary text-primary-foreground font-semibold shadow-md">{s.n}</div>
                <h3 className="mt-4 font-semibold">{s.t}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.d}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="relative py-20 md:py-28 overflow-hidden">
        <MeshGlow variant="soft" className="opacity-50" />
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Simple, doctor-friendly pricing</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">Every new account starts free. Upgrade when your practice grows.</p>
          </Reveal>
          <RevealGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            <RevealItem direction="scale">
              <Plan
                name="Free Trial"
                icon={Sparkles}
                price={0}
                gens="10 generations / month"
                badge="Included free"
                cta="Get started free"
                features={["Auto-applied on signup", "No card required", "All content types"]}
              />
            </RevealItem>
            <RevealItem direction="scale">
              <Plan name="Starter" icon={Zap} price={499} gens="50 generations / month" features={["All content types", "Copy & save", "Email support"]} />
            </RevealItem>
            <RevealItem direction="scale">
              <Plan name="Pro" icon={Crown} price={1999} gens="300 generations / month" badge="Most popular" highlight features={["Everything in Starter", "Priority generation", "Content history & search", "Brand tone presets"]} />
            </RevealItem>
            <RevealItem direction="scale">
              <Plan name="Clinic" icon={Building2} price={6999} gens="Unlimited generations" features={["Everything in Pro", "Up to 10 doctor seats", "Team library", "Dedicated success manager"]} />
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <Reveal className="relative py-20 md:py-28">
        <MeshGlow variant="soft" />
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to delight your patients?</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">Join 1,200+ doctors creating with Medipost AI.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild className="gap-2 shadow-[0_0_0_1px_var(--color-primary)_inset,0_10px_30px_-10px_oklch(0.58_0.1_199_/_0.5)]">
              <Link to="/register"><Sparkles className="h-4 w-4" /> Start free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild><Link to="/login">Sign in</Link></Button>
          </div>
        </div>
      </Reveal>

      <footer className="relative border-t border-border/70 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <Brand />
          <p>© 2026 Medipost AI · Built for healthcare professionals</p>
        </div>
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Showcase({
  eyebrow,
  icon: Icon,
  title,
  desc,
  chips,
  direction,
  children,
}: {
  eyebrow: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  chips: string[];
  direction: "left" | "right";
  children: React.ReactNode;
}) {
  const textFirst = direction === "left";
  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <Reveal direction={textFirst ? "left" : "right"} className={textFirst ? "lg:order-1" : "lg:order-2"}>
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-5">
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </div>
        <Badge variant="outline" className="mb-3 border-primary/25 bg-primary/5 text-primary">{eyebrow}</Badge>
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-balance">{title}</h3>
        <p className="text-muted-foreground mt-4 leading-relaxed max-w-md">{desc}</p>
        <div className="flex flex-wrap gap-2 mt-6">
          {chips.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium">
              <Check className="h-3 w-3 text-primary" /> {c}
            </span>
          ))}
        </div>
      </Reveal>
      <Reveal direction="scale" delay={0.1} className={cnOrder(textFirst)}>
        <div className="relative">
          <MeshGlow variant="corner" className={textFirst ? "-right-10 -top-10" : "-left-10 -top-10"} />
          <BrowserFrame title="medipost.ai" glow={false}>
            {children}
          </BrowserFrame>
        </div>
      </Reveal>
    </div>
  );
}

function cnOrder(textFirst: boolean) {
  return textFirst ? "lg:order-2" : "lg:order-1";
}

function Plan({
  name,
  icon: Icon,
  price,
  gens,
  features,
  highlight,
  badge,
  cta,
}: {
  name: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  price: number;
  gens: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
  cta?: string;
}) {
  return (
    <div className="relative">
      {highlight && (
        <div className="absolute -inset-1.5 rounded-[1.5rem] bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50 blur-xl opacity-60 animate-card-glow -z-10" />
      )}
      {badge && (
        <Badge
          className={cn(
            "absolute -top-3 left-6 z-10 overflow-hidden border-transparent",
            highlight ? "bg-primary text-primary-foreground shadow-[0_2px_12px_-2px_oklch(0.58_0.1_199_/_0.6)]" : "bg-success/10 text-success border-success/20",
          )}
        >
          {badge}
          {highlight && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/60 to-transparent"
            />
          )}
        </Badge>
      )}
      <SpotlightCard active={highlight} className="p-7 hover:-translate-y-1.5">
        <div
          className={cn(
            "h-10 w-10 rounded-xl grid place-items-center mb-4",
            highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{name}</p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-semibold tracking-tight">
            {price === 0 ? "Free" : <AnimatedNumber value={price} prefix="₹" />}
          </span>
          {price > 0 && <span className="text-sm text-muted-foreground">/month</span>}
        </div>
        <p className="text-sm text-primary mt-1.5 font-medium">{gens}</p>
        <ul className="space-y-2.5 text-sm mt-6">
          {features.map((f) => (
            <li key={f} className="flex gap-2.5">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-foreground/90">{f}</span>
            </li>
          ))}
        </ul>
        <Button
          asChild
          className={cn(
            "w-full mt-7 transition-transform duration-200",
            highlight && "shadow-[0_10px_30px_-10px_oklch(0.58_0.1_199_/_0.6)] hover:shadow-[0_14px_36px_-8px_oklch(0.58_0.1_199_/_0.7)]",
          )}
          variant={highlight ? "default" : "outline"}
        >
          <Link to="/register">{cta ?? `Choose ${name}`}</Link>
        </Button>
      </SpotlightCard>
    </div>
  );
}
