import { TemplateShell, TemplateCtaPill, Divider, fitHeadline } from "@/components/template-primitives";
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

export type CarouselTemplateId = "magazine-spread";

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
];

/** Real lookup only -- an unknown key returns null, same philosophy as
 *  post-templates.tsx's getPostTemplate(). */
export function getCarouselTemplate(id: string | null | undefined) {
  return carouselTemplates.find((t) => t.id === id) ?? null;
}
