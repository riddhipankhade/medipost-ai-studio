import { Phone } from "lucide-react";
import { Watermark } from "@/components/Watermark";
import { BrandContactBar } from "@/components/brand-frame";
import type { BrandKit } from "@/lib/brand-kit";

/**
 * src/components/template-primitives.tsx
 *
 * Shared, format-agnostic building blocks for the new template-specific
 * renderers (src/components/post-templates.tsx, and later carousel/story
 * equivalents). None of these determine a template's visual identity by
 * themselves -- composition is bespoke per template, these are just the
 * scaffolding every composition reuses, mirroring template-frames.tsx's
 * FrameShell/LogoSlot/ContactBar split for Post/Carousel/Story templates.
 */

const FONT = "'Poppins', 'Inter', 'Segoe UI', system-ui, sans-serif";

/** Aspect-square shell + watermark, matching FrameShell's contract exactly. */
export function TemplateShell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="relative w-full aspect-square overflow-hidden rounded-2xl border border-border shadow-md"
      style={{ fontFamily: FONT, background: "#ffffff", ...style }}
    >
      {children}
      <Watermark />
    </div>
  );
}

/** Logo (if present) + clinic name, top corner. Renders nothing with no brand data. */
export function TemplateBrandHeader({ brand, dark, corner = "left" }: {
  brand: BrandKit; dark?: boolean; corner?: "left" | "right";
}) {
  if (!brand.logo && !brand.clinicName) return null;
  const pos: React.CSSProperties = corner === "left" ? { left: 0 } : { right: 0 };
  return (
    <div className="flex items-center gap-2" style={{ ...pos }}>
      {brand.logo && (
        <img src={brand.logo} alt="" className="h-7 w-7 rounded-md object-contain bg-white/95 shadow shrink-0" style={{ padding: 2 }} />
      )}
      {brand.clinicName && (
        <p className="text-[11px] font-semibold tracking-wide truncate" style={{ color: dark ? "#ffffff" : undefined, maxWidth: 160 }}>
          {brand.clinicName}
        </p>
      )}
    </div>
  );
}

/** Doctor name + specialty line, then the shared BrandContactBar. Renders nothing with no brand data. */
export function TemplateBrandFooter({ brand, specialty, bg, fg }: {
  brand: BrandKit; specialty?: string; bg: string; fg: string;
}) {
  const hasName = !!brand.doctorName;
  const hasContact = !!(brand.phone || brand.website || brand.address);
  if (!hasName && !hasContact) return null;
  return (
    <div className="space-y-1.5">
      {hasName && (
        <p className="text-[10px] font-bold tracking-wide truncate text-center" style={{ color: fg }}>
          {brand.doctorName}{specialty ? ` · ${specialty}` : ""}
        </p>
      )}
      <BrandContactBar phone={brand.phone} website={brand.website} address={brand.address} bg={bg} fg={fg} />
    </div>
  );
}

/** The one CTA treatment every template shares — a solid rounded pill. */
export function TemplateCtaPill({ cta, bg, fg }: { cta: string; bg: string; fg: string }) {
  if (!cta) return null;
  return (
    <span className="inline-block rounded-full font-bold" style={{ background: bg, color: fg, padding: "8px 18px", fontSize: 13.5 }}>
      {cta}
    </span>
  );
}

/** Thin accent rule — used across the editorial-family templates. */
export function Divider({ color, width = 56, height = 3 }: { color: string; width?: number; height?: number }) {
  return <span className="block rounded-full" style={{ width, height, background: color }} />;
}

/**
 * Big-number statistic display. Extracts the leading figure from free text
 * (e.g. "Nearly 1 in 3 adults..." -> "1 in 3") the same way StatisticHero
 * already does today -- pure text-parsing reuse, not a layout decision.
 */
const STAT_PATTERN = /(\d{1,3}(\.\d+)?\s?%|\d+\s?(x|times)\b|\d+\s?(out of|in)\s?\d+|\bhalf of\b|\bone in \d+\b)/i;
export function extractLeadingStatistic(text: string): { value: string; rest: string } | null {
  const m = text.match(STAT_PATTERN);
  if (!m) return null;
  const value = m[0].trim();
  const rest = text.replace(m[0], "").trim().replace(/^[,.\-–—\s]+/, "");
  return { value, rest };
}

export function Statistic({ value, color, size = 64 }: { value: string; color: string; size?: number }) {
  return (
    <div style={{ fontSize: size, fontWeight: 800, lineHeight: 0.95, color }}>
      {value}
    </div>
  );
}

/** Shrinks a headline's font size as its character count grows, so a long
 *  headline degrades gracefully in a fixed box instead of overflowing. */
export function fitHeadline(base: number, text: string, threshold: number): number {
  if (text.length <= threshold) return base;
  return Math.max(Math.round(base * (threshold / text.length) * 1.15), Math.round(base * 0.7));
}

/** Small circular phone/contact badge used by a couple of the editorial designs. */
export function ContactBadge({ bg, fg }: { bg: string; fg: string }) {
  return (
    <span className="grid place-items-center rounded-full shrink-0" style={{ height: 22, width: 22, background: bg, color: fg }}>
      <Phone style={{ height: 12, width: 12 }} />
    </span>
  );
}
