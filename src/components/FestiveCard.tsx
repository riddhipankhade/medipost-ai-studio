import { forwardRef } from "react";
import { BrandContactBar } from "@/components/brand-frame";
import { Watermark } from "@/components/Watermark";

/** Optional per-card color overrides (studio pickers). Falls back to brand kit → AI palette → defaults. */
export type FestiveCardColors = {
  /** gradient base + contact-bar badge circles */
  frame?: string | null;
  /** radial highlight at the top-right of the gradient */
  glow?: string | null;
  /** contact-bar text + gradient outer edge */
  accent?: string | null;
  /** contact-bar (name/address/phone strip) background */
  contactBg?: string | null;
};

export type FestiveCardBrand = {
  doctorName?: string;
  clinicName?: string;
  doctorPhoto?: string;
  logo?: string;
  phone?: string;
  website?: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

/**
 * The actual festive greeting-card creative — square, radial gradient,
 * optional AI image, doctor photo/logo footer. Shared between the studio
 * preview (src/routes/_app.generate.tsx) and Content History's post viewer
 * so both render the exact same design instead of drifting apart.
 */
const FestiveCard = forwardRef<
  HTMLDivElement,
  {
    festival: string;
    greeting: string;
    colors: string[];
    brand: FestiveCardBrand;
    specialty?: string;
    imageUrl?: string | null;
    imageLoading?: boolean;
    loadingOverlay?: React.ReactNode;
    colorOverrides?: FestiveCardColors;
  }
>(({ festival, greeting, colors, brand, specialty, imageUrl, imageLoading, loadingOverlay, colorOverrides }, ref) => {
  const c1 = colorOverrides?.frame || brand.primaryColor || colors[0] || "#0E7C7B";
  const c2 = colorOverrides?.glow || colors[1] || "#f4b400";
  const c3 = colorOverrides?.accent || brand.secondaryColor || colors[2] || "#0a3d62";
  const contactBg = colorOverrides?.contactBg || "rgba(255,255,255,0.95)";

  return (
    <div
      ref={ref}
      className="relative w-full max-w-md min-h-112 overflow-hidden rounded-2xl shadow-lg border border-border/60 flex flex-col text-white"
      style={{ background: `radial-gradient(circle at top right, ${c2} 0%, ${c1} 60%, ${c3})` }}
    >
      {imageLoading && loadingOverlay}
      {imageUrl && (
        <>
          <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        </>
      )}
      <div className="relative z-10 flex flex-col flex-1 p-8">
        <p className="text-xs uppercase tracking-[0.3em] opacity-80">Happy</p>
        <p className="text-4xl font-bold mt-1 mb-6 leading-tight">{festival}</p>
        <p className="text-base leading-relaxed whitespace-pre-line">{greeting}</p>
        <div className="flex-1" />
        {(brand.doctorName || brand.clinicName) && (
          <div className="mt-6 pt-4 border-t border-white/30 flex items-center gap-3">
            {brand.doctorPhoto ? (
              <img src={brand.doctorPhoto} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-white/70 shrink-0" />
            ) : brand.logo ? (
              <img src={brand.logo} alt="" className="h-9 w-9 rounded-lg object-cover bg-white shrink-0" />
            ) : null}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide opacity-80">With warm wishes from</p>
              {brand.doctorName && <p className="text-sm font-semibold truncate">{brand.doctorName}</p>}
              {brand.clinicName && <p className="text-[11px] opacity-80 truncate">{brand.clinicName}</p>}
            </div>
          </div>
        )}
        <BrandContactBar
          phone={brand.phone}
          website={brand.website}
          address={brand.address}
          bg={contactBg}
          fg={c3}
          badgeBg={c1}
          badgeFg="#ffffff"
          className={brand.doctorName || brand.clinicName ? "mt-3" : "mt-6"}
        />
      </div>
      <Watermark />
    </div>
  );
});
FestiveCard.displayName = "FestiveCard";

export default FestiveCard;
