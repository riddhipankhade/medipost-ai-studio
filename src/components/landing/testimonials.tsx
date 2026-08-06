import { Star, Quote } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";
import { SpotlightCard } from "@/components/landing/spotlight-card";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

/** Same demo clinic personas used throughout the product's showcase creatives — swap for real customer quotes once collected. */
const testimonials: Testimonial[] = [
  {
    quote:
      "I used to lose Sunday evenings writing Instagram captions. Now I generate a full week of posts before my first patient walks in — and they finally look as professional as my clinic.",
    name: "Dr. Aisha Rao",
    role: "Dentist",
    initials: "AR",
  },
  {
    quote:
      "Medipost writes in my voice and stays on-brand automatically. My feed went from once a month to three times a week without hiring a designer or a writer.",
    name: "Dr. Raj Sharma",
    role: "Dermatologist",
    initials: "RS",
  },
  {
    quote:
      "Patients started asking about topics straight from our posts. It's the easiest marketing win we've had all year — and it takes minutes, not hours.",
    name: "Dr. Rhea Patel",
    role: "Pediatrician",
    initials: "RP",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-16 md:py-24 border-b border-border/60 bg-surface">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Clinicians get their week back</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">What clinic owners say after switching their content workflow to Medipost.</p>
        </Reveal>
        <RevealGroup className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <RevealItem key={t.name} direction="scale">
              <SpotlightCard className="p-6 h-full flex flex-col">
                <Quote className="h-6 w-6 text-primary/40 mb-3" strokeWidth={1.5} />
                <div className="flex gap-0.5 mb-3" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border/60">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.role}</p>
                  </div>
                </div>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
