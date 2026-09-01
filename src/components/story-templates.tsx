import { forwardRef } from "react";
import { Ticket, Megaphone, ShieldCheck, MapPin } from "lucide-react";
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

export type StoryTemplateId =
  | "split-duotone"
  | "appointment-ticket"
  | "awareness-spotlight"
  | "screening-reminder"
  | "first-visit-guide";

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

/* ── Appointment Ticket ───────────────────────────────────────────────────
 * A physical tear-off booking ticket: a solid stub carrying the headline/
 * message, a punched perforation seam, then a second stub whose entire job
 * is the booking CTA -- a barcode strip and a solid CTA bar, not a caption.
 * No photo bleed, no gradient wash -- flat color blocks, unlike every other
 * Story composition. Deliberately photo-free (same "no photo" philosophy as
 * Swiss Grid Bold) -- a booking ticket doesn't carry a picture. */
const PERFORATIONS = Array.from({ length: 16 });
const BARCODE_WIDTHS = [3, 1, 2, 4, 1, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 1, 2];

const AppointmentTicket = forwardRef<HTMLDivElement, StoryTemplateProps>(function AppointmentTicket(
  { headline, message, cta, brand, width = 270 },
  ref,
) {
  const primary = brand.primaryColor || "#2E6E62";
  const secondary = brand.secondaryColor || "#1f4e79";

  return (
    <div className="mx-auto rounded-xl overflow-hidden shadow-lg border border-border" style={{ width }}>
      <div ref={ref} className="relative w-full" style={{ aspectRatio: "9 / 16", background: "#ffffff", fontFamily: FONT }}>
        {/* Main stub */}
        <div className="absolute inset-x-0 top-0 flex flex-col text-white" style={{ height: "70%", background: secondary, padding: "26px 22px 22px" }}>
          <div className="inline-flex items-center gap-1.5 font-bold shrink-0" style={{ fontSize: 10, letterSpacing: 1.4, opacity: 0.85 }}>
            <Ticket className="h-3 w-3 shrink-0" /> YOUR APPOINTMENT
          </div>
          <p className="font-bold line-clamp-2 wrap-break-word" style={{ fontSize: 21, lineHeight: 1.22, marginTop: 16 }}>{headline}</p>
          <p className="line-clamp-4 wrap-break-word" style={{ fontSize: 11.5, lineHeight: 1.5, opacity: 0.9, marginTop: 8 }}>{message}</p>
        </div>

        {/* Perforation seam */}
        <div className="absolute inset-x-0 flex items-center justify-between" style={{ top: "70%", height: 0, padding: "0 4px", transform: "translateY(-50%)" }}>
          {PERFORATIONS.map((_, i) => (
            <span key={i} className="rounded-full bg-white shrink-0" style={{ width: 7, height: 7 }} />
          ))}
        </div>

        {/* Tear-off stub -- the CTA anchor */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center" style={{ top: "70%", background: primary, padding: "18px 20px 16px", gap: 10 }}>
          <div className="flex items-end gap-0.75 shrink-0" style={{ height: 16, opacity: 0.55 }}>
            {BARCODE_WIDTHS.map((w, i) => (
              <span key={i} className="bg-white shrink-0" style={{ width: w, height: "100%" }} />
            ))}
          </div>
          {cta && (
            <span className="rounded-md font-bold text-white uppercase line-clamp-2 wrap-break-word" style={{ background: "rgba(255,255,255,0.16)", border: "1.5px solid rgba(255,255,255,0.6)", padding: "8px 20px", fontSize: 12.5, letterSpacing: 0.4 }}>
              {cta}
            </span>
          )}
          <div style={{ marginTop: "auto", width: "100%" }}>
            <BrandContactBar
              phone={brand.phone} website={brand.website} address={brand.address}
              bg="rgba(255,255,255,0.16)" fg="#ffffff" badgeBg="#ffffff" badgeFg={primary}
            />
          </div>
        </div>

        <Watermark />
      </div>
    </div>
  );
});
AppointmentTicket.displayName = "AppointmentTicket";

/* ── Awareness Spotlight ──────────────────────────────────────────────────
 * An editorial awareness-campaign poster: one flat color field, an oversized
 * typographic statement between two rules, a circular occasion badge, and a
 * small supporting-info zone. Deliberately photo-free -- the type IS the
 * composition, same "no photo" philosophy as Swiss Grid Bold. */
const AwarenessSpotlight = forwardRef<HTMLDivElement, StoryTemplateProps>(function AwarenessSpotlight(
  { headline, message, cta, brand, width = 270 },
  ref,
) {
  const primary = brand.primaryColor || "#2E6E62";

  return (
    <div className="mx-auto rounded-xl overflow-hidden shadow-lg border border-border" style={{ width }}>
      <div
        ref={ref}
        className="relative w-full flex flex-col items-center text-center text-white"
        style={{ aspectRatio: "9 / 16", background: primary, fontFamily: FONT, padding: "38px 24px 22px" }}
      >
        <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 54, height: 54, border: "2px solid rgba(255,255,255,0.65)" }}>
          <Megaphone style={{ width: 22, height: 22 }} />
        </div>

        <div style={{ marginTop: 24, width: "100%" }}>
          <div className="mx-auto" style={{ height: 2, width: 36, background: "rgba(255,255,255,0.55)" }} />
          <p className="font-extrabold uppercase line-clamp-4 wrap-break-word" style={{ fontSize: 27, lineHeight: 1.14, letterSpacing: -0.3, marginTop: 14 }}>{headline}</p>
          <div className="mx-auto" style={{ height: 2, width: 36, background: "rgba(255,255,255,0.55)", marginTop: 14 }} />
        </div>

        <p className="line-clamp-4 wrap-break-word" style={{ fontSize: 12, lineHeight: 1.55, opacity: 0.92, marginTop: 16, maxWidth: "90%" }}>{message}</p>

        <div style={{ marginTop: "auto", width: "100%" }}>
          {cta && (
            <span className="inline-block font-bold uppercase line-clamp-2 wrap-break-word" style={{ background: "#ffffff", color: primary, fontSize: 11, padding: "8px 18px", letterSpacing: 0.6 }}>
              {cta}
            </span>
          )}
          <div style={{ marginTop: 14 }}>
            <BrandContactBar
              phone={brand.phone} website={brand.website} address={brand.address}
              bg="rgba(255,255,255,0.16)" fg="#ffffff" badgeBg="#ffffff" badgeFg={primary}
            />
          </div>
        </div>

        <Watermark />
      </div>
    </div>
  );
});
AwarenessSpotlight.displayName = "AwarenessSpotlight";

/* ── Screening Reminder ───────────────────────────────────────────────────
 * A calm, light, premium reminder card -- the one Story composition on a
 * light ground instead of a dark/photo-bleed one. A soft badge icon, a
 * gently framed photo card (not full-bleed), and a restrained solid CTA.
 * The clinical motif (ShieldCheck) signals reassurance, not a diagnosis. */
const ScreeningReminder = forwardRef<HTMLDivElement, StoryTemplateProps>(function ScreeningReminder(
  { headline, message, cta, brand, imageUrl, imageLoading, loadingOverlay, width = 270 },
  ref,
) {
  const primary = brand.primaryColor || "#2E6E62";
  const photo = imageUrl || brand.doctorPhoto || brand.clinicPhoto || brand.coverPhoto;

  return (
    <div className="mx-auto rounded-xl overflow-hidden shadow-lg border border-border" style={{ width }}>
      <div
        ref={ref}
        className="relative w-full flex flex-col items-center"
        style={{ aspectRatio: "9 / 16", background: "#FAF9F6", fontFamily: FONT, padding: "30px 22px 18px" }}
      >
        <div className="relative shrink-0" style={{ width: 60, height: 60 }}>
          <div className="absolute rounded-full" style={{ inset: -10, background: primary, opacity: 0.12 }} />
          <div className="relative rounded-full flex items-center justify-center" style={{ width: 60, height: 60, background: "#ffffff", boxShadow: "0 4px 14px rgba(0,0,0,0.10)" }}>
            <ShieldCheck style={{ width: 26, height: 26, color: primary }} />
          </div>
        </div>

        <p className="font-bold text-center line-clamp-2 wrap-break-word" style={{ fontSize: 19, lineHeight: 1.3, color: "#1f2937", marginTop: 18 }}>{headline}</p>
        <p className="line-clamp-3 text-center wrap-break-word" style={{ fontSize: 11.5, lineHeight: 1.6, color: "#6b7280", marginTop: 8, maxWidth: "92%" }}>{message}</p>

        <div className="relative shrink-0" style={{ marginTop: 16, width: "76%", aspectRatio: "4 / 3", borderRadius: 14, overflow: "hidden", boxShadow: "0 6px 18px rgba(0,0,0,0.10)", background: `${primary}1a` }}>
          {photo && <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          {imageLoading && loadingOverlay}
        </div>

        <div style={{ marginTop: "auto", width: "100%" }}>
          {cta && (
            <div className="rounded-xl text-center font-semibold line-clamp-2 wrap-break-word" style={{ background: primary, color: "#ffffff", padding: "11px 16px", fontSize: 12.5 }}>
              {cta}
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <BrandContactBar
              phone={brand.phone} website={brand.website} address={brand.address}
              bg="rgba(0,0,0,0.045)" fg="#1f2937" badgeBg={primary} badgeFg="#ffffff"
            />
          </div>
        </div>

        <Watermark />
      </div>
    </div>
  );
});
ScreeningReminder.displayName = "ScreeningReminder";

/* ── First Visit Guide ────────────────────────────────────────────────────
 * A compact wayfinding card: a numbered vertical step-rail (Arrival ->
 * Consultation -> Next Steps) is the entire composition, not a caption
 * next to a photo. The three steps are fixed onboarding stages, not
 * AI-generated content -- this is a patient-onboarding artifact, not
 * another educational layout. */
const FIRST_VISIT_STEPS = [
  { label: "Arrival",      hint: "Check in at the front desk" },
  { label: "Consultation", hint: "Meet your doctor, share your history" },
  { label: "Next Steps",   hint: "Leave with a clear, personal plan" },
];

const FirstVisitGuide = forwardRef<HTMLDivElement, StoryTemplateProps>(function FirstVisitGuide(
  { headline, message, cta, brand, imageUrl, imageLoading, loadingOverlay, width = 270 },
  ref,
) {
  const primary = brand.primaryColor || "#2E6E62";
  const secondary = brand.secondaryColor || "#1f4e79";
  const photo = imageUrl || brand.doctorPhoto || brand.clinicPhoto || brand.coverPhoto;

  return (
    <div className="mx-auto rounded-xl overflow-hidden shadow-lg border border-border" style={{ width }}>
      <div
        ref={ref}
        className="relative w-full flex flex-col text-white"
        style={{ aspectRatio: "9 / 16", background: secondary, fontFamily: FONT, padding: "28px 22px 18px" }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 font-bold min-w-0" style={{ fontSize: 10, letterSpacing: 1.4, opacity: 0.75 }}>
            <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">FIRST VISIT GUIDE</span>
          </div>
          {photo && (
            <div className="relative rounded-full overflow-hidden shrink-0 border-2 border-white/50" style={{ width: 30, height: 30 }}>
              <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
              {imageLoading && loadingOverlay}
            </div>
          )}
        </div>

        <p className="font-bold line-clamp-2 wrap-break-word" style={{ fontSize: 19, lineHeight: 1.26, marginTop: 12 }}>{headline}</p>
        <p className="line-clamp-2 wrap-break-word" style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.85, marginTop: 6 }}>{message}</p>

        <div className="relative" style={{ marginTop: 22 }}>
          <div className="absolute" style={{ left: 16, top: 14, bottom: 14, width: 2, background: "rgba(255,255,255,0.28)" }} />
          {FIRST_VISIT_STEPS.map((step, i) => (
            <div key={step.label} className="relative flex items-start" style={{ gap: 12, marginBottom: i < FIRST_VISIT_STEPS.length - 1 ? 16 : 0 }}>
              <div
                className="relative shrink-0 rounded-full flex items-center justify-center font-bold"
                style={{ width: 33, height: 33, background: primary, fontSize: 13.5, border: "2px solid rgba(255,255,255,0.85)" }}
              >
                {i + 1}
              </div>
              <div style={{ paddingTop: 5 }}>
                <p className="font-bold" style={{ fontSize: 12 }}>{step.label}</p>
                <p style={{ fontSize: 10, opacity: 0.75, marginTop: 1 }}>{step.hint}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto" }}>
          {cta && (
            <div className="rounded-lg text-center font-bold line-clamp-2 wrap-break-word" style={{ background: "#ffffff", color: secondary, padding: "10px 16px", fontSize: 12.5, marginBottom: 12 }}>
              {cta}
            </div>
          )}
          <BrandContactBar
            phone={brand.phone} website={brand.website} address={brand.address}
            bg="rgba(255,255,255,0.14)" fg="#ffffff" badgeBg="#ffffff" badgeFg={secondary}
          />
        </div>

        <Watermark />
      </div>
    </div>
  );
});
FirstVisitGuide.displayName = "FirstVisitGuide";

export const storyTemplates: {
  id: StoryTemplateId; name: string;
  Component: typeof SplitDuotone;
}[] = [
  { id: "split-duotone",      name: "Split Duotone",       Component: SplitDuotone },
  { id: "appointment-ticket", name: "Appointment Ticket",  Component: AppointmentTicket },
  { id: "awareness-spotlight",name: "Awareness Spotlight", Component: AwarenessSpotlight },
  { id: "screening-reminder", name: "Screening Reminder",  Component: ScreeningReminder },
  { id: "first-visit-guide",  name: "First Visit Guide",   Component: FirstVisitGuide },
];

/** Real lookup only -- an unknown key returns null, same philosophy as
 *  post-templates.tsx's getPostTemplate(). */
export function getStoryTemplate(id: string | null | undefined) {
  return storyTemplates.find((t) => t.id === id) ?? null;
}
