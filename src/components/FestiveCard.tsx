import { forwardRef } from "react";

export type FestiveCardBrand = {
  doctorName?: string;
  clinicName?: string;
  doctorPhoto?: string;
  logo?: string;
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
  }
>(({ festival, greeting, colors, brand, specialty, imageUrl, imageLoading, loadingOverlay }, ref) => {
  const c1 = brand.primaryColor || colors[0] || "#0E7C7B";
  const c2 = colors[1] || "#f4b400";
  const c3 = brand.secondaryColor || colors[2] || "#0a3d62";

  return (
    <div
      ref={ref}
      className="relative w-full max-w-md aspect-square overflow-hidden rounded-2xl shadow-lg border border-border/60 flex flex-col text-white"
      style={{ background: `radial-gradient(circle at top right, ${c2} 0%, ${c1} 60%, ${c3})` }}
    >
      {imageLoading && loadingOverlay}
      {imageUrl && (
        <>
          <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        </>
      )}
      <div className="relative z-10 flex flex-col h-full p-8">
        <p className="text-xs uppercase tracking-[0.3em] opacity-80">Happy</p>
        <p className="text-4xl font-bold mt-1 mb-6 leading-tight">{festival}</p>
        <p className="text-base leading-relaxed flex-1">{greeting}</p>
        <div className="mt-6 pt-4 border-t border-white/30 flex items-center gap-3">
          {brand.doctorPhoto ? (
            <img src={brand.doctorPhoto} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-white/70 shrink-0" />
          ) : brand.logo ? (
            <img src={brand.logo} alt="" className="h-9 w-9 rounded-lg object-cover bg-white shrink-0" />
          ) : null}
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide opacity-80">With warm wishes from</p>
            <p className="text-sm font-semibold truncate">{brand.doctorName || "Dr. Your Name"}</p>
            <p className="text-[11px] opacity-80 truncate">{brand.clinicName || `${specialty ?? ""} Clinic`}</p>
          </div>
        </div>
      </div>
    </div>
  );
});
FestiveCard.displayName = "FestiveCard";

export default FestiveCard;
