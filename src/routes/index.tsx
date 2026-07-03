import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/brand";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Sparkles, Instagram, FileText, BookOpen, Check, Stethoscope, Clock, Shield } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Brand />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
            <Button size="sm" asChild><Link to="/register">Get started</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(60% 55% at 50% 0%, var(--surface), transparent 70%)" }}
        />
        <FadeIn className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20 text-center">
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
            <Button size="lg" variant="outline" asChild><Link to="/dashboard">View live demo</Link></Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">No credit card required · 5 free generations</p>
        </FadeIn>
        <FadeIn delay={0.12} className="max-w-5xl mx-auto px-6 pb-20">
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/40">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="ml-3 text-xs text-muted-foreground">medipost.ai / generate</span>
            </div>
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-7 border-r border-border">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Brief</p>
                <div className="space-y-2 text-sm">
                  <Row label="Specialty" value="Dentist" />
                  <Row label="Content type" value="Instagram Post" />
                  <Row label="Topic" value="Daily oral hygiene" />
                  <Row label="Tone" value="Friendly" />
                </div>
                <Button size="sm" className="mt-5 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Generate</Button>
              </div>
              <div className="p-7 bg-surface">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Generated</p>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">{`✨ A brighter smile starts with small daily habits!\n\n1. Brush twice a day (2 min each!)\n2. Floss before bed\n3. Swap soda for water\n4. Visit your dentist every 6 months\n\n#DentalCare #HealthySmile`}</pre>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section id="features" className="py-20 md:py-24 bg-surface border-y border-border/60">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Everything a modern practice needs</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">From social posts to patient handouts — built around the way doctors actually work.</p>
          </FadeIn>
          <Stagger className="grid md:grid-cols-3 gap-5">
            <StaggerItem><Feature icon={Instagram} title="Instagram posts" desc="Engaging, on-brand captions with the right hashtags for your specialty." /></StaggerItem>
            <StaggerItem><Feature icon={FileText} title="Patient education" desc="Clear, friendly handouts your patients can take home and understand." /></StaggerItem>
            <StaggerItem><Feature icon={BookOpen} title="Blog articles" desc="Long-form, SEO-friendly articles to grow your clinic's online presence." /></StaggerItem>
            <StaggerItem><Feature icon={Stethoscope} title="Specialty-aware" desc="Dental, derma, cardio, GP — content adapts to your field automatically." /></StaggerItem>
            <StaggerItem><Feature icon={Clock} title="30-second drafts" desc="From idea to publishable draft faster than writing the first line yourself." /></StaggerItem>
            <StaggerItem><Feature icon={Shield} title="Medically grounded" desc="Built-in guardrails to keep content safe, factual and patient-appropriate." /></StaggerItem>
          </Stagger>
        </div>
      </section>

      <section id="how" className="py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">How it works</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">Three steps from blank page to published post.</p>
          </FadeIn>
          <Stagger className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { n: "1", t: "Pick your brief", d: "Specialty, content type, topic, tone." },
              { n: "2", t: "Generate in seconds", d: "Medipost drafts content tailored to your patients." },
              { n: "3", t: "Copy, save, post", d: "Share to Instagram or print as a handout." },
            ].map((s) => (
              <StaggerItem key={s.n}>
                <div className="mx-auto h-11 w-11 rounded-full grid place-items-center bg-primary text-primary-foreground font-semibold">{s.n}</div>
                <h3 className="mt-4 font-semibold">{s.t}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.d}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="pricing" className="py-20 md:py-24 bg-surface border-y border-border/60">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Simple, doctor-friendly pricing</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">Start small. Upgrade when your practice grows.</p>
          </FadeIn>
          <Stagger className="grid md:grid-cols-3 gap-5 items-start">
            <StaggerItem><Plan name="Starter" price="₹499" gens="50 generations / month" features={["All content types", "Copy & save", "Email support"]} /></StaggerItem>
            <StaggerItem><Plan name="Pro" price="₹1,999" gens="300 generations / month" highlight features={["Everything in Starter", "Priority generation", "Content history & search", "Brand tone presets"]} /></StaggerItem>
            <StaggerItem><Plan name="Clinic" price="₹6,999" gens="Unlimited generations" features={["Everything in Pro", "Up to 10 doctor seats", "Team library", "Dedicated success manager"]} /></StaggerItem>
          </Stagger>
        </div>
      </section>

      <FadeIn className="py-20 md:py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to delight your patients?</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">Join 1,200+ doctors creating with Medipost AI.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild className="gap-2"><Link to="/register"><Sparkles className="h-4 w-4" /> Start free</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/login">Sign in</Link></Button>
          </div>
        </div>
      </FadeIn>

      <footer className="border-t border-border/70 py-8">
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

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="group rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/25">
      <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 text-primary mb-4 transition-transform duration-200 group-hover:scale-105">
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
    </div>
  );
}

function Plan({ name, price, gens, features, highlight }: { name: string; price: string; gens: string; features: string[]; highlight?: boolean }) {
  return (
    <div
      className={`relative rounded-2xl border bg-card p-7 transition-shadow duration-200 ${
        highlight ? "border-primary/30 shadow-lg" : "border-border/70 shadow-sm hover:shadow-md"
      }`}
    >
      {highlight && <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground border-transparent">Most popular</Badge>}
      <p className="text-sm font-medium text-muted-foreground">{name}</p>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-3xl font-semibold tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">/month</span>
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
      <Button asChild className="w-full mt-7" variant={highlight ? "default" : "outline"}>
        <Link to="/register">Choose {name}</Link>
      </Button>
    </div>
  );
}
