import { forwardRef } from "react";
import { BrandContactBar } from "@/components/brand-frame";
import { ContextualBackground } from "@/components/carousel-layouts";
import { Watermark } from "@/components/Watermark";
import type { BrandKit } from "@/lib/brand-kit";

/**
 * The actual story creative — 9:16 gradient card, full-bleed AI/brand photo,
 * centered headline + message, doctor/clinic line, contact bar, CTA pill.
 * Shared between the studio preview (src/routes/_app.generate.tsx) and
 * Content History's post viewer so both render the exact same design
 * instead of drifting apart.
 */
const StoryCard = forwardRef<
  HTMLDivElement,
  {
    headline: string;
    message: string;
    cta: string;
    colors: string[];
    brand: BrandKit;
    specialty: string;
    imageUrl?: string | null;
    imageLoading?: boolean;
    loadingOverlay?: React.ReactNode;
    width?: number;
  }
>(({ headline, message, cta, colors, brand, specialty, imageUrl, imageLoading, loadingOverlay, width = 270 }, ref) => {
  const c1 = brand.primaryColor || colors[0] || "#0E7C7B";
  const c2 = brand.secondaryColor || colors[1] || "#1f4e79";
  const c3 = colors[2] || "#0a3d62";
  const photo = imageUrl || brand.coverPhoto || brand.clinicPhoto || brand.doctorPhoto;

  return (
    <div className="mx-auto rounded-xl overflow-hidden shadow-lg border border-border" style={{ width }}>
      <div
        ref={ref}
        className="relative w-full flex flex-col p-5 text-white"
        style={{ aspectRatio: "9 / 16", background: `linear-gradient(160deg, ${c1}, ${c2} 60%, ${c3})` }}
      >
        {imageLoading && loadingOverlay}
        {photo && (
          <>
            <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background: imageUrl
                  ? "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%)"
                  : `linear-gradient(180deg, ${c1}b3 0%, ${c2}f0 100%)`,
              }}
            />
          </>
        )}
        <ContextualBackground specialty={specialty} opacity={0.08} color="#ffffff" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex-1 grid place-items-center text-center">
            <div>
              <p className="text-2xl font-bold leading-tight">{headline}</p>
              <p className="text-sm mt-3 opacity-95">{message}</p>
            </div>
          </div>
          {(brand.doctorName || brand.clinicName) && (
            <p className="text-center text-[11px] font-semibold tracking-wide mb-1.5 truncate">
              {[brand.doctorName, brand.clinicName].filter(Boolean).join(" · ")}
            </p>
          )}
          <BrandContactBar
            phone={brand.phone}
            website={brand.website}
            address={brand.address}
            bg="rgba(255,255,255,0.18)"
            fg="#ffffff"
            badgeBg="#ffffff"
            badgeFg={c1}
            className="mb-2"
          />
          <div className="rounded-full bg-white text-sm font-semibold py-2.5 text-center shadow" style={{ color: c1 }}>{cta}</div>
        </div>
        <Watermark />
      </div>
    </div>
  );
});
StoryCard.displayName = "StoryCard";

export default StoryCard;
