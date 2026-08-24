import { forwardRef } from "react";
import { BrandContactBar } from "@/components/brand-frame";
import { Watermark } from "@/components/Watermark";
import type { BrandKit } from "@/lib/brand-kit";

/**
 * src/components/story-templates.tsx
 *
 * Template-specific renderers for Story-format catalog templates. Content
 * Studio has no dynamic per-content archetype system for Story today -- only
 * one fixed layout, StoryCard (src/components/StoryCard.tsx: full-bleed
 * photo, gradient scrim, centered text, pill CTA). A Story template's
 * Component takes the exact same forwardRef<HTMLDivElement> contract as
 * StoryCard so Content Studio/History can swap between the two with no
 * capture-ref plumbing changes.
 *
 * Same lookup philosophy as post-templates.tsx / carousel-templates.tsx: an
 * unknown render_key returns null. This is the ONE place a Story render_key
 * becomes pixels -- Template Studio's catalog preview, Content Studio's
 * preview, and Content History all call getStoryTemplate() and render the
 * same component it returns.
 */

export type StoryTemplateId = "split-duotone";

export type StoryTemplateProps = {
  headline: string;
  message: string;
  cta: string;
  specialty: string;
  brand: BrandKit;
  imageUrl?: string | null;
  imageLoading?: boolean;
  loadingOverlay?: React.ReactNode;
  width?: number;
};

const FONT = "'Poppins', 'Inter', 'Segoe UI', system-ui, sans-serif";

/* ── Split Duotone ────────────────────────────────────────────────────────
 * A hard 50/50 horizontal split -- a duotone-recolored photo on top, a flat
 * brand-color panel below -- replacing StoryCard's edge-to-edge gradient
 * wash entirely. The logo straddles the seam, anchoring both halves as one
 * composition instead of floating in a corner. */
const SplitDuotone = forwardRef<HTMLDivElement, StoryTemplateProps>(function SplitDuotone(
  { headline, message, cta, brand, imageUrl, imageLoading, loadingOverlay, width = 270 },
  ref,
) {
  const primary = brand.primaryColor || "#2E6E62";
  const secondary = brand.secondaryColor || "#1f4e79";
  const photo = imageUrl || brand.coverPhoto || brand.clinicPhoto || brand.doctorPhoto;

  return (
    <div className="mx-auto rounded-xl overflow-hidden shadow-lg border border-border" style={{ width }}>
      <div ref={ref} className="relative w-full" style={{ aspectRatio: "9 / 16", background: secondary, fontFamily: FONT }}>
        <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: "52%" }}>
          {photo ? (
            <>
              <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
              {/* duotone recolor: a flat primary-color layer composited with
                  mix-blend-mode:color keeps the photo's luminance but replaces
                  its hue/saturation entirely -- a real recolor, not an overlay. */}
              <div className="absolute inset-0" style={{ background: primary, mixBlendMode: "color", opacity: 0.85 }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${secondary} 0%, transparent 42%)` }} />
            </>
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${primary} 0%, ${secondary} 100%)` }} />
          )}
          {imageLoading && loadingOverlay}
        </div>

        <div
          className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center text-white"
          style={{ top: "52%", padding: "26px 20px 16px", gap: 8 }}
        >
          <p className="font-bold" style={{ fontSize: 20, lineHeight: 1.22 }}>{headline}</p>
          <p className="line-clamp-3" style={{ fontSize: 12, lineHeight: 1.48, opacity: 0.92 }}>{message}</p>
          {cta && (
            <span className="rounded-full font-bold" style={{ border: "1.5px solid #ffffff", padding: "6px 16px", fontSize: 12, marginTop: 2 }}>
              {cta}
            </span>
          )}
          <div style={{ marginTop: "auto", width: "100%" }}>
            <BrandContactBar
              phone={brand.phone} website={brand.website} address={brand.address}
              bg="rgba(255,255,255,0.16)" fg="#ffffff" badgeBg="#ffffff" badgeFg={secondary}
            />
          </div>
        </div>

        {brand.logo && (
          <img
            src={brand.logo} alt=""
            className="absolute rounded-full object-cover shadow-lg border-2 border-white"
            style={{ left: "50%", top: "52%", transform: "translate(-50%, -50%)", height: 48, width: 48 }}
          />
        )}

        <Watermark />
      </div>
    </div>
  );
});
SplitDuotone.displayName = "SplitDuotone";

export const storyTemplates: {
  id: StoryTemplateId; name: string;
  Component: typeof SplitDuotone;
}[] = [
  { id: "split-duotone", name: "Split Duotone", Component: SplitDuotone },
];

/** Real lookup only -- an unknown key returns null, same philosophy as
 *  post-templates.tsx's getPostTemplate(). */
export function getStoryTemplate(id: string | null | undefined) {
  return storyTemplates.find((t) => t.id === id) ?? null;
}
