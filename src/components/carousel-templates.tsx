import { ImageIcon, Check, Flag } from "lucide-react";
import {
  TemplateShell, TemplateBrandHeader, TemplateBrandFooter, TemplateCtaPill, Divider, fitHeadline,
} from "@/components/template-primitives";
import { primaryIconFor } from "@/lib/carousel-themes";
import type { BrandKit } from "@/lib/brand-kit";

/**
 * src/components/carousel-templates.tsx
 *
 * Template-specific renderers for Carousel-format catalog templates. Unlike
 * Content Studio's dynamic carousel engine (resolveVisualStrategy() picking
 * one of ten archetypes PER SLIDE from that slide's own content), a Carousel
 * template is a single cross-slide visual SYSTEM: one Component receives the
 * current slide's content plus its slideIndex/totalSlides and decides its own
 * treatment internally (cover vs. inside vs. closing), so every slide in the
 * deck stays visually unified regardless of what any individual slide says.
 * resolveVisualStrategy() is never called for a template-driven carousel.
 *
 * Same registry shape and lookup philosophy as post-templates.tsx: an unknown
 * render_key returns null (excluded, never guessed at), and this is the ONE
 * place a Carousel render_key becomes pixels -- Template Studio's catalog
 * preview, Content Studio's per-slide preview, and Content History all call
 * getCarouselTemplate() and render the same component it returns.
 */

export type CarouselTemplateId =
  | "magazine-spread"
  | "blueprint-deck"
  | "chart-deck"
  | "frame-stack"
  | "swiss-grid-deck"
  | "timeline-deck"
  | "split-screen-deck";

export type CarouselTemplateSlideProps = {
  slideTitle: string;
  slideBody: string;
  slideIndex: number;
  totalSlides: number;
  cta: string;
  specialty: string;
  brand: BrandKit;
  imageUrl?: string | null;
  imageLoading?: boolean;
  loadingOverlay?: React.ReactNode;
};

/* ── Magazine Spread ──────────────────────────────────────────────────────
 * A running head (clinic name + folio) ties every slide to the same printed
 * feature. Slide 1 is a serif "title page," inside slides drop to sans body
 * copy with a photo bleed that alternates side per slide, and only the
 * closing slide carries a CTA, boxed like a feature's "next steps" callout --
 * narrative POSITION drives the composition, never per-slide content shape. */

const SERIF = "'IBM Plex Serif', Georgia, serif";

function RunningHead({ brand, slideIndex, totalSlides }: { brand: BrandKit; slideIndex: number; totalSlides: number }) {
  return (
    <div>
      <div className="flex items-center justify-between" style={{ fontSize: 10, letterSpacing: "0.08em", color: "#8a8a85" }}>
        <span className="uppercase font-semibold truncate" style={{ maxWidth: "62%" }}>{brand.clinicName || " "}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}>{slideIndex + 1} / {totalSlides}</span>
      </div>
      <div style={{ height: 1, background: "rgba(20,20,20,0.14)", marginTop: 6 }} />
    </div>
  );
}

function PhotoBleed({ side, imageUrl, imageLoading, loadingOverlay }: {
  side: "left" | "right"; imageUrl?: string | null; imageLoading?: boolean; loadingOverlay?: React.ReactNode;
}) {
  const pos: React.CSSProperties = side === "left" ? { left: 0 } : { right: 0 };
  return (
    <div className="absolute top-0 bottom-0 overflow-hidden" style={{ ...pos, width: "42%", background: "#e7e2d8" }}>
      {imageUrl
        ? <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : <div className="absolute inset-0" style={{ background: "linear-gradient(150deg, #eef2f6 0%, #d7dfe7 100%)" }} />}
      {imageLoading && loadingOverlay}
    </div>
  );
}

function MagazineSpread(p: CarouselTemplateSlideProps) {
  const isCover = p.slideIndex === 0;
  const isClosing = p.totalSlides > 1 && p.slideIndex === p.totalSlides - 1;
  const primary = p.brand.primaryColor || "#2E6E62";

  if (isClosing) {
    return (
      <TemplateShell style={{ background: "#fbfbf9" }}>
        <div className="absolute inset-0 flex flex-col" style={{ padding: 24 }}>
          <RunningHead brand={p.brand} slideIndex={p.slideIndex} totalSlides={p.totalSlides} />
          <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ gap: 12 }}>
            <p style={{ fontFamily: SERIF, fontSize: fitHeadline(24, p.slideTitle, 40), fontWeight: 600, lineHeight: 1.25, color: "#1a1a1a", wordBreak: "break-word" }}>
              {p.slideTitle}
            </p>
            <p className="line-clamp-3" style={{ fontSize: 13, lineHeight: 1.55, color: "#4b4b46", maxWidth: "82%" }}>{p.slideBody}</p>
            <Divider color="#c9a96e" width={40} />
            <div className="rounded-lg border" style={{ borderColor: "#e5e1d8", padding: "14px 22px", marginTop: 2 }}>
              <p className="uppercase font-semibold" style={{ fontSize: 9.5, letterSpacing: "0.14em", color: "#8a8a85", marginBottom: 8, textAlign: "center" }}>
                Next Steps
              </p>
              <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
            </div>
          </div>
        </div>
      </TemplateShell>
    );
  }

  const photoSide: "left" | "right" = p.slideIndex % 2 === 0 ? "right" : "left";
  const textPos: React.CSSProperties = photoSide === "right" ? { left: 0 } : { right: 0 };

  return (
    <TemplateShell style={{ background: "#fbfbf9" }}>
      <PhotoBleed side={photoSide} imageUrl={p.imageUrl} imageLoading={p.imageLoading} loadingOverlay={p.loadingOverlay} />
      <div className="absolute top-0 bottom-0 flex flex-col justify-center" style={{ ...textPos, width: "58%", padding: "24px 22px" }}>
        <RunningHead brand={p.brand} slideIndex={p.slideIndex} totalSlides={p.totalSlides} />
        <div className="flex-1 flex flex-col justify-center" style={{ gap: 10 }}>
          {isCover ? (
            <>
              <p className="uppercase font-semibold" style={{ fontSize: 10, letterSpacing: "0.16em", color: primary }}>{p.specialty}</p>
              <p style={{ fontFamily: SERIF, fontSize: fitHeadline(25, p.slideTitle, 36), fontWeight: 600, lineHeight: 1.2, color: "#1a1a1a", wordBreak: "break-word" }}>
                {p.slideTitle}
              </p>
            </>
          ) : (
            <>
              <p className="font-bold line-clamp-2" style={{ fontSize: fitHeadline(17, p.slideTitle, 40), lineHeight: 1.28, color: "#1a1a1a", wordBreak: "break-word" }}>
                {p.slideTitle}
              </p>
              <p className="line-clamp-4" style={{ fontSize: 12.5, lineHeight: 1.55, color: "#4b4b46" }}>{p.slideBody}</p>
            </>
          )}
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── Blueprint Deck ───────────────────────────────────────────────────────
 * Every slide is a "sheet" of the same technical drawing set: dot-grid
 * ground, corner registration brackets, a coordinate/folio strip up top,
 * and an engineering-style title block along the bottom -- present on
 * literally every slide, so the deck reads as one blueprint set, not six
 * separately-drafted cards. Only the viewport contents (photo + notes)
 * change slide to slide; the drafting frame around them never does. Shares
 * the blueprint LANGUAGE with Post's blueprint-grid deliberately (same
 * cross-format family as Type Poster / Swiss Grid Bold), not its layout --
 * the coordinate strip, title block and sheet numbering are Carousel-only. */

const MONO = "'IBM Plex Mono', ui-monospace, monospace";

function BlueprintCorners({ color }: { color: string }) {
  const items: React.CSSProperties[] = [
    { top: 10, left: 10, borderTop: "2px solid", borderLeft: "2px solid" },
    { top: 10, right: 10, borderTop: "2px solid", borderRight: "2px solid" },
    { bottom: 10, left: 10, borderBottom: "2px solid", borderLeft: "2px solid" },
    { bottom: 10, right: 10, borderBottom: "2px solid", borderRight: "2px solid" },
  ];
  return (
    <>
      {items.map((style, i) => (
        <span key={i} className="absolute" style={{ height: 14, width: 14, borderColor: color, ...style }} />
      ))}
    </>
  );
}

function BlueprintDeck(p: CarouselTemplateSlideProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const isCover = p.slideIndex === 0;
  const isClosing = p.totalSlides > 1 && p.slideIndex === p.totalSlides - 1;
  const Icon = primaryIconFor(p.specialty || "Default");

  return (
    <TemplateShell style={{ background: "#f3f7fa", backgroundImage: `radial-gradient(${primary}30 1px, transparent 1px)`, backgroundSize: "13px 13px" }}>
      <BlueprintCorners color="#1a2733" />
      <div className="absolute inset-0 flex flex-col" style={{ padding: "24px 24px 0" }}>
        <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: "#4a5b68" }}>
          <span className="truncate uppercase" style={{ maxWidth: "58%" }}>{p.brand.clinicName || p.specialty || "Field Notes"}</span>
          <span>SHEET {String(p.slideIndex + 1).padStart(2, "0")}/{String(p.totalSlides).padStart(2, "0")}</span>
        </div>
        <div style={{ height: 1, background: "#1a273322", marginTop: 6 }} />

        <div className="flex-1 min-h-0" style={{ paddingTop: 14 }}>
          {isClosing ? (
            <div className="h-full flex flex-col items-center justify-center text-center" style={{ gap: 10 }}>
              <span className="uppercase font-bold" style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", color: primary, border: `1px solid ${primary}`, padding: "3px 9px" }}>
                Approved — Next Steps
              </span>
              <p className="font-bold line-clamp-2" style={{ fontSize: fitHeadline(19, p.slideTitle, 40), lineHeight: 1.25, color: "#151f28", wordBreak: "break-word" }}>{p.slideTitle}</p>
              <p className="line-clamp-3" style={{ fontSize: 12, lineHeight: 1.5, color: "#3a4a56", maxWidth: "84%" }}>{p.slideBody}</p>
            </div>
          ) : isCover ? (
            <div className="h-full flex flex-col items-center justify-center text-center" style={{ gap: 10 }}>
              <p className="uppercase font-bold" style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.16em", color: primary }}>{p.specialty || "Clinical"} — Spec Sheet</p>
              <p className="font-bold" style={{ fontSize: fitHeadline(23, p.slideTitle, 38), lineHeight: 1.22, color: "#151f28", wordBreak: "break-word" }}>{p.slideTitle}</p>
              <div className="relative grid place-items-center" style={{ marginTop: 4, height: 96, width: 132, border: `1.5px solid ${primary}`, background: "rgba(255,255,255,0.66)" }}>
                <Icon className="h-8 w-8" style={{ color: primary }} />
                <span className="absolute" style={{ left: -1, top: -7, width: 1.5, height: 7, background: primary }} />
                <span className="absolute" style={{ right: -1, top: -7, width: 1.5, height: 7, background: primary }} />
                <span className="absolute" style={{ left: -1, bottom: -7, width: 1.5, height: 7, background: primary }} />
                <span className="absolute" style={{ right: -1, bottom: -7, width: 1.5, height: 7, background: primary }} />
              </div>
            </div>
          ) : (
            <div className="h-full flex" style={{ gap: 14 }}>
              <div className="relative overflow-hidden shrink-0" style={{ width: "42%", border: `1.5px solid ${primary}`, background: "#e7edf1" }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 4 }}>
                    <ImageIcon className="h-5 w-5" style={{ color: "#8a99a5" }} />
                    <span style={{ fontFamily: MONO, fontSize: 7, color: "#8a99a5" }}>NO VISUAL DATA</span>
                  </div>
                )}
                {p.imageLoading && p.loadingOverlay}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="uppercase font-bold" style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", color: primary }}>Detail {String(p.slideIndex).padStart(2, "0")}</p>
                <p className="font-bold line-clamp-2" style={{ fontSize: fitHeadline(15.5, p.slideTitle, 36), lineHeight: 1.24, color: "#151f28", marginTop: 3, wordBreak: "break-word" }}>{p.slideTitle}</p>
                <p className="line-clamp-4" style={{ fontSize: 11, lineHeight: 1.5, color: "#3a4a56", marginTop: 5 }}>{p.slideBody}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between" style={{ borderTop: "1.5px solid #1a2733", padding: "8px 0 14px", gap: 10, marginTop: 10 }}>
          <div className="flex items-center gap-2 min-w-0">
            {p.brand.logo && <img src={p.brand.logo} alt="" className="object-contain shrink-0" style={{ height: 16, width: 16 }} />}
            <p className="truncate font-bold" style={{ fontFamily: MONO, fontSize: 8.5, color: "#1a2733" }}>
              {p.brand.clinicName || p.specialty || "Clinic"}{isClosing && p.brand.doctorName ? ` · ${p.brand.doctorName}` : ""}
            </p>
          </div>
          {isClosing && p.cta && (
            <span className="font-bold shrink-0" style={{ fontFamily: MONO, fontSize: 11, color: primary, border: `1.5px solid ${primary}`, padding: "5px 10px" }}>
              [ {p.cta} ]
            </span>
          )}
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── Chart Deck ───────────────────────────────────────────────────────────
 * A real bar chart on EVERY slide (cover included), not a decorative
 * afterthought -- an ECG rule ties the deck to a "vitals report" identity,
 * and the chart's bar LABELS come from real slide content while bar
 * heights follow a fixed decorative rhythm that never prints a number or a
 * "%", so nothing here can be mistaken for an invented clinical statistic. */

const CHART_HEIGHTS = [58, 88, 68, 96];

function EcgRule({ color, width = "100%" }: { color: string; width?: number | string }) {
  return (
    <svg viewBox="0 0 300 20" preserveAspectRatio="none" style={{ width, height: 16, display: "block" }}>
      <polyline points="0,10 100,10 112,3 124,17 136,3 148,10 300,10" fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** highlightIndex selects which bar is "active" (solid) vs. background
 *  (muted) -- when set, this doubles as a 4-stage progress readout so an
 *  interior slide's chart visibly advances through the deck instead of
 *  needing per-slide numeric data it doesn't have. */
function MiniBarChart({ items, primary, highlightIndex }: { items: string[]; primary: string; highlightIndex?: number }) {
  return (
    <div className="flex items-end" style={{ gap: 10, height: 84 }}>
      {items.map((label, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" style={{ gap: 6 }}>
          <div className="w-full rounded-t-sm" style={{ height: `${CHART_HEIGHTS[i % CHART_HEIGHTS.length]}%`, background: i === (highlightIndex ?? 0) ? primary : `${primary}55` }} />
          <p className="text-center line-clamp-2 uppercase" style={{ fontSize: 7.5, letterSpacing: "0.03em", fontWeight: 600, color: "#3a3a36", lineHeight: 1.2 }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

// A fixed 4-stage care framework reused as chart labels on EVERY slide --
// deliberately NOT derived from each slide's own body text: a single
// AI-written sentence rarely splits into 3-4 natural items, which was
// collapsing the chart to one full-width bar (found during verification,
// see below). Reusing the same 4 labels everywhere and just advancing
// which one is highlighted turns the chart into a real, guaranteed-
// multi-bar graphic AND a deck-wide progress readout in one device.
const CHART_STAGES = ["Diagnosis", "Treatment", "Recovery", "Support"];

function ChartDeck(p: CarouselTemplateSlideProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const isCover = p.slideIndex === 0;
  const isClosing = p.totalSlides > 1 && p.slideIndex === p.totalSlides - 1;
  const interiorHighlight = (Math.max(p.slideIndex - 1, 0)) % CHART_STAGES.length;

  return (
    <TemplateShell style={{ background: "#fbfbf9" }}>
      <div className="absolute inset-0 flex flex-col" style={{ padding: "20px 22px" }}>
        <EcgRule color={primary} />
        <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
          <TemplateBrandHeader brand={p.brand} />
          <span style={{ fontFamily: MONO, fontSize: 9, color: "#8a8a85" }}>{p.slideIndex + 1}/{p.totalSlides}</span>
        </div>

        {isClosing ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ gap: 10 }}>
            <div style={{ width: 60 }}><EcgRule color={primary} /></div>
            <p className="font-bold line-clamp-2" style={{ fontSize: fitHeadline(20, p.slideTitle, 40), lineHeight: 1.24, color: "#1a1a1a", wordBreak: "break-word" }}>{p.slideTitle}</p>
            <p className="line-clamp-3" style={{ fontSize: 12.5, lineHeight: 1.5, color: "#4b4b46", maxWidth: "84%" }}>{p.slideBody}</p>
            <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
          </div>
        ) : isCover ? (
          <div className="flex-1 flex flex-col justify-center" style={{ gap: 14 }}>
            <div>
              <p className="uppercase font-semibold" style={{ fontSize: 10, letterSpacing: "0.16em", color: primary }}>{p.specialty}</p>
              <p className="font-bold" style={{ fontSize: fitHeadline(24, p.slideTitle, 40), lineHeight: 1.2, color: "#1a1a1a", marginTop: 4, wordBreak: "break-word" }}>{p.slideTitle}</p>
            </div>
            <MiniBarChart items={CHART_STAGES} primary={primary} highlightIndex={-1} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center" style={{ gap: 12 }}>
            <div className="flex items-start justify-between" style={{ gap: 10 }}>
              <div className="min-w-0">
                <p className="font-bold line-clamp-2" style={{ fontSize: fitHeadline(16.5, p.slideTitle, 38), lineHeight: 1.26, color: "#1a1a1a", wordBreak: "break-word" }}>{p.slideTitle}</p>
                <p className="line-clamp-3" style={{ fontSize: 11.5, lineHeight: 1.5, color: "#4b4b46", marginTop: 4 }}>{p.slideBody}</p>
              </div>
              {p.imageUrl && (
                <div className="relative overflow-hidden rounded-md shrink-0" style={{ height: 46, width: 46, border: `2px solid ${primary}` }}>
                  <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  {p.imageLoading && p.loadingOverlay}
                </div>
              )}
            </div>
            <div>
              <p className="uppercase font-semibold" style={{ fontSize: 8.5, letterSpacing: "0.1em", color: "#8a8a85", marginBottom: 4 }}>Where This Step Fits</p>
              <MiniBarChart items={CHART_STAGES} primary={primary} highlightIndex={interiorHighlight} />
            </div>
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <TemplateBrandFooter brand={p.brand} specialty={isClosing ? p.specialty : undefined} bg="#f1efe9" fg="#2a2a2a" />
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── Frame Stack ──────────────────────────────────────────────────────────
 * A museum wall, not a photo stack: a thick outer frame + inner mat is
 * present on every slide (photo CONTAINED, never bled -- the opposite of
 * Magazine Spread), with a placard below reading like a gallery object
 * label. Distinct from Layered Frame Poster's diagonal offset stack and
 * from Polaroid Stack's informal tilt -- this one never rotates or offsets. */

function FrameStack(p: CarouselTemplateSlideProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const isCover = p.slideIndex === 0;
  const isClosing = p.totalSlides > 1 && p.slideIndex === p.totalSlides - 1;
  const caption = p.slideBody.length > 90 ? p.slideBody.slice(0, 89).trimEnd() + "…" : p.slideBody;
  const interiorTotal = Math.max(p.totalSlides - 2, 1);

  return (
    <TemplateShell style={{ background: "#efece4" }}>
      <div className="absolute" style={{ inset: 16, background: "#1f2421" }} />
      <div className="absolute" style={{ inset: 30, background: "#fbfaf6", border: `1px solid ${primary}44` }} />
      <div className="absolute flex flex-col" style={{ inset: 44 }}>
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
          {isCover ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ gap: 8, padding: 10 }}>
              <p className="uppercase" style={{ fontSize: 9, letterSpacing: "0.2em", color: "#8a8478" }}>{p.specialty || "Patient Education"} Series</p>
              <p style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontStyle: "italic", fontSize: fitHeadline(23, p.slideTitle, 38), lineHeight: 1.28, color: "#221f18", wordBreak: "break-word" }}>{p.slideTitle}</p>
            </div>
          ) : isClosing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ gap: 10, padding: 10 }}>
              <p style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontStyle: "italic", fontSize: fitHeadline(19, p.slideTitle, 40), lineHeight: 1.3, color: "#221f18", wordBreak: "break-word" }}>{p.slideTitle}</p>
              <p className="line-clamp-3" style={{ fontSize: 11.5, lineHeight: 1.5, color: "#4a4436", maxWidth: "86%" }}>{p.slideBody}</p>
            </div>
          ) : p.imageUrl ? (
            <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "linear-gradient(160deg, #e5e1d6 0%, #d3cdbc 100%)", gap: 4 }}>
              <ImageIcon className="h-5 w-5" style={{ color: "#a89f88" }} />
              <span style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontStyle: "italic", fontSize: 10, color: "#a89f88" }}>Awaiting artwork</span>
            </div>
          )}
          {p.imageLoading && p.loadingOverlay}
        </div>

        <div className="shrink-0" style={{ marginTop: 10, borderTop: "1px solid #d8d2c2", paddingTop: 8 }}>
          {!isCover && (
            <p className="uppercase font-bold" style={{ fontSize: 8, letterSpacing: "0.12em", color: primary, marginBottom: 2 }}>
              {isClosing ? "Closing" : `Exhibit ${String(p.slideIndex).padStart(2, "0")} of ${String(interiorTotal).padStart(2, "0")}`}
            </p>
          )}
          {!isCover && !isClosing && (
            <p className="font-semibold line-clamp-1" style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontSize: 13, color: "#221f18" }}>{p.slideTitle}</p>
          )}
          {!isCover && !isClosing && (
            <p className="line-clamp-1" style={{ fontSize: 9.5, color: "#6b6355", marginTop: 1 }}>{caption}</p>
          )}
          <div className="flex items-center justify-between" style={{ marginTop: isCover ? 0 : 6 }}>
            <div className="flex items-center gap-1.5 min-w-0">
              {p.brand.logo && <img src={p.brand.logo} alt="" className="rounded-full object-cover shrink-0" style={{ height: 14, width: 14 }} />}
              <span className="truncate" style={{ fontSize: 8.5, color: "#8a8478" }}>
                Presented by {p.brand.clinicName || p.specialty || "Your Clinic"}{isClosing && p.brand.doctorName ? ` · ${p.brand.doctorName}` : ""}
              </span>
            </div>
            {isClosing && p.cta && (
              <span className="font-bold uppercase shrink-0" style={{ fontSize: 9.5, color: primary, border: `1.5px solid ${primary}`, padding: "5px 9px", letterSpacing: "0.04em" }}>
                {p.cta}
              </span>
            )}
          </div>
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── Swiss Grid Deck ──────────────────────────────────────────────────────
 * The same International Typographic Style signature as Post's Swiss Grid
 * Bold (deliberate cross-format family), extended with an incrementing
 * section marker (§01, §02…) so the deck itself reads as one numbered
 * publication. Never a rounded pill anywhere -- the CTA is a solid block. */

function SwissGridDeck(p: CarouselTemplateSlideProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const isCover = p.slideIndex === 0;
  const isClosing = p.totalSlides > 1 && p.slideIndex === p.totalSlides - 1;

  return (
    <TemplateShell style={{ background: "#fafafa" }}>
      <div className="absolute inset-0 flex flex-col" style={{ padding: "24px 24px 20px" }}>
        <div className="flex items-center justify-between">
          <p className="uppercase font-bold" style={{ fontSize: 9, letterSpacing: "0.16em", color: "#1a1a1a" }}>
            {p.specialty || "Clinical Notes"} · {p.slideIndex + 1}/{p.totalSlides}
          </p>
          {p.brand.logo && <img src={p.brand.logo} alt="" className="object-contain shrink-0" style={{ height: 18, width: 18 }} />}
        </div>
        <div style={{ marginTop: 8, height: 3, background: "#1a1a1a" }} />

        {isClosing ? (
          <div className="flex-1 flex flex-col justify-end" style={{ gap: 14, marginTop: 14 }}>
            <p className="font-black line-clamp-3" style={{ fontSize: fitHeadline(30, p.slideTitle, 40), lineHeight: 1.05, letterSpacing: "-0.02em", color: "#1a1a1a", wordBreak: "break-word" }}>{p.slideTitle}</p>
            <div className="flex items-end" style={{ gap: 16 }}>
              {p.cta && (
                <span className="font-bold uppercase shrink-0" style={{ background: "#1a1a1a", color: "#fff", padding: "13px 16px", fontSize: 12, letterSpacing: "0.04em" }}>{p.cta}</span>
              )}
              <div className="flex-1" style={{ borderLeft: `2px solid ${primary}`, paddingLeft: 12 }}>
                <p className="line-clamp-3 text-right" style={{ fontSize: 11, lineHeight: 1.5, color: "#3a3a36" }}>{p.slideBody}</p>
              </div>
            </div>
            <TemplateBrandFooter brand={p.brand} specialty={undefined} bg="transparent" fg="#1a1a1a" />
          </div>
        ) : isCover ? (
          <div className="flex-1 flex flex-col justify-between" style={{ marginTop: 14 }}>
            <p className="font-black line-clamp-4" style={{ fontSize: fitHeadline(40, p.slideTitle, 42), lineHeight: 1.02, letterSpacing: "-0.02em", color: "#1a1a1a", wordBreak: "break-word" }}>{p.slideTitle}</p>
            <div className="flex items-end" style={{ gap: 16 }}>
              <span className="font-black" style={{ fontSize: 64, lineHeight: 0.8, color: "transparent", WebkitTextStroke: `1.5px ${primary}` }}>01</span>
              <p className="flex-1 line-clamp-2" style={{ fontSize: 11.5, lineHeight: 1.5, color: "#3a3a36" }}>{p.slideBody}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center" style={{ marginTop: 12, gap: 12 }}>
            <div className="flex items-start" style={{ gap: 12 }}>
              <span className="font-black shrink-0" style={{ fontFamily: MONO, fontSize: 13, color: primary }}>§{String(p.slideIndex).padStart(2, "0")}</span>
              <p className="font-bold line-clamp-3 flex-1" style={{ fontSize: fitHeadline(20, p.slideTitle, 40), lineHeight: 1.12, letterSpacing: "-0.01em", color: "#1a1a1a", wordBreak: "break-word" }}>{p.slideTitle}</p>
            </div>
            <div className="flex items-start" style={{ gap: 12 }}>
              <div className="flex-1" style={{ borderLeft: `2px solid ${primary}`, paddingLeft: 12 }}>
                <p className="line-clamp-4" style={{ fontSize: 12, lineHeight: 1.55, color: "#3a3a36" }}>{p.slideBody}</p>
              </div>
              {p.imageUrl && (
                <div className="relative overflow-hidden shrink-0" style={{ height: 64, width: 64, border: "1.5px solid #1a1a1a" }}>
                  <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  {p.imageLoading && p.loadingOverlay}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TemplateShell>
  );
}

/* ── Timeline Deck ────────────────────────────────────────────────────────
 * Content Studio's Timeline crams a whole multi-stop journey into ONE
 * slide (horizontal stops, alternating labels). This spreads ONE step per
 * SLIDE instead, with a persistent step-rail at the top of every slide
 * (dots + line, current node enlarged, done nodes filled) so the viewer
 * always sees "step 3 of 4" even without swiping through the whole deck. */

function StepRail({ total, current, isClosing, primary }: { total: number; current: number; isClosing: boolean; primary: string }) {
  const nodeCount = Math.max(total, 1);
  const fillPct = isClosing ? 100 : nodeCount <= 1 ? 0 : (Math.max(current - 1, 0) / (nodeCount - 1)) * 100;
  return (
    <div className="relative flex items-center" style={{ height: 20 }}>
      <div className="absolute left-0 right-0" style={{ top: "50%", height: 2, background: "#e0ded4", transform: "translateY(-50%)" }} />
      <div className="absolute left-0" style={{ top: "50%", height: 2, background: primary, transform: "translateY(-50%)", width: `${fillPct}%` }} />
      <div className="relative flex justify-between w-full">
        {Array.from({ length: nodeCount }).map((_, i) => {
          const step = i + 1;
          const done = isClosing || step < current;
          const active = !isClosing && step === current;
          return (
            <span key={i} className="rounded-full shrink-0" style={{
              height: active ? 12 : 8, width: active ? 12 : 8,
              background: done || active ? primary : "#ffffff",
              border: done || active ? "none" : "2px solid #e0ded4",
            }} />
          );
        })}
      </div>
    </div>
  );
}

function TimelineDeck(p: CarouselTemplateSlideProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const isCover = p.slideIndex === 0;
  const isClosing = p.totalSlides > 1 && p.slideIndex === p.totalSlides - 1;
  const interiorTotal = Math.max(p.totalSlides - 2, 0);
  const current = isCover || isClosing ? 0 : p.slideIndex;

  return (
    <TemplateShell style={{ background: "#fbfbf9" }}>
      <div className="absolute inset-0 flex flex-col" style={{ padding: 24 }}>
        <TemplateBrandHeader brand={p.brand} />
        <div style={{ marginTop: 12 }}>
          <StepRail total={interiorTotal} current={current} isClosing={isClosing} primary={primary} />
          <p className="text-center uppercase" style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.12em", color: "#9a9a92", marginTop: 6 }}>
            {isClosing ? "Journey Complete" : isCover ? "Your Care Journey" : `Step ${current} of ${interiorTotal}`}
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ gap: 10 }}>
          <div className="rounded-full grid place-items-center shrink-0" style={{ height: 52, width: 52, background: isClosing ? primary : isCover ? "transparent" : `${primary}18`, border: isCover ? `2px solid ${primary}` : "none" }}>
            {isClosing ? <Check className="h-6 w-6" style={{ color: "#fff" }} /> : isCover ? <Flag className="h-5 w-5" style={{ color: primary }} /> : (
              <span className="font-bold" style={{ fontSize: 20, color: primary }}>{current}</span>
            )}
          </div>
          <p className="font-bold line-clamp-2" style={{ fontSize: fitHeadline(19, p.slideTitle, 40), lineHeight: 1.25, color: "#1a1a1a", wordBreak: "break-word" }}>{p.slideTitle}</p>
          <p className="line-clamp-3" style={{ fontSize: 12.5, lineHeight: 1.5, color: "#4b4b46", maxWidth: "84%" }}>{p.slideBody}</p>

          {!isCover && !isClosing && (
            <div className="relative overflow-hidden rounded-lg w-full" style={{ height: 108, marginTop: 4 }}>
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center" style={{ background: "linear-gradient(150deg, #eef2f6 0%, #d7dfe7 100%)" }}>
                  <ImageIcon className="h-5 w-5" style={{ color: "#9aa7b3" }} />
                </div>
              )}
              {p.imageLoading && p.loadingOverlay}
            </div>
          )}

          {isClosing && <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />}
        </div>
        <TemplateBrandFooter brand={p.brand} specialty={undefined} bg="#f1efe9" fg="#2a2a2a" />
      </div>
    </TemplateShell>
  );
}

/* ── Split Screen Deck ────────────────────────────────────────────────────
 * A structural two-zone shell on every slide (dark "Concern" zone / brand-
 * colored "Approach" zone, diagonal seam) -- NOT ComparisonSplit's straight
 * seam + VS badge. slideTitle always lives in the top zone, slideBody
 * always in the bottom -- content-agnostic (no myth/fact text-splitting),
 * so it works for any specialty without inventing a comparison structure
 * the content doesn't actually have. */

function SplitScreenDeck(p: CarouselTemplateSlideProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const isCover = p.slideIndex === 0;
  const isClosing = p.totalSlides > 1 && p.slideIndex === p.totalSlides - 1;
  const topLabel = isCover ? "The Topic" : isClosing ? "The Next Step" : "The Concern";
  const bottomLabel = isCover ? "" : isClosing ? "" : "The Approach";
  const topText = isCover ? p.specialty : p.slideTitle;
  const bottomText = isCover ? p.slideTitle : p.slideBody;

  return (
    <TemplateShell style={{ background: "#1c2b27" }}>
      <div className="absolute inset-0" style={{ clipPath: "polygon(0 58%, 100% 46%, 100% 100%, 0 100%)", background: primary }} />

      <div className="absolute inset-0 flex flex-col" style={{ padding: 24 }}>
        <div className="flex items-center justify-between">
          <TemplateBrandHeader brand={p.brand} dark />
          <span style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.7)" }}>{p.slideIndex + 1}/{p.totalSlides}</span>
        </div>
        <div style={{ height: "24%" }} className="flex flex-col justify-end">
          <span className="uppercase font-bold" style={{ fontSize: 8.5, letterSpacing: "0.14em", color: "rgba(255,255,255,0.65)" }}>{topLabel}</span>
          <p className="font-bold line-clamp-2" style={{ fontSize: fitHeadline(16.5, topText, 36), lineHeight: 1.24, color: "#ffffff", marginTop: 3, wordBreak: "break-word" }}>{topText}</p>
        </div>

        <div className="flex-1 flex items-center" style={{ paddingTop: 22, gap: 14 }}>
          <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 6 }}>
            {bottomLabel && <span className="uppercase font-bold" style={{ fontSize: 8.5, letterSpacing: "0.14em", color: "rgba(255,255,255,0.85)" }}>{bottomLabel}</span>}
            <p className={isCover ? "font-bold" : "line-clamp-4"} style={{ fontSize: isCover ? fitHeadline(22, bottomText, 40) : 12.5, lineHeight: isCover ? 1.22 : 1.5, fontWeight: isCover ? 700 : 500, color: "#ffffff", wordBreak: "break-word" }}>
              {bottomText}
            </p>
            {isClosing && <div style={{ marginTop: 4 }}><TemplateCtaPill cta={p.cta} bg="#ffffff" fg={primary} /></div>}
          </div>
          {!isCover && !isClosing && p.imageUrl && (
            <div className="relative overflow-hidden rounded-lg shrink-0" style={{ height: 74, width: 64 }}>
              <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              {p.imageLoading && p.loadingOverlay}
            </div>
          )}
        </div>

        <TemplateBrandFooter brand={p.brand} specialty={undefined} bg="rgba(0,0,0,0.28)" fg="#ffffff" />
      </div>
    </TemplateShell>
  );
}

export const carouselTemplates: {
  id: CarouselTemplateId; name: string;
  /** Whether the CURRENT slide has a slot for the AI-generated photo -- varies
   *  by slide for a cross-slide system, unlike Post's static per-template flag. */
  usesImageForSlide: (slideIndex: number, totalSlides: number) => boolean;
  Component: (p: CarouselTemplateSlideProps) => React.ReactElement;
}[] = [
  {
    id: "magazine-spread", name: "Magazine Spread",
    usesImageForSlide: (i, total) => !(total > 1 && i === total - 1),
    Component: MagazineSpread,
  },
  {
    id: "blueprint-deck", name: "Blueprint Deck",
    usesImageForSlide: (i, total) => i > 0 && i < total - 1,
    Component: BlueprintDeck,
  },
  {
    id: "chart-deck", name: "Chart Deck",
    usesImageForSlide: (i, total) => i > 0 && i < total - 1,
    Component: ChartDeck,
  },
  {
    id: "frame-stack", name: "Frame Stack",
    usesImageForSlide: (i, total) => i > 0 && i < total - 1,
    Component: FrameStack,
  },
  {
    id: "swiss-grid-deck", name: "Swiss Grid Deck",
    usesImageForSlide: (i, total) => i > 0 && i < total - 1,
    Component: SwissGridDeck,
  },
  {
    id: "timeline-deck", name: "Timeline Deck",
    usesImageForSlide: (i, total) => i > 0 && i < total - 1,
    Component: TimelineDeck,
  },
  {
    id: "split-screen-deck", name: "Split Screen Deck",
    usesImageForSlide: (i, total) => i > 0 && i < total - 1,
    Component: SplitScreenDeck,
  },
];

/** Real lookup only -- an unknown key returns null, same philosophy as
 *  post-templates.tsx's getPostTemplate(). */
export function getCarouselTemplate(id: string | null | undefined) {
  return carouselTemplates.find((t) => t.id === id) ?? null;
}
