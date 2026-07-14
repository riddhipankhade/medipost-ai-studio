import { Phone, Globe, MapPin } from "lucide-react";

/**
 * BrandContactBar — the fixed, highlighted brand strip that anchors every
 * generated creative (single/carousel footer, festive card, story): a solid
 * band with a circular phone badge + bold number on the left, website on the
 * right, and the clinic address on a second row. Every field is optional and
 * the bar renders nothing when the brand kit has none of them, so creatives
 * without brand data show pure content — no placeholders, no empty frame.
 */
export function BrandContactBar({
  phone,
  website,
  address,
  bg,
  fg,
  badgeBg,
  badgeFg,
  className = "",
}: {
  phone?: string;
  website?: string;
  address?: string;
  /** band background (theme accent / brand primary) */
  bg: string;
  /** band text color */
  fg: string;
  /** phone icon badge — defaults to inverted band colors */
  badgeBg?: string;
  badgeFg?: string;
  className?: string;
}) {
  if (!phone && !website && !address) return null;
  const topRow = !!(phone || website);
  const both = !!phone && !!website;
  return (
    <div
      className={`${address ? "rounded-xl" : "rounded-full"} pl-1.5 pr-3 py-1 shadow-sm ${className}`}
      style={{ background: bg, color: fg }}
    >
      {topRow && (
        <div className={`flex items-center ${both ? "justify-between" : "justify-center"} gap-2`}>
          {phone && (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <span
                className="h-[18px] w-[18px] rounded-full grid place-items-center shrink-0"
                style={{ background: badgeBg ?? fg, color: badgeFg ?? bg }}
              >
                <Phone className="h-2.5 w-2.5" />
              </span>
              <span className="text-[10px] font-bold tracking-wide truncate">{phone}</span>
            </span>
          )}
          {website && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <Globe className="h-3 w-3 shrink-0 opacity-90" />
              <span className="text-[10px] font-semibold truncate">{website}</span>
            </span>
          )}
        </div>
      )}
      {address && (
        <div
          className={`flex items-center justify-center gap-1 pl-1.5 ${topRow ? "mt-1 pt-1 border-t" : ""}`}
          style={topRow ? { borderColor: `${fg === "#ffffff" ? "rgba(255,255,255,0.3)" : `${fg}4d`}` } : undefined}
        >
          <MapPin className="h-2.5 w-2.5 shrink-0 opacity-90" />
          <span className="text-[9px] font-medium truncate">{address}</span>
        </div>
      )}
    </div>
  );
}
