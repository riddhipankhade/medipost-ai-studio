/**
 * src/components/carousel-layouts.tsx
 *
 * Carousel slide layout components. The 5 original manual-format layouts
 * (Centered/ImageLeft/FullImage/Split/ModernCard) are extracted verbatim from
 * src/routes/_app.generate.tsx and keep their hand-tuned values.
 *
 * The 10 content-driven archetypes below them are composition-driven: each one
 * reads its CompositionRules (via getComposition) and the design tokens
 * (typeScale / spacing×whitespace / radius / shadow), so illustration placement,
 * density, reading direction and type hierarchy differ per archetype instead of
 * every archetype sharing one header→title→middle→cta→footer scaffold.
 */
import { Globe, Phone, ImagePlus, Check } from "lucide-react";
import { iconsFor, type SlideLayout, getTheme } from "@/lib/carousel-themes";
import { useBrandKit } from "@/lib/brand-kit";
import type { ContentCategory } from "@/lib/mock-data";
import { illustrationFor, illustrations } from "@/components/illustrations";
import { splitContentItemsForLayout, extractStatistic, resolveEmphasis, type Emphasis } from "@/lib/visual-strategy";
import { getComposition, type Composition, spacing, radius, shadow, typeScale } from "@/lib/design-tokens";

export type SlideCanvasProps = {
  slideTitle: string; slideBody: string; slideIndex: number; totalSlides: number;
  isCta: boolean; cta: string; specialty: string;
  theme: ReturnType<typeof getTheme> & { fontFamily: string };
  layout: SlideLayout; fontScale: number; showIcons: boolean;
  brand: ReturnType<typeof useBrandKit>[0];
  imageUrl?: string | null; imageLoading?: boolean;
  /** content-driven layouts only — optional so the 5 original manual layouts are unaffected */
  topic?: string; category?: ContentCategory; composition?: Composition;
};

export type LayoutProps = SlideCanvasProps & {
  titleSize: number; bodySize: number;
  PrimaryIcon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
};

export function BrandHeader({ p }: { p: LayoutProps }) {
  return (
    <div className="flex items-center gap-2 relative z-10">
      {p.brand.logo
        ? <img src={p.brand.logo} alt="" className="h-8 w-8 rounded-md object-cover bg-white" />
        : <div className="h-8 w-8 rounded-md grid place-items-center" style={{ background: `${p.theme.heading}22`, color: p.theme.heading }}>
            <p.PrimaryIcon className="h-4 w-4" />
          </div>}
      <p className="text-[11px] font-semibold tracking-wide truncate" style={{ color: p.theme.heading }}>{p.brand.clinicName}</p>
    </div>
  );
}

export function BrandFooter({ p }: { p: LayoutProps }) {
  return (
    <div className="flex items-center gap-3 text-[9px] relative z-10 pt-2 border-t" style={{ borderColor: `${p.theme.heading}33`, color: p.theme.text }}>
      {p.brand.doctorName && (
        <span className="font-semibold truncate" style={{ color: p.theme.heading }}>
          {p.brand.doctorName}{p.specialty ? ` · ${p.specialty}` : ""}
        </span>
      )}
      <span className="inline-flex items-center gap-1 truncate"><Globe className="h-2.5 w-2.5" /> {p.brand.website}</span>
      <span className="inline-flex items-center gap-1 truncate"><Phone className="h-2.5 w-2.5" /> {p.brand.phone}</span>
    </div>
  );
}

export function CtaPill({ p }: { p: LayoutProps }) {
  if (!p.isCta) return null;
  return <div className="inline-block px-4 py-2 rounded-full text-xs font-semibold mt-3" style={{ background: p.theme.accent, color: "#fff" }}>{p.cta}</div>;
}

export function CenteredLayout(p: LayoutProps) {
  return (
    <div className="absolute inset-0 z-10 p-6 flex flex-col">
      <BrandHeader p={p} />
      <div className="flex-1 grid place-items-center text-center px-2">
        <div>
          <div className="h-10 w-10 rounded-full grid place-items-center mx-auto mb-3" style={{ background: `${p.theme.accent}33`, color: p.theme.accent }}>
            <p.PrimaryIcon className="h-5 w-5" />
          </div>
          <h3 className="font-bold leading-tight" style={{ color: p.theme.heading, fontSize: p.titleSize }}>{p.slideTitle}</h3>
          <p className="mt-3 leading-relaxed" style={{ color: p.theme.text, fontSize: p.bodySize }}>{p.slideBody}</p>
          <CtaPill p={p} />
        </div>
      </div>
      <BrandFooter p={p} />
    </div>
  );
}

export function ImageLeftLayout(p: LayoutProps) {
  return (
    <div className="absolute inset-0 z-10 p-5 flex flex-col">
      <BrandHeader p={p} />
      <div className="flex-1 grid grid-cols-[40%_1fr] gap-3 mt-3">
        <ImagePlaceholder p={p} />
        <div className="flex flex-col justify-center">
          <h3 className="font-bold leading-tight" style={{ color: p.theme.heading, fontSize: p.titleSize * 0.85 }}>{p.slideTitle}</h3>
          <p className="mt-2 leading-relaxed" style={{ color: p.theme.text, fontSize: p.bodySize * 0.95 }}>{p.slideBody}</p>
          <CtaPill p={p} />
        </div>
      </div>
      <BrandFooter p={p} />
    </div>
  );
}

export function FullImageLayout(p: LayoutProps) {
  const photo = p.brand.coverPhoto || p.brand.clinicPhoto;
  return (
    <>
      {photo ? <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <ImagePlaceholder p={p} full />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div className="absolute inset-0 z-10 p-6 flex flex-col text-white">
        <BrandHeader p={{ ...p, theme: { ...p.theme, heading: "#fff", text: "#fff" } }} />
        <div className="flex-1" />
        <div>
          <h3 className="font-bold leading-tight" style={{ fontSize: p.titleSize }}>{p.slideTitle}</h3>
          <p className="mt-2 opacity-90" style={{ fontSize: p.bodySize }}>{p.slideBody}</p>
          <CtaPill p={p} />
        </div>
        <BrandFooter p={{ ...p, theme: { ...p.theme, heading: "#fff", text: "#fff" } }} />
      </div>
    </>
  );
}

export function SplitLayout(p: LayoutProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      <div className="h-[42%] relative p-5 flex flex-col justify-between" style={{ background: p.theme.accent }}>
        <BrandHeader p={{ ...p, theme: { ...p.theme, heading: "#fff" } }} />
        <h3 className="font-bold leading-tight text-white" style={{ fontSize: p.titleSize }}>{p.slideTitle}</h3>
      </div>
      <div className="flex-1 p-5 flex flex-col bg-white/95 backdrop-blur">
        <p className="leading-relaxed text-gray-700" style={{ fontSize: p.bodySize }}>{p.slideBody}</p>
        <CtaPill p={p} />
        <div className="mt-auto">
          <BrandFooter p={{ ...p, theme: { ...p.theme, heading: "#222", text: "#555" } }} />
        </div>
      </div>
    </div>
  );
}

export function ModernCardLayout(p: LayoutProps) {
  return (
    <div className="absolute inset-0 z-10 p-5 flex flex-col">
      <BrandHeader p={p} />
      <div className="flex-1 grid place-items-center">
        <div className="w-full rounded-xl p-5 backdrop-blur shadow-lg border" style={{ background: "rgba(255,255,255,0.92)", borderColor: `${p.theme.accent}55` }}>
          <div className="h-9 w-9 rounded-lg grid place-items-center mb-3" style={{ background: `${p.theme.accent}22`, color: p.theme.accent }}>
            <p.PrimaryIcon className="h-5 w-5" />
          </div>
          <h3 className="font-bold leading-tight text-gray-900" style={{ fontSize: p.titleSize * 0.9 }}>{p.slideTitle}</h3>
          <p className="mt-2 leading-relaxed text-gray-600" style={{ fontSize: p.bodySize * 0.95 }}>{p.slideBody}</p>
          <CtaPill p={p} />
        </div>
      </div>
      <BrandFooter p={p} />
    </div>
  );
}

export function FullImageOverlayLayout(p: LayoutProps) {
  return (
    <div className="absolute inset-0 z-10 p-6 flex flex-col text-white">
      <BrandHeader p={{ ...p, theme: { ...p.theme, heading: "#ffffff", text: "#ffffff" } }} />
      <div className="flex-1" />
      <div className="relative">
        <h3 className="font-bold leading-tight drop-shadow" style={{ fontSize: p.titleSize }}>{p.slideTitle}</h3>
        <p className="mt-2 opacity-95" style={{ fontSize: p.bodySize }}>{p.slideBody}</p>
        <CtaPill p={p} />
      </div>
      <div className="mt-4">
        <BrandFooter p={{ ...p, theme: { ...p.theme, heading: "#ffffff", text: "#ffffff" } }} />
      </div>
    </div>
  );
}

export function ImagePlaceholder({ p, full }: { p: LayoutProps; full?: boolean }) {
  const photo = p.brand.clinicPhoto || p.brand.doctorPhoto || p.brand.coverPhoto;
  if (photo) return <img src={photo} alt="" className={`${full ? "absolute inset-0 w-full h-full" : "w-full h-full"} object-cover rounded-lg`} />;
  return (
    <div className={`${full ? "absolute inset-0" : "h-full w-full"} rounded-lg grid place-items-center text-center`}
      style={{ background: `repeating-linear-gradient(45deg, ${p.theme.accent}11 0 10px, ${p.theme.accent}22 10px 20px)`, color: p.theme.heading }}>
      <div className="flex flex-col items-center gap-1 opacity-80">
        <ImagePlus className="h-6 w-6" />
        <span className="text-[9px] font-medium tracking-wide uppercase">AI image area</span>
      </div>
    </div>
  );
}

export function ContextualBackground({ specialty, opacity, color }: { specialty: string; opacity: number; color: string }) {
  const Icons = iconsFor(specialty);
  const positions = [
    { top: "8%", left: "10%", size: 56, rot: -10 }, { top: "20%", left: "78%", size: 38, rot: 18 },
    { top: "45%", left: "5%", size: 30, rot: 6 }, { top: "60%", left: "85%", size: 64, rot: -22 },
    { top: "78%", left: "20%", size: 42, rot: 12 }, { top: "30%", left: "45%", size: 90, rot: -6 },
    { top: "85%", left: "60%", size: 34, rot: 24 },
  ];
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {positions.map((pos, i) => {
        const Icon = Icons[i % Icons.length];
        return <Icon key={i} style={{ position: "absolute", top: pos.top, left: pos.left, width: pos.size, height: pos.size, transform: `rotate(${pos.rot}deg)`, color, opacity }} />;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT-DRIVEN ARCHETYPES
// Selected by src/lib/visual-strategy.ts based on each slide's relationship.
// Contract: every archetype below derives its geometry from compMetrics()
// (CompositionRules + whitespace-scaled spacing tokens) and its type hierarchy
// from typo() (typeScale tokens × fontScale). illustrationPlacement,
// illustrationEmphasis, density and readingDirection must all be observable in
// the rendered output — no archetype may ignore its composition.
// ─────────────────────────────────────────────────────────────────────────────

/** CompositionRules for this slide plus whitespace-scaled spacing values. */
function compMetrics(p: LayoutProps, fallback: Composition) {
  const rules = getComposition(p.composition ?? fallback);
  return {
    ...rules,
    pad:        Math.round(spacing.outerPadding * rules.whitespace),
    gap:        Math.round(spacing.itemGap * rules.whitespace),
    cardGap:    Math.round(spacing.cardGap * rules.whitespace),
    sectionGap: Math.round(spacing.sectionGap * rules.whitespace),
  };
}

/** Typography role from design tokens, scaled by the slide's fontScale. */
function typo(role: keyof typeof typeScale, fontScale: number): React.CSSProperties {
  const t = typeScale[role];
  return { fontSize: t.size * fontScale, fontWeight: t.weight, lineHeight: t.lineHeight };
}

function illustrationComponentFor(p: LayoutProps) {
  const key = illustrationFor(p.specialty, p.topic ?? p.slideTitle, p.category);
  return illustrations[key];
}

function radialPositions(count: number, r = 38): { top: string; left: string }[] {
  return Array.from({ length: count }, (_, i) => {
    // half-step offset keeps 12 o'clock empty so no chip collides with the title above
    const angle = ((i + 0.5) / count) * 2 * Math.PI - Math.PI / 2;
    const top = 50 + r * Math.sin(angle);
    const left = 50 + r * Math.cos(angle);
    return { top: `${top}%`, left: `${left}%` };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO-AWARE RENDERING — when a slide has an AI-generated background image
// (p.imageUrl), archetypes render on top of it instead of being replaced by it.
// SlideCanvas already paints the photo + a base top/mid/bottom dark gradient
// behind these components (see _app.generate.tsx), so the helpers below only
// need to guarantee text/chip contrast against an arbitrary photo.
// ─────────────────────────────────────────────────────────────────────────────

/** white heading/text so BrandHeader/BrandFooter read correctly over a photo (same
 *  convention already used by FullImageLayout/SplitLayout for their photo variants) */
function photoTheme(p: LayoutProps) {
  return { ...p.theme, heading: "#ffffff", text: "#ffffff" };
}

/** inline style for title/body text floating directly over a photo, no card behind it */
function photoText(weight: "heading" | "body" = "heading") {
  return {
    color: weight === "heading" ? "#ffffff" : "rgba(255,255,255,0.92)",
    textShadow: "0 2px 10px rgba(0,0,0,0.55)",
  } as const;
}

const PHOTO_CHIP_BG = "rgba(255,255,255,0.94)";
const PHOTO_CHIP_TEXT = "#1f2937";

/**
 * HeroCard — composition "hero-left" (editorial: illustration bleeds off the
 * left edge, eyebrow + title + body read left→right beside it) or
 * "hero-center" (promotional poster: large centered illustration, centered
 * stacked message). readingDirection picks the branch; illustrationEmphasis
 * sizes the artwork; over a photo the message drops to a bottom caption.
 */
export function HeroCard(p: LayoutProps) {
  const onImage = !!p.imageUrl;
  const Illustration = illustrationComponentFor(p);
  const c = compMetrics(p, "hero-left");
  const headerTheme = onImage ? photoTheme(p) : p.theme;

  if (onImage) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
        <BrandHeader p={{ ...p, theme: headerTheme }} />
        <div className="flex-1 flex flex-col justify-end">
          <h3 style={{ ...typo("heroTitle", p.fontScale), ...photoText("heading") }}>{p.slideTitle}</h3>
          <p style={{ ...typo("body", p.fontScale), ...photoText("body"), marginTop: c.gap }}>{p.slideBody}</p>
          <div><CtaPill p={p} /></div>
        </div>
        <BrandFooter p={{ ...p, theme: headerTheme }} />
      </div>
    );
  }

  if (c.readingDirection === "left-right") {
    const placeRight = c.illustrationPlacement === "right";
    return (
      <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
        <BrandHeader p={p} />
        <div className="flex-1 flex flex-row items-center" style={{ gap: c.cardGap }}>
          <div className="shrink-0"
            style={{ width: `${c.illustrationEmphasis * 100}%`, ...(placeRight ? { order: 2, marginRight: -c.pad * 0.6 } : { marginLeft: -c.pad * 0.6 }) }}>
            <Illustration className="w-full h-auto" accent={p.theme.accent} line={p.theme.heading} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="uppercase" style={{ ...typo("caption", p.fontScale), letterSpacing: "0.14em", color: p.theme.accent }}>{p.specialty}</p>
            <h3 style={{ ...typo("heroTitle", p.fontScale), color: p.theme.heading, marginTop: c.gap * 0.5 }}>{p.slideTitle}</h3>
            <p style={{ ...typo("body", p.fontScale), color: p.theme.text, marginTop: c.gap }}>{p.slideBody}</p>
            <CtaPill p={p} />
          </div>
        </div>
        <BrandFooter p={p} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col text-center" style={{ padding: c.pad }}>
      <BrandHeader p={p} />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div style={{ width: `${c.illustrationEmphasis * 100}%` }}>
          <Illustration className="w-full h-auto" accent={p.theme.accent} line={p.theme.heading} />
        </div>
        <h3 style={{ ...typo("heroTitle", p.fontScale), color: p.theme.heading, marginTop: c.sectionGap }}>{p.slideTitle}</h3>
        <p style={{ ...typo("body", p.fontScale), color: p.theme.text, marginTop: c.gap, maxWidth: c.density === "low" ? "85%" : "100%" }}>{p.slideBody}</p>
        <CtaPill p={p} />
      </div>
      <BrandFooter p={p} />
    </div>
  );
}

/**
 * IconGrid — composition "infographic": tight whitespace, a banded masthead
 * that merges brand + illustration badge + title (no free-floating title row),
 * then a numbered grid of tiles. density caps the item count.
 */
export function IconGrid(p: LayoutProps) {
  const onImage = !!p.imageUrl;
  const Illustration = illustrationComponentFor(p);
  const c = compMetrics(p, "infographic");
  const items = splitContentItemsForLayout(p.slideBody).slice(0, c.density === "low" ? 4 : 6);
  const list = items.length ? items : [p.slideBody];
  const cols = list.length <= 2 ? 1 : 2;
  const headerTheme = onImage ? photoTheme(p) : p.theme;
  const illSize = Math.round(110 * c.illustrationEmphasis);
  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
      <div style={{ background: onImage ? "rgba(0,0,0,0.35)" : `${p.theme.heading}0d`, borderRadius: radius.md, padding: c.gap }}>
        <BrandHeader p={{ ...p, theme: headerTheme }} />
        <div className="flex items-center" style={{ gap: c.gap, marginTop: c.gap }}>
          {onImage ? (
            <div className="shrink-0 rounded-full grid place-items-center" style={{ height: illSize + 10, width: illSize + 10, background: PHOTO_CHIP_BG }}>
              <Illustration style={{ height: illSize, width: illSize }} accent={p.theme.accent} line={PHOTO_CHIP_TEXT} />
            </div>
          ) : (
            <Illustration className="shrink-0" style={{ height: illSize + 10, width: illSize + 10 }} accent={p.theme.accent} line={p.theme.heading} />
          )}
          <h3 style={{ ...typo("sectionHeading", p.fontScale), ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
        </div>
      </div>
      <div className="flex-1 grid content-center" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: c.gap, marginTop: c.cardGap }}>
        {list.map((item, i) => (
          <div key={i} className="flex items-start"
            style={{ gap: c.gap * 0.7, padding: c.gap * 0.8, background: onImage ? PHOTO_CHIP_BG : `${p.theme.heading}0d`, borderRadius: radius.sm, boxShadow: shadow.soft }}>
            <div className="rounded-full grid place-items-center shrink-0"
              style={{ height: 22, width: 22, background: onImage ? p.theme.accent : `${p.theme.accent}33`, color: onImage ? "#fff" : p.theme.accent, ...typo("caption", p.fontScale) }}>
              {i + 1}
            </div>
            <p className="line-clamp-4" style={{ ...typo("body", p.fontScale), color: onImage ? PHOTO_CHIP_TEXT : p.theme.text }}>{item}</p>
          </div>
        ))}
      </div>
      <CtaPill p={p} />
      <BrandFooter p={{ ...p, theme: headerTheme }} />
    </div>
  );
}

/**
 * Checklist — composition "infographic", but as ONE elevated paper panel with
 * hairline-divided rows and an item-count pill (vs IconGrid's grid of tiles).
 */
export function Checklist(p: LayoutProps) {
  const onImage = !!p.imageUrl;
  const c = compMetrics(p, "infographic");
  const items = splitContentItemsForLayout(p.slideBody).slice(0, 6);
  const list = items.length ? items : [p.slideBody];
  const headerTheme = onImage ? photoTheme(p) : p.theme;
  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
      <BrandHeader p={{ ...p, theme: headerTheme }} />
      <div className="flex items-baseline justify-between" style={{ gap: c.gap, marginTop: c.cardGap }}>
        <h3 style={{ ...typo("sectionHeading", p.fontScale), ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
        <span className="shrink-0"
          style={{ ...typo("caption", p.fontScale), background: onImage ? PHOTO_CHIP_BG : `${p.theme.accent}33`, color: onImage ? PHOTO_CHIP_TEXT : p.theme.accent, padding: "2px 10px", borderRadius: radius.pill }}>
          {list.length} {list.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center" style={{ marginTop: c.cardGap }}>
        <div style={{ background: onImage ? PHOTO_CHIP_BG : "rgba(255,255,255,0.9)", borderRadius: radius.lg, boxShadow: shadow.card, padding: `${c.gap * 0.4}px ${c.gap * 1.2}px` }}>
          {list.map((item, i) => (
            <div key={i} className="flex items-center"
              style={{ gap: c.gap, padding: `${c.gap * 0.9}px 0`, borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.08)" }}>
              <div className="rounded-full grid place-items-center shrink-0" style={{ height: 22, width: 22, background: p.theme.accent, color: "#fff" }}>
                <Check className="h-3 w-3" strokeWidth={3} />
              </div>
              <p className="line-clamp-2" style={{ ...typo("body", p.fontScale), color: "#1f2937" }}>{item}</p>
            </div>
          ))}
        </div>
      </div>
      <CtaPill p={p} />
      <BrandFooter p={{ ...p, theme: headerTheme }} />
    </div>
  );
}

/**
 * StatisticHero — composition "poster": illustration BEHIND the message at
 * illustrationEmphasis scale, generous whitespace, eyebrow → giant display
 * number → accent keyline → supporting line. No separate title row.
 */
export function StatisticHero(p: LayoutProps) {
  const onImage = !!p.imageUrl;
  const Illustration = illustrationComponentFor(p);
  const c = compMetrics(p, "poster");
  const stat = extractStatistic(p.slideBody) ?? extractStatistic(p.slideTitle);
  const statFromBody = !!extractStatistic(p.slideBody);
  const headerTheme = onImage ? photoTheme(p) : p.theme;
  const valueSize = typeScale.heroTitle.size * p.fontScale * (stat ? 1.2 + c.illustrationEmphasis * 1.6 : 1.1);
  return (
    <div className="absolute inset-0 z-10 flex flex-col text-center" style={{ padding: c.pad }}>
      <BrandHeader p={{ ...p, theme: headerTheme }} />
      <div className="flex-1 grid place-items-center relative">
        {!onImage && c.illustrationPlacement === "behind" && (
          <Illustration className="absolute" style={{ inset: `${Math.round((1 - c.illustrationEmphasis) * 30)}%`, opacity: 0.14 }}
            accent={p.theme.accent} line={p.theme.heading} />
        )}
        <div className="relative z-10 w-full">
          <p className="uppercase" style={{ ...typo("caption", p.fontScale), letterSpacing: "0.18em", ...(onImage ? photoText("body") : { color: p.theme.text, opacity: 0.85 }) }}>
            {statFromBody ? p.slideTitle : p.specialty}
          </p>
          <div style={{ fontSize: valueSize, fontWeight: 800, lineHeight: 0.95, marginTop: c.gap, ...(onImage ? { color: "#ffffff", textShadow: "0 3px 16px rgba(0,0,0,0.6)" } : { color: p.theme.accent }) }}>
            {stat?.value ?? p.slideTitle}
          </div>
          <div className="mx-auto" style={{ width: 56, height: 3, background: p.theme.accent, borderRadius: radius.pill, marginTop: c.sectionGap * 0.8 }} />
          <p className="mx-auto line-clamp-5" style={{ ...typo("sectionHeading", p.fontScale), maxWidth: "88%", marginTop: c.gap, ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>
            {stat?.label ?? p.slideBody}
          </p>
          <CtaPill p={p} />
        </div>
      </div>
      <BrandFooter p={{ ...p, theme: headerTheme }} />
    </div>
  );
}

/**
 * ComparisonSplit — composition "split-focus": two FULL-BLEED opposing panels
 * (neutral vs accent) meeting at a seam with the VS badge; myth/fact content
 * gets labeled chips and a semibold "winner" side. readingDirection stacks the
 * panels vertically if a top-down composition is ever supplied.
 */
export function ComparisonSplit(p: LayoutProps) {
  const onImage = !!p.imageUrl;
  const c = compMetrics(p, "split-focus");
  // Explicit "Myth: … Fact: …" markers win — split ONCE at the Fact marker so
  // multi-sentence sides survive intact (the sentence-boundary fallback below
  // would keep only the first sentence of each side).
  const factIdx = p.slideBody.search(/\bfact\s*[:\-–—]/i);
  const parts = factIdx > 0
    ? [p.slideBody.slice(0, factIdx), p.slideBody.slice(factIdx)].map((s) => s.trim()).filter(Boolean)
    : p.slideBody.split(/\s+vs\.?\s+|\s+instead of\s+|\.\s+(?=[A-Z])/i).map((s) => s.trim()).filter(Boolean);
  const stripLabel = (s: string) => s.replace(/^(myth|fact)\s*[:\-–—]\s*/i, "");
  const left = stripLabel(parts[0] ?? p.slideBody);
  const right = parts[1] ? stripLabel(parts[1]) : "";
  const allText = `${p.slideTitle} ${p.slideBody}`;
  const labels = right && /\bmyth\b/i.test(allText) && /\bfact\b/i.test(allText) ? (["Myth", "Fact"] as const) : null;
  const headerTheme = onImage ? photoTheme(p) : p.theme;
  const isRow = c.readingDirection === "left-right" && !!right;
  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
      <BrandHeader p={{ ...p, theme: headerTheme }} />
      <h3 className="text-center" style={{ ...typo("sectionHeading", p.fontScale), marginTop: c.gap, ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
      {/* full-bleed opposing panels — the split composition is the message */}
      <div className={`flex-1 relative flex ${isRow ? "flex-row" : "flex-col"}`} style={{ margin: `${c.cardGap}px ${-c.pad}px 0` }}>
        <div className="flex-1 flex flex-col justify-center items-start"
          style={{ gap: c.gap, background: onImage ? "rgba(17,24,39,0.55)" : `${p.theme.heading}12`, padding: `${c.gap * 1.2}px ${c.pad}px` }}>
          {labels && (
            <span className="uppercase" style={{ ...typo("caption", p.fontScale), letterSpacing: "0.1em", background: onImage ? "rgba(255,255,255,0.25)" : `${p.theme.heading}22`, color: onImage ? "#ffffff" : p.theme.heading, padding: "3px 10px", borderRadius: radius.pill }}>
              {labels[0]}
            </span>
          )}
          <p style={{ ...typo("body", p.fontScale), color: onImage ? "#ffffff" : p.theme.text }}>{left}</p>
        </div>
        {right && (
          <div className="flex-1 flex flex-col justify-center items-start"
            style={{ gap: c.gap, background: onImage ? PHOTO_CHIP_BG : `${p.theme.accent}2e`, padding: `${c.gap * 1.2}px ${c.pad}px` }}>
            {labels && (
              <span className="uppercase" style={{ ...typo("caption", p.fontScale), letterSpacing: "0.1em", background: p.theme.accent, color: "#ffffff", padding: "3px 10px", borderRadius: radius.pill }}>
                {labels[1]}
              </span>
            )}
            <p style={{ ...typo("body", p.fontScale), fontWeight: 600, color: onImage ? PHOTO_CHIP_TEXT : p.theme.text }}>{right}</p>
          </div>
        )}
        {right && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full grid place-items-center"
            style={{ height: 36, width: 36, background: p.theme.accent, color: "#fff", boxShadow: shadow.floating, ...typo("caption", p.fontScale) }}>
            VS
          </div>
        )}
      </div>
      <div style={{ marginTop: c.gap }}>
        <CtaPill p={p} />
        <BrandFooter p={{ ...p, theme: headerTheme }} />
      </div>
    </div>
  );
}

/**
 * ProcessFlow — composition "balanced": illustration sits at the top beside
 * the title (illustrationPlacement "top"), then steps zigzag left/right of a
 * central spine so the flow reads as movement, not a static checklist.
 */
export function ProcessFlow(p: LayoutProps) {
  const onImage = !!p.imageUrl;
  const Illustration = illustrationComponentFor(p);
  const c = compMetrics(p, "balanced");
  const items = splitContentItemsForLayout(p.slideBody);
  const steps = (items.length ? items : [p.slideBody]).slice(0, c.density === "low" ? 4 : 5);
  const headerTheme = onImage ? photoTheme(p) : p.theme;
  const zigzag = c.readingDirection === "top-down" && steps.length > 1;
  const illSize = Math.round(110 * c.illustrationEmphasis);
  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
      <BrandHeader p={{ ...p, theme: headerTheme }} />
      <div className="flex items-center justify-between" style={{ gap: c.gap, marginTop: c.gap }}>
        <h3 style={{ ...typo("sectionHeading", p.fontScale), ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
        {!onImage && c.illustrationPlacement === "top" && (
          <Illustration className="shrink-0" style={{ height: illSize, width: illSize }} accent={p.theme.accent} line={p.theme.heading} />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center relative" style={{ gap: c.gap, marginTop: c.gap }}>
        {zigzag && !onImage && (
          <div className="absolute left-1/2 top-2 bottom-2 -translate-x-1/2" style={{ width: 2, background: `${p.theme.accent}55` }} />
        )}
        {steps.map((step, i) => {
          const rightSide = zigzag && i % 2 === 1;
          return (
            <div key={i} className={`relative z-10 flex items-start ${rightSide ? "flex-row-reverse self-end" : "self-start"}`}
              style={{ gap: c.gap * 0.7, maxWidth: zigzag ? "78%" : "100%" }}>
              <div className="rounded-full grid place-items-center shrink-0 font-bold"
                style={{ height: 30, width: 30, background: p.theme.accent, color: "#fff", fontSize: 12 * p.fontScale, boxShadow: shadow.soft }}>
                {i + 1}
              </div>
              <p className={`line-clamp-3 ${rightSide ? "text-right" : ""}`}
                style={{ ...typo("body", p.fontScale), color: onImage ? PHOTO_CHIP_TEXT : p.theme.text, background: onImage ? PHOTO_CHIP_BG : `${p.theme.heading}0d`, padding: `${c.gap * 0.6}px ${c.gap}px`, borderRadius: radius.sm }}>
                {step}
              </p>
            </div>
          );
        })}
      </div>
      <CtaPill p={p} />
      <BrandFooter p={{ ...p, theme: headerTheme }} />
    </div>
  );
}

/**
 * Timeline — composition "balanced": a horizontal arrow axis with stops whose
 * labels alternate above/below the line, so it reads left→right as a route
 * (vs ProcessFlow's vertical zigzag). density caps the stop count.
 */
export function Timeline(p: LayoutProps) {
  const onImage = !!p.imageUrl;
  const Illustration = illustrationComponentFor(p);
  const c = compMetrics(p, "balanced");
  const items = splitContentItemsForLayout(p.slideBody).slice(0, c.density === "low" ? 3 : 4);
  const stops = items.length ? items : [p.slideBody];
  const headerTheme = onImage ? photoTheme(p) : p.theme;
  const lineColor = onImage ? "rgba(255,255,255,0.6)" : `${p.theme.heading}33`;

  // a single stop can't form a journey — render a centered milestone instead
  if (stops.length < 2) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
        <BrandHeader p={{ ...p, theme: headerTheme }} />
        <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ gap: c.cardGap }}>
          {!onImage && <Illustration style={{ height: 90, width: 90 }} accent={p.theme.accent} line={p.theme.heading} />}
          <h3 className="line-clamp-2" style={{ ...typo("sectionHeading", p.fontScale), ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
          <p className="max-w-[88%]" style={{ ...typo("body", p.fontScale), ...(onImage ? { background: PHOTO_CHIP_BG, color: PHOTO_CHIP_TEXT, padding: "8px 12px", borderRadius: radius.sm } : { color: p.theme.text }) }}>{stops[0]}</p>
        </div>
        <CtaPill p={p} />
        <BrandFooter p={{ ...p, theme: headerTheme }} />
      </div>
    );
  }

  const cols: React.CSSProperties = { gridTemplateColumns: `repeat(${stops.length}, 1fr)`, columnGap: c.gap * 0.5 };
  const labelStyle: React.CSSProperties = {
    ...typo("caption", p.fontScale), fontWeight: 600,
    ...(onImage ? { background: PHOTO_CHIP_BG, color: PHOTO_CHIP_TEXT, padding: "4px 6px", borderRadius: radius.sm } : { color: p.theme.text }),
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
      <BrandHeader p={{ ...p, theme: headerTheme }} />
      <div className="flex items-center justify-center" style={{ gap: c.gap, marginTop: c.gap }}>
        {!onImage && c.illustrationPlacement === "top" && (
          <Illustration className="shrink-0" style={{ height: 30, width: 30 }} accent={p.theme.accent} line={p.theme.heading} />
        )}
        <h3 className="text-center line-clamp-2" style={{ ...typo("sectionHeading", p.fontScale), ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
      </div>
      {/* column-locked rows (labels above / axis / labels below) — grid cells can't
          collide with the title or each other, unlike absolute positioning */}
      <div className="flex-1 flex flex-col justify-center" style={{ marginTop: c.gap }}>
        <div className="grid items-end" style={cols}>
          {stops.map((s, i) => (
            <p key={i} className="text-center line-clamp-4" style={{ ...labelStyle, visibility: i % 2 === 0 ? "visible" : "hidden" }}>{s}</p>
          ))}
        </div>
        <div className="relative my-2" style={{ height: 14 }}>
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2" style={{ height: 2, background: lineColor }} />
          <div className="absolute top-1/2 right-0 -translate-y-1/2"
            style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `8px solid ${lineColor}` }} />
          {stops.map((_, i) => (
            <div key={i} className="absolute top-1/2 rounded-full border-2"
              style={{ left: `${((i + 0.5) / stops.length) * 100}%`, transform: "translate(-50%,-50%)", height: 13, width: 13, background: p.theme.accent, borderColor: onImage ? "#ffffff" : p.theme.heading }} />
          ))}
        </div>
        <div className="grid items-start" style={cols}>
          {stops.map((s, i) => (
            <p key={i} className="text-center line-clamp-4" style={{ ...labelStyle, visibility: i % 2 === 1 ? "visible" : "hidden" }}>{s}</p>
          ))}
        </div>
      </div>
      <CtaPill p={p} />
      <BrandFooter p={{ ...p, theme: headerTheme }} />
    </div>
  );
}

/**
 * FaqCards — composition "balanced", rendered as a chat exchange: "Q" avatar +
 * accent question bubble (tail bottom-left), then the clinician's answer bubble
 * (tail bottom-right) with the doctor photo / specialty icon as avatar.
 */
export function FaqCards(p: LayoutProps) {
  const onImage = !!p.imageUrl;
  const c = compMetrics(p, "balanced");
  const question = /\?\s*$/.test(p.slideTitle) ? p.slideTitle : `${p.slideTitle}?`;
  const headerTheme = onImage ? photoTheme(p) : p.theme;
  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
      <BrandHeader p={{ ...p, theme: headerTheme }} />
      <div className="flex-1 flex flex-col justify-center" style={{ gap: c.sectionGap }}>
        <div className="flex items-end self-start max-w-[88%]" style={{ gap: c.gap * 0.6 }}>
          <div className="rounded-full grid place-items-center shrink-0"
            style={{ height: 30, width: 30, background: onImage ? PHOTO_CHIP_BG : `${p.theme.heading}15`, color: onImage ? PHOTO_CHIP_TEXT : p.theme.heading, ...typo("caption", p.fontScale) }}>
            Q
          </div>
          <div style={{ background: p.theme.accent, color: "#fff", padding: `${c.gap}px ${c.gap * 1.3}px`, borderRadius: `${radius.md}px ${radius.md}px ${radius.md}px 4px`, boxShadow: shadow.soft }}>
            <p style={typo("itemLabel", p.fontScale)}>{question}</p>
          </div>
        </div>
        <div className="flex items-end self-end max-w-[88%]" style={{ gap: c.gap * 0.6 }}>
          <div style={{ background: onImage ? PHOTO_CHIP_BG : "rgba(255,255,255,0.92)", padding: `${c.gap}px ${c.gap * 1.3}px`, borderRadius: `${radius.md}px ${radius.md}px 4px ${radius.md}px`, boxShadow: shadow.soft }}>
            <p style={{ ...typo("body", p.fontScale), color: "#1f2937" }}>{p.slideBody}</p>
          </div>
          {p.brand.doctorPhoto
            ? <img src={p.brand.doctorPhoto} alt="" className="rounded-full object-cover shrink-0" style={{ height: 30, width: 30 }} />
            : <div className="rounded-full grid place-items-center shrink-0" style={{ height: 30, width: 30, background: `${p.theme.accent}33`, color: p.theme.accent }}>
                <p.PrimaryIcon className="h-4 w-4" />
              </div>}
        </div>
      </div>
      <CtaPill p={p} />
      <BrandFooter p={{ ...p, theme: headerTheme }} />
    </div>
  );
}

/**
 * CalloutDiagram — composition "poster". Emergency: full poster treatment
 * (radial alert tint, warning illustration at illustrationEmphasis scale,
 * oversized heading). Otherwise: hub-and-spoke — central illustration with
 * connector lines out to floating callout cards.
 */
export function CalloutDiagram(p: LayoutProps) {
  const onImage = !!p.imageUrl;
  const c = compMetrics(p, "poster");
  const emphasis: Emphasis = resolveEmphasis(p.category ?? "educational");
  const isEmergency = emphasis === "emergency";
  const Illustration = isEmergency ? illustrations["warning-triangle"] : illustrationComponentFor(p);
  const items = splitContentItemsForLayout(p.slideBody).slice(0, c.density === "low" ? 3 : 4);
  const positions = radialPositions(items.length || 1, 40);
  const headerTheme = onImage ? photoTheme(p) : p.theme;

  if (isEmergency) {
    return (
      // the base dark scrim from SlideCanvas already darkens the photo; the extra radial
      // tint is only needed on the plain theme background
      <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad, ...(onImage ? undefined : { background: `radial-gradient(circle at 50% 30%, ${p.theme.accent}22, transparent 70%)` }) }}>
        <BrandHeader p={{ ...p, theme: headerTheme }} />
        <div className="flex-1 grid place-items-center text-center">
          <div>
            <Illustration className="mx-auto" style={{ height: Math.round(140 * c.illustrationEmphasis), width: Math.round(140 * c.illustrationEmphasis), marginBottom: c.gap }}
              accent="#dc2626" line={onImage ? "#ffffff" : p.theme.heading} />
            <h3 style={{ ...typo("heroTitle", p.fontScale), fontWeight: 800, ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
            <p className="px-3" style={{ ...typo("body", p.fontScale), marginTop: c.gap, whiteSpace: "pre-line", ...(onImage ? photoText("body") : { color: p.theme.text }) }}>{p.slideBody}</p>
            <CtaPill p={p} />
          </div>
        </div>
        <BrandFooter p={{ ...p, theme: headerTheme }} />
      </div>
    );
  }

  // too few items for an orbit — render a centered focus stack instead of
  // 1-2 floating chips colliding with the title
  if (items.length < 3) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
        <BrandHeader p={{ ...p, theme: headerTheme }} />
        <h3 className="text-center" style={{ ...typo("sectionHeading", p.fontScale), marginTop: c.gap * 0.5, ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
        <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: c.cardGap }}>
          {!onImage && (
            <Illustration style={{ height: 110, width: 110 }} accent={p.theme.accent} line={p.theme.heading} />
          )}
          {(items.length ? items : [p.slideBody]).map((item, i) => (
            <div key={i} className="text-center max-w-[88%]"
              style={{ background: "rgba(255,255,255,0.94)", boxShadow: shadow.card, borderRadius: radius.sm, padding: `${c.gap * 0.6}px ${c.gap}px` }}>
              <p style={{ ...typo("body", p.fontScale), color: "#1f2937" }}>{item}</p>
            </div>
          ))}
        </div>
        <CtaPill p={p} />
        <BrandFooter p={{ ...p, theme: headerTheme }} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
      <BrandHeader p={{ ...p, theme: headerTheme }} />
      <h3 className="text-center" style={{ ...typo("sectionHeading", p.fontScale), marginTop: c.gap * 0.5, ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
      <div className="flex-1 relative" style={{ marginTop: c.gap * 0.5 }}>
        {!onImage && (
          <svg className="absolute inset-0 w-full h-full" aria-hidden>
            {items.map((_, i) => (
              <line key={i} x1="50%" y1="50%" x2={positions[i].left} y2={positions[i].top} stroke={`${p.theme.accent}66`} strokeWidth={1.5} />
            ))}
          </svg>
        )}
        {/* central illustration is dropped over a photo — the photo already occupies that space */}
        {!onImage && (
          <div className="absolute grid place-items-center" style={{ inset: `${Math.round(48 - c.illustrationEmphasis * 30)}%` }}>
            <Illustration className="w-full h-full" accent={p.theme.accent} line={p.theme.heading} />
          </div>
        )}
        {items.map((item, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 max-w-[38%] text-center"
            style={{ ...positions[i], background: "rgba(255,255,255,0.94)", boxShadow: shadow.card, borderRadius: radius.sm, padding: `${c.gap * 0.4}px ${c.gap * 0.7}px` }}>
            <p className="line-clamp-3" style={{ ...typo("caption", p.fontScale), fontWeight: 500, color: "#1f2937" }}>{item}</p>
          </div>
        ))}
      </div>
      <CtaPill p={p} />
      <BrandFooter p={{ ...p, theme: headerTheme }} />
    </div>
  );
}

/**
 * RadialDiagram — composition "hero-center": a dashed orbit ring with dot
 * markers around a central accent circle whose size follows
 * illustrationEmphasis (vs CalloutDiagram's line-connected floating cards).
 */
export function RadialDiagram(p: LayoutProps) {
  const onImage = !!p.imageUrl;
  const Illustration = illustrationComponentFor(p);
  const c = compMetrics(p, "hero-center");
  const items = splitContentItemsForLayout(p.slideBody).slice(0, c.density === "low" ? 4 : 6);
  const positions = radialPositions(items.length || 1, 40);
  const headerTheme = onImage ? photoTheme(p) : p.theme;
  const centerInset = Math.round(50 - c.illustrationEmphasis * 26);

  // too few items for an orbit — centered hub with stacked satellites below
  if (items.length < 3) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
        <BrandHeader p={{ ...p, theme: headerTheme }} />
        <h3 className="text-center" style={{ ...typo("sectionHeading", p.fontScale), marginTop: c.gap * 0.5, ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
        <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: c.cardGap }}>
          {!onImage && (
            <div className="grid place-items-center rounded-full" style={{ height: 120, width: 120, background: `${p.theme.accent}22` }}>
              <Illustration className="w-3/4 h-3/4" accent={p.theme.accent} line={p.theme.heading} />
            </div>
          )}
          {(items.length ? items : [p.slideBody]).map((item, i) => (
            <div key={i} className="flex items-center max-w-[88%]"
              style={{ gap: c.gap * 0.7, ...(onImage ? { background: PHOTO_CHIP_BG, padding: "6px 12px", borderRadius: radius.sm } : undefined) }}>
              <div className="rounded-full shrink-0" style={{ height: 8, width: 8, background: p.theme.accent, boxShadow: `0 0 0 3px ${p.theme.accent}33` }} />
              <p style={{ ...typo("body", p.fontScale), fontWeight: 500, color: onImage ? PHOTO_CHIP_TEXT : p.theme.text }}>{item}</p>
            </div>
          ))}
        </div>
        <CtaPill p={p} />
        <BrandFooter p={{ ...p, theme: headerTheme }} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: c.pad }}>
      <BrandHeader p={{ ...p, theme: headerTheme }} />
      <h3 className="text-center" style={{ ...typo("sectionHeading", p.fontScale), marginTop: c.gap * 0.5, ...(onImage ? photoText("heading") : { color: p.theme.heading }) }}>{p.slideTitle}</h3>
      <div className="flex-1 relative" style={{ marginTop: c.gap * 0.5 }}>
        {/* dashed orbit ring through the item positions (r=40% → inset 10%) */}
        {!onImage && <div className="absolute rounded-full" style={{ inset: "10%", border: `1.5px dashed ${p.theme.heading}44` }} />}
        {/* central illustration + tinted circle are dropped over a photo — same reasoning as CalloutDiagram */}
        {!onImage && (
          <div className="absolute grid place-items-center rounded-full" style={{ inset: `${centerInset}%`, background: `${p.theme.accent}22` }}>
            <Illustration className="w-3/4 h-3/4" accent={p.theme.accent} line={p.theme.heading} />
          </div>
        )}
        {items.map((item, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 max-w-[34%] text-center"
            style={{ ...positions[i], ...(onImage ? { background: PHOTO_CHIP_BG, padding: "4px 6px", borderRadius: radius.sm } : undefined) }}>
            <div className="mx-auto rounded-full" style={{ height: 8, width: 8, background: p.theme.accent, marginBottom: 4, boxShadow: `0 0 0 3px ${p.theme.accent}33` }} />
            <p className="line-clamp-3" style={{ ...typo("caption", p.fontScale), fontWeight: 600, color: onImage ? PHOTO_CHIP_TEXT : p.theme.text }}>{item}</p>
          </div>
        ))}
      </div>
      <CtaPill p={p} />
      <BrandFooter p={{ ...p, theme: headerTheme }} />
    </div>
  );
}
