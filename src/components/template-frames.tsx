import { useEffect, useRef, useState } from "react";
import {
  Phone, ImageIcon, Stethoscope, Sparkles, ShieldCheck, HeartHandshake,
  Zap, Smile, CheckCircle2, Wallet, Leaf,
  AlertCircle, Clock, Frown, Check, Quote, Award, UserRound,
} from "lucide-react";
import { Watermark } from "@/components/Watermark";

/**
 * Template-post frames: fixed poster-style designs (like printed clinic flyers)
 * with named slots — logo, headline/subline/CTA, a shaped AI-photo window and a
 * Business Name + Mobile Number contact bar. Shared by the studio's Template
 * Post format (src/routes/_app.generate.tsx) and Content History's viewer.
 *
 * Frames are designed at CREATIVE_DESIGN_WIDTH (540px) with fixed-px type and
 * must render through ExactScalePreview (or be captured at 540px) so the
 * preview stays pixel-identical to the 1080×1080 download.
 */

export type TemplateFrameId =
  | "clinic-classic"
  | "photo-panel"
  | "hex-accent"
  | "curve-card"
  | "bold-ask"
  | "full-photo"
  | "top-banner"
  | "tilt-card"
  | "arch-window"
  | "ribbon-banner"
  | "benefit-grid"
  | "before-after-focus"
  | "treatment-journey"
  | "anatomy-callout"
  | "doctor-authority";

export type TemplateFrameProps = {
  headline: string;
  subline?: string;
  cta?: string;
  logo?: string | null;
  businessName?: string;
  phone?: string;
  // Short (1-3 word) benefit/trust labels, AI-generated per post -- Benefit
  // Grid renders these as an icon row, Anatomy Callout as leader-line
  // annotations; every other frame ignores the prop entirely.
  features?: string[];
  // Real Brand Kit photo/name of the clinician -- NOT AI-generated. Only
  // Doctor Authority uses these (its photo slot is the doctor's real photo,
  // never a fabricated one); every other frame ignores them.
  doctorPhoto?: string;
  doctorName?: string;
  imageUrl?: string | null;
  imageLoading?: boolean;
  loadingOverlay?: React.ReactNode;
  /** Photo reposition/zoom within the frame's photo window (0–100, 0–100, 1–2.5). Defaults reproduce the original fixed "50% 12%" / 1x crop. */
  imageOffsetX?: number;
  imageOffsetY?: number;
  imageZoom?: number;
  colors: { primary: string; secondary: string };
  /** Gallery mode: show "Your Logo" / "Business Name" / "Mobile Number" slot chips */
  placeholders?: boolean;
};

/** Sample copy the frame gallery renders before anything is generated — one
 *  distinct example per template so the gallery doesn't read as ten copies
 *  of the same card. */
export const TEMPLATE_SAMPLES: Record<TemplateFrameId, { headline: string; subline: string; cta: string; features?: string[] }> = {
  "clinic-classic": {
    headline: "Hernia Treatment Center",
    subline: "Get affordable treatment and lasting relief from hernia pain.",
    cta: "Contact Now",
  },
  "photo-panel": {
    headline: "Complete Dental Care",
    subline: "Painless treatments for a healthier, brighter smile.",
    cta: "Book a Visit",
  },
  "hex-accent": {
    headline: "Advanced Eye Care",
    subline: "Comprehensive eye exams and vision correction for the whole family.",
    cta: "Schedule Exam",
  },
  "curve-card": {
    headline: "Skin & Hair Clinic",
    subline: "Expert dermatology care for clear, healthy skin.",
    cta: "Book Consultation",
  },
  "bold-ask": {
    headline: "Joint Pain Holding You Back?",
    subline: "Orthopedic care to get you moving pain-free again.",
    cta: "Get Relief Today",
  },
  "full-photo": {
    headline: "Complete Women's Wellness",
    subline: "Compassionate care at every stage of life.",
    cta: "Book Appointment",
  },
  "top-banner": {
    headline: "Pediatric Care Clinic",
    subline: "Gentle, expert care for your little ones.",
    cta: "Schedule Visit",
  },
  "tilt-card": {
    headline: "Physiotherapy & Rehab",
    subline: "Personalized recovery plans to get you back on your feet.",
    cta: "Start Recovery",
  },
  "arch-window": {
    headline: "Cardiac Care Center",
    subline: "Advanced heart screening and treatment, close to home.",
    cta: "Book Screening",
  },
  "ribbon-banner": {
    headline: "General Surgery Center",
    subline: "Trusted surgical care with a focus on fast recovery.",
    cta: "Consult a Surgeon",
  },
  "benefit-grid": {
    headline: "Advanced Knee Pain Relief",
    subline: "Personalized orthopedic care to get you moving again.",
    cta: "Book an Assessment",
    features: ["Expert Doctors", "Advanced Care", "Painless Procedure", "Proven Results"],
  },
  "before-after-focus": {
    headline: "Smoother, Clearer Skin",
    subline: "See the difference our advanced skin treatments can make.",
    cta: "Book a Consultation",
  },
  "treatment-journey": {
    headline: "Your Path to Pain-Free Movement",
    subline: "A guided recovery plan, every step of the way.",
    cta: "Start Your Journey",
  },
  "anatomy-callout": {
    headline: "Comprehensive Eye Care",
    subline: "Advanced diagnostics and treatment for total vision health.",
    cta: "Book an Eye Exam",
    features: ["Digital Retina Scan", "Precision Correction", "Same-Day Results"],
  },
  "doctor-authority": {
    headline: "Trusted Cardiac Care",
    subline: "Expert heart health guidance, from diagnosis to recovery.",
    cta: "Book a Consultation",
  },
};

const BAR_H = 58;
const FONT = "'Poppins', 'Inter', 'Segoe UI', system-ui, sans-serif";

function FrameShell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
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

function LogoSlot({ logo, placeholders, corner = "left" }: { logo?: string | null; placeholders?: boolean; corner?: "left" | "right" }) {
  const pos: React.CSSProperties = corner === "left" ? { left: 16, top: 16 } : { right: 16, top: 16 };
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className="absolute z-30 rounded-lg object-contain bg-white/95 shadow"
        style={{ ...pos, height: 52, width: 52, padding: 4 }}
      />
    );
  }
  if (!placeholders) return null;
  return (
    <div
      className="absolute z-30 grid place-items-center rounded-lg text-white text-center font-semibold shadow"
      style={{ ...pos, height: 52, width: 52, background: "rgba(23,23,23,0.78)", border: "1.5px dashed rgba(255,255,255,0.6)", fontSize: 11.5, lineHeight: 1.25 }}
    >
      Your<br />Logo
    </div>
  );
}

function ContactBar({
  businessName, phone, placeholders, bg, fg, pillBg, pillFg,
}: {
  businessName?: string; phone?: string; placeholders?: boolean;
  bg: string; fg: string; pillBg: string; pillFg: string;
}) {
  const hasName = Boolean(businessName);
  const hasPhone = Boolean(phone);
  const name = businessName || (placeholders ? "Business Name" : "");
  const tel = phone || (placeholders ? "Mobile Number" : "");
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3"
      style={{ height: BAR_H, background: bg, color: fg, padding: "0 18px" }}
    >
      <span
        className="truncate font-semibold"
        style={{ fontSize: 15, opacity: hasName ? 1 : 0.62, fontStyle: hasName ? "normal" : "italic" }}
      >
        {name}
      </span>
      {tel && (
        <span
          className="flex items-center gap-2 rounded-full font-semibold whitespace-nowrap shrink-0"
          style={{ background: pillBg, color: pillFg, fontSize: 13, padding: "6px 14px 6px 7px", opacity: hasPhone ? 1 : 0.72 }}
        >
          <span className="grid place-items-center rounded-full" style={{ height: 22, width: 22, background: pillFg, color: pillBg }}>
            <Phone style={{ height: 12, width: 12 }} />
          </span>
          <span style={{ fontStyle: hasPhone ? "normal" : "italic" }}>{tel}</span>
        </span>
      )}
    </div>
  );
}

// object-fit:cover only leaves room to pan on the axis where the box's aspect
// ratio doesn't match the photo's — the other axis is flush with zero slack,
// so its slider silently does nothing (which axis is dead varies per frame
// shape). Forcing the photo to always render slightly LARGER than strict
// "cover" (in real pixels, via background-size) guarantees slack — and so a
// visible effect for both position sliders — on every frame, for any photo.
const PAN_MARGIN = 1.15;

function usePhotoBoxSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Fills its box with the AI photo, or a quiet slot marker until one is generated. */
function PhotoFill({ imageUrl, offsetX = 50, offsetY = 12, zoom = 1 }: { imageUrl?: string | null; offsetX?: number; offsetY?: number; zoom?: number }) {
  const [boxRef, box] = usePhotoBoxSize();
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  // Reset whenever the photo itself changes, so a stale aspect ratio from the
  // previous image never briefly gets applied to the new one.
  useEffect(() => { setNatural(null); }, [imageUrl]);

  if (imageUrl) {
    // Only apply the pan margin once the user has actually moved a slider —
    // keeps untouched/older posts pixel-identical to the original plain-cover
    // render, and only pays the (very slight) extra zoom-in when it's needed.
    const isAdjusted = offsetX !== 50 || offsetY !== 12 || zoom !== 1;
    // Fallback for the first paint (and for any browser where the natural-size
    // measurement below never resolves): plain cover + object-position, with
    // zoom layered on via transform so it ALWAYS works even in this fallback —
    // it must never depend on the async measurement succeeding.
    let imgStyle: React.CSSProperties = {
      position: "absolute", inset: 0, width: "100%", height: "100%",
      objectFit: "cover", objectPosition: `${offsetX}% ${offsetY}%`,
      transform: zoom !== 1 ? `scale(${zoom})` : undefined,
      transformOrigin: `${offsetX}% ${offsetY}%`,
    };
    if (natural && box.w && box.h) {
      const coverScale = Math.max(box.w / natural.w, box.h / natural.h);
      const scale = coverScale * (isAdjusted ? PAN_MARGIN : 1) * zoom;
      const renderedW = natural.w * scale;
      const renderedH = natural.h * scale;
      imgStyle = {
        position: "absolute", maxWidth: "none", maxHeight: "none",
        width: renderedW, height: renderedH,
        left: (box.w - renderedW) * (offsetX / 100),
        top: (box.h - renderedH) * (offsetY / 100),
      };
    }
    return (
      <div ref={boxRef} className="absolute inset-0 overflow-hidden">
        <img
          key={imageUrl}
          src={imageUrl}
          alt=""
          onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          style={imgStyle}
        />
      </div>
    );
  }
  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{
        background: "linear-gradient(150deg, #eef2f6 0%, #d7dfe7 100%)",
        backgroundImage:
          "linear-gradient(150deg, #eef2f6 0%, #d7dfe7 100%), radial-gradient(rgba(148,163,184,0.28) 1.5px, transparent 1.5px)",
        backgroundSize: "auto, 14px 14px",
      }}
    >
      <div className="flex flex-col items-center gap-2" style={{ color: "#7c8c9c" }}>
        <div
          className="grid place-items-center rounded-full"
          style={{ height: 48, width: 48, background: "rgba(255,255,255,0.75)", border: "1.5px dashed #aab6c2" }}
        >
          <ImageIcon style={{ height: 21, width: 21 }} />
        </div>
        <p className="font-medium" style={{ fontSize: 11, letterSpacing: 0.4 }}>AI photo appears here</p>
      </div>
    </div>
  );
}

function fitSize(base: number, text: string, threshold: number) {
  if (text.length <= threshold) return base;
  return Math.max(Math.round(base * (threshold / text.length) * 1.15), Math.round(base * 0.7));
}

/* ── Frame 1: photo left, bold service ribbon right ─────────────────────────── */
function ClinicClassic(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  return (
    <FrameShell style={{ background: "#f6f9fc" }}>
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute rounded-full" style={{ right: -70, top: -70, height: 220, width: 220, background: `${primary}14` }} />
      <div className="absolute rounded-full" style={{ right: 40, top: 120, height: 70, width: 70, background: `${primary}0f` }} />
      <div className="absolute overflow-hidden" style={{ left: 0, top: 0, width: "54%", bottom: BAR_H }}>
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
      </div>
      <div className="absolute flex flex-col justify-center" style={{ left: "54%", right: 0, top: 0, bottom: BAR_H, padding: "24px 22px", gap: 14 }}>
        <div
          className="font-extrabold text-white"
          style={{ background: primary, borderRadius: 10, padding: "14px 16px", fontSize: fitSize(25, p.headline, 34), lineHeight: 1.25, boxShadow: "0 6px 16px rgba(0,0,0,0.12)", wordBreak: "break-word" }}
        >
          {p.headline}
        </div>
        {p.subline && (
          <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "#334155", wordBreak: "break-word" }}>{p.subline}</p>
        )}
        {p.cta && (
          <span className="self-start rounded-full font-bold" style={{ border: `2px solid ${primary}`, color: primary, padding: "7px 18px", fontSize: 14 }}>
            {p.cta}
          </span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg={secondary} fg="#ffffff" pillBg="#ffffff" pillFg={secondary}
      />
    </FrameShell>
  );
}

/* ── Frame 2: full-bleed photo, angled colour panel on the right ────────────── */
function PhotoPanel(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  return (
    <FrameShell>
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute overflow-hidden" style={{ inset: 0, bottom: BAR_H }}>
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
      </div>
      <div
        className="absolute flex flex-col justify-center text-white"
        style={{
          right: 0, top: 0, bottom: BAR_H, width: "60%",
          background: `linear-gradient(160deg, ${primary}ee 0%, ${secondary}f5 100%)`,
          clipPath: "polygon(24% 0, 100% 0, 100% 100%, 0 100%)",
          padding: "26px 26px 26px 96px", gap: 13,
        }}
      >
        <p className="font-extrabold" style={{ fontSize: fitSize(28, p.headline, 32), lineHeight: 1.25, wordBreak: "break-word" }}>{p.headline}</p>
        {p.subline && <p style={{ fontSize: 14.5, lineHeight: 1.55, opacity: 0.94, wordBreak: "break-word" }}>{p.subline}</p>}
        {p.cta && (
          <span className="self-start rounded-full font-bold" style={{ background: "#ffffff", color: primary, padding: "8px 18px", fontSize: 14 }}>
            {p.cta}
          </span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg="rgba(15,23,42,0.94)" fg="#ffffff" pillBg={primary} pillFg="#ffffff"
      />
    </FrameShell>
  );
}

/* ── Frame 3: colour card with hexagon photo badge ──────────────────────────── */
const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

function HexAccent(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  return (
    <FrameShell style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}>
      {p.imageLoading && p.loadingOverlay}
      {[{ left: 30, top: 96 }, { left: "44%", top: 44 }, { right: 36, bottom: BAR_H + 26 }, { left: 44, bottom: BAR_H + 40 }].map((pos, i) => (
        <span key={i} className="absolute font-bold text-white" style={{ ...(pos as React.CSSProperties), fontSize: 22, opacity: 0.35 }}>+</span>
      ))}
      <div className="absolute" style={{ right: 12, top: "50%", transform: "translateY(-56%)", height: 276, width: 244, clipPath: HEX_CLIP, background: "rgba(255,255,255,0.85)" }} />
      <div className="absolute overflow-hidden" style={{ right: 18, top: "50%", transform: "translateY(-56%)", height: 260, width: 232, clipPath: HEX_CLIP }}>
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
      </div>
      <div className="absolute flex flex-col justify-center text-white" style={{ left: 26, width: "47%", top: 0, bottom: BAR_H, gap: 13, overflow: "hidden" }}>
        <p className="font-extrabold" style={{ fontSize: fitSize(27, p.headline, 32), lineHeight: 1.27, wordBreak: "break-word" }}>{p.headline}</p>
        {p.subline && <p style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.93, wordBreak: "break-word" }}>{p.subline}</p>}
        {p.cta && (
          <span className="self-start rounded-full font-bold" style={{ background: "#ffffff", color: primary, padding: "8px 18px", fontSize: 14 }}>
            {p.cta}
          </span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg="#ffffff" fg={secondary} pillBg={primary} pillFg="#ffffff"
      />
    </FrameShell>
  );
}

/* ── Frame 4: rounded colour panel + rounded photo window ───────────────────── */
function CurveCard(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  return (
    <FrameShell style={{ background: "#fbfcfe" }}>
      {p.imageLoading && p.loadingOverlay}
      {[{ right: 40, top: 30 }, { right: 78, top: 62 }, { left: 30, bottom: BAR_H + 34 }].map((pos, i) => (
        <span key={i} className="absolute font-bold" style={{ ...(pos as React.CSSProperties), fontSize: 20, color: `${primary}66` }}>+</span>
      ))}
      <div
        className="absolute flex flex-col justify-center text-white"
        style={{ left: -36, top: -36, width: 400, height: 330, background: primary, borderRadius: 48, padding: "56px 40px 30px 62px", gap: 12, boxShadow: "0 10px 26px rgba(0,0,0,0.14)" }}
      >
        <p className="font-extrabold" style={{ fontSize: fitSize(26, p.headline, 34), lineHeight: 1.27, wordBreak: "break-word" }}>{p.headline}</p>
        {p.subline && <p style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.93, wordBreak: "break-word" }}>{p.subline}</p>}
      </div>
      <div
        className="absolute overflow-hidden"
        style={{ right: 22, bottom: BAR_H + 20, width: 288, height: 224, borderRadius: 28, boxShadow: "0 8px 22px rgba(0,0,0,0.16)", border: "5px solid #ffffff" }}
      >
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
      </div>
      {p.cta && (
        <span className="absolute rounded-full font-bold text-white" style={{ left: 28, bottom: BAR_H + 26, background: secondary, padding: "9px 20px", fontSize: 14 }}>
          {p.cta}
        </span>
      )}
      <LogoSlot logo={p.logo} placeholders={p.placeholders} corner="right" />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg={secondary} fg="#ffffff" pillBg="#ffffff" pillFg={secondary}
      />
    </FrameShell>
  );
}

/* ── Frame 5: photo left, big question headline right ───────────────────────── */
function BoldAsk(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  return (
    <FrameShell>
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute overflow-hidden" style={{ left: 0, top: 0, width: "52%", bottom: BAR_H }}>
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
      </div>
      <div
        className="absolute flex flex-col justify-center items-end text-right"
        style={{ left: "52%", right: 0, top: 0, bottom: BAR_H, padding: "26px 24px", gap: 14, background: "#f8fafc" }}
      >
        <p className="font-extrabold" style={{ fontSize: fitSize(28, p.headline, 30), lineHeight: 1.28, color: secondary, wordBreak: "break-word" }}>
          {p.headline}
        </p>
        <span className="block rounded-full" style={{ height: 4, width: 64, background: primary }} />
        {p.subline && <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "#475569", wordBreak: "break-word" }}>{p.subline}</p>}
        {p.cta && <p className="font-extrabold" style={{ fontSize: 15, color: primary }}>{p.cta}</p>}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg={primary} fg="#ffffff" pillBg="#ffffff" pillFg={primary}
      />
    </FrameShell>
  );
}

/* ── Frame 6: edge-to-edge photo with overlay text (full-background) ────────── */
function FullPhoto(p: TemplateFrameProps) {
  const { primary } = p.colors;
  const shadow = { textShadow: "0 2px 10px rgba(0,0,0,0.45)" };
  return (
    <FrameShell>
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute overflow-hidden" style={{ inset: 0, bottom: BAR_H }}>
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,14,24,0.5) 0%, rgba(8,14,24,0.08) 42%, rgba(8,14,24,0.78) 100%)" }} />
      </div>
      <div className="absolute flex flex-col justify-end text-white" style={{ left: 0, right: 0, top: 0, bottom: BAR_H, padding: "26px 26px 22px", gap: 12 }}>
        <p className="font-extrabold" style={{ fontSize: fitSize(30, p.headline, 32), lineHeight: 1.22, wordBreak: "break-word", ...shadow }}>{p.headline}</p>
        {p.subline && <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.96, wordBreak: "break-word", ...shadow }}>{p.subline}</p>}
        {p.cta && (
          <span className="self-start rounded-full font-bold text-white" style={{ background: primary, padding: "9px 20px", fontSize: 14, boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}>
            {p.cta}
          </span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg="rgba(8,14,24,0.92)" fg="#ffffff" pillBg={primary} pillFg="#ffffff"
      />
    </FrameShell>
  );
}

/* ── Frame 7: headline banner on top, rounded photo below ───────────────────── */
function TopBanner(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  return (
    <FrameShell style={{ background: `linear-gradient(180deg, ${primary}10 0%, #ffffff 55%)` }}>
      {p.imageLoading && p.loadingOverlay}
      {[{ left: 26, top: 90 }, { right: 30, top: 60 }].map((pos, i) => (
        <span key={i} className="absolute font-bold" style={{ ...(pos as React.CSSProperties), fontSize: 20, color: `${primary}55` }}>+</span>
      ))}
      <div className="absolute flex flex-col items-center text-center" style={{ left: 24, right: 24, top: 24, gap: 9 }}>
        <p className="font-extrabold" style={{ fontSize: fitSize(27, p.headline, 34), lineHeight: 1.25, color: secondary, wordBreak: "break-word" }}>{p.headline}</p>
        {p.subline && <p style={{ fontSize: 14, lineHeight: 1.5, color: "#475569", maxWidth: 420, wordBreak: "break-word" }}>{p.subline}</p>}
      </div>
      <div
        className="absolute overflow-hidden"
        style={{ left: 24, right: 24, top: 192, bottom: BAR_H + 18, borderRadius: 24, border: "5px solid #ffffff", boxShadow: "0 10px 26px rgba(0,0,0,0.16)" }}
      >
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
      </div>
      {p.cta && (
        <span
          className="absolute rounded-full font-bold text-white"
          style={{ left: "50%", transform: "translateX(-50%)", bottom: BAR_H + 4, background: primary, padding: "9px 22px", fontSize: 14, boxShadow: "0 6px 16px rgba(0,0,0,0.22)", whiteSpace: "nowrap" }}
        >
          {p.cta}
        </span>
      )}
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg={secondary} fg="#ffffff" pillBg="#ffffff" pillFg={secondary}
      />
    </FrameShell>
  );
}

/* ── Frame 8: tilted photo card over a diagonal colour wedge ────────────────── */
function TiltCard(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  return (
    <FrameShell style={{ background: "#f8fafc" }}>
      {p.imageLoading && p.loadingOverlay}
      <div
        className="absolute"
        style={{ inset: 0, bottom: BAR_H, background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`, clipPath: "polygon(0 34%, 100% 78%, 100% 100%, 0 100%)" }}
      />
      <div
        className="absolute overflow-hidden"
        style={{ right: 30, top: 34, width: 300, height: 250, borderRadius: 22, transform: "rotate(5deg)", border: "6px solid #ffffff", boxShadow: "0 12px 28px rgba(0,0,0,0.2)" }}
      >
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
      </div>
      <div className="absolute flex flex-col justify-end text-white" style={{ left: 26, width: "56%", bottom: BAR_H + 20, gap: 11 }}>
        <p className="font-extrabold" style={{ fontSize: fitSize(26, p.headline, 32), lineHeight: 1.27, wordBreak: "break-word" }}>{p.headline}</p>
        {p.subline && <p style={{ fontSize: 13.5, lineHeight: 1.55, opacity: 0.94, wordBreak: "break-word" }}>{p.subline}</p>}
        {p.cta && (
          <span className="self-start rounded-full font-bold" style={{ background: "#ffffff", color: primary, padding: "8px 18px", fontSize: 13.5 }}>
            {p.cta}
          </span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg={secondary} fg="#ffffff" pillBg="#ffffff" pillFg={secondary}
      />
    </FrameShell>
  );
}

/* ── Frame 9: centered heading + arch-shaped photo window ───────────────────── */
function ArchWindow(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  const dots: React.CSSProperties = {
    backgroundImage: `radial-gradient(${primary}33 2px, transparent 2px)`,
    backgroundSize: "16px 16px",
  };
  return (
    <FrameShell style={{ background: "#ffffff" }}>
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute" style={{ left: 18, top: 18, width: 110, height: 110, ...dots }} />
      <div className="absolute" style={{ right: 18, bottom: BAR_H + 14, width: 110, height: 110, ...dots }} />
      <div className="absolute flex flex-col items-center" style={{ inset: 0, bottom: BAR_H, padding: "22px 26px 14px", gap: 9 }}>
        <p className="font-extrabold text-center" style={{ fontSize: fitSize(24, p.headline, 36), lineHeight: 1.25, color: secondary, maxWidth: 420, wordBreak: "break-word" }}>{p.headline}</p>
        {p.subline && <p className="text-center" style={{ fontSize: 13, lineHeight: 1.5, color: "#475569", maxWidth: 400, wordBreak: "break-word" }}>{p.subline}</p>}
        <div
          className="overflow-hidden relative"
          style={{ width: 330, flex: 1, minHeight: 0, borderRadius: "165px 165px 24px 24px", border: `6px solid ${primary}`, boxShadow: "0 10px 24px rgba(0,0,0,0.15)" }}
        >
          <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
        </div>
        {p.cta && (
          <span className="rounded-full font-bold text-white" style={{ background: primary, padding: "8px 22px", fontSize: 13.5, marginTop: 3 }}>
            {p.cta}
          </span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg={secondary} fg="#ffffff" pillBg={primary} pillFg="#ffffff"
      />
    </FrameShell>
  );
}

/* ── Frame 10: photo on top, message band below (chevron seam) ──────────────── */
function RibbonBanner(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  return (
    <FrameShell>
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute" style={{ left: 0, right: 0, top: "46%", bottom: BAR_H, background: `linear-gradient(160deg, ${secondary} 0%, ${primary} 130%)` }} />
      <div
        className="absolute overflow-hidden"
        style={{ left: 0, right: 0, top: 0, height: "52%", clipPath: "polygon(0 0, 100% 0, 100% 84%, 50% 100%, 0 84%)" }}
      >
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
      </div>
      <div className="absolute flex flex-col items-center justify-center text-center text-white" style={{ left: 26, right: 26, top: "52%", bottom: BAR_H, gap: 10 }}>
        <p className="font-extrabold" style={{ fontSize: fitSize(25, p.headline, 36), lineHeight: 1.27, wordBreak: "break-word" }}>{p.headline}</p>
        {p.subline && <p style={{ fontSize: 13.5, lineHeight: 1.5, opacity: 0.94, maxWidth: 420, wordBreak: "break-word" }}>{p.subline}</p>}
        {p.cta && (
          <span className="rounded-full font-bold" style={{ background: "#ffffff", color: secondary, padding: "8px 20px", fontSize: 13.5, marginTop: 2 }}>
            {p.cta}
          </span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg="#ffffff" fg={secondary} pillBg={secondary} pillFg="#ffffff"
      />
    </FrameShell>
  );
}

/* ── Frame 11: photo circle + headline, icon benefit row below ──────────────
 * The one frame with a feature-row slot: 3-4 AI-generated short benefit
 * labels, each matched to a generic (specialty-agnostic) icon by keyword --
 * the same "any field doctor" genericness as the other ten frames' layouts,
 * just with denser, more infographic-style content. */
const FEATURE_ICON_RULES: [RegExp, typeof CheckCircle2][] = [
  [/expert|doctor|specialist|experien|qualif/i, Stethoscope],
  [/advanc|technolog|modern|innovat|latest/i, Sparkles],
  [/safe|trust|certif|secur|hygien/i, ShieldCheck],
  [/personal|custom|tailor|care|comfort|gentle/i, HeartHandshake],
  [/fast|quick|rapid|efficient|same.day/i, Zap],
  [/pain.?free|relax|stress.?free/i, Smile],
  [/natural|organic/i, Leaf],
  [/afford|cost|value|budget|price/i, Wallet],
];

/** Generic (specialty-agnostic) icon for a short AI-generated benefit label
 *  -- keyword match against a small curated list, CheckCircle2 as a safe
 *  fallback so every label always renders something meaningful. */
function featureIconFor(label: string) {
  for (const [pattern, Icon] of FEATURE_ICON_RULES) {
    if (pattern.test(label)) return Icon;
  }
  return CheckCircle2;
}

function BenefitGrid(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  const features = (p.features ?? []).slice(0, 4);
  return (
    <FrameShell style={{ background: "#f8fafc" }}>
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute rounded-full" style={{ right: -60, top: -60, height: 200, width: 200, background: `${primary}12` }} />
      <div className="absolute flex flex-col" style={{ left: 0, right: 0, top: 0, bottom: BAR_H, padding: "24px 24px 18px" }}>
        <div className="flex items-center" style={{ gap: 16, marginTop: 46 }}>
          <div className="flex-1 flex flex-col justify-center" style={{ gap: 10 }}>
            <p
              className="font-extrabold"
              style={{ fontSize: fitSize(27, p.headline, 30), lineHeight: 1.22, color: secondary, wordBreak: "break-word" }}
            >
              {p.headline}
            </p>
            {p.subline && (
              <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "#475569", wordBreak: "break-word" }}>{p.subline}</p>
            )}
          </div>
          <div
            className="relative shrink-0 overflow-hidden rounded-full"
            style={{ height: 168, width: 168, border: `5px solid ${primary}`, boxShadow: "0 10px 22px rgba(0,0,0,0.14)" }}
          >
            <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
          </div>
        </div>

        {features.length > 0 && (
          <div className="flex items-start justify-between" style={{ marginTop: 20, gap: 6 }}>
            {features.map((label, i) => {
              const Icon = featureIconFor(label);
              return (
                <div key={i} className="flex flex-col items-center text-center" style={{ width: `${100 / features.length}%`, gap: 6 }}>
                  <div className="grid place-items-center rounded-full shrink-0" style={{ height: 38, width: 38, background: `${primary}18`, color: primary }}>
                    <Icon style={{ height: 18, width: 18 }} />
                  </div>
                  <p className="font-semibold line-clamp-2" style={{ fontSize: 10.5, lineHeight: 1.25, color: "#334155" }}>{label}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1" />
        {p.cta && (
          <span
            className="self-start rounded-full font-bold text-white"
            style={{ background: primary, padding: "9px 20px", fontSize: 14, boxShadow: "0 6px 16px rgba(0,0,0,0.18)" }}
          >
            {p.cta}
          </span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg={secondary} fg="#ffffff" pillBg="#ffffff" pillFg={secondary}
      />
    </FrameShell>
  );
}

/* ── Frame 12: dark problem panel + photo solution panel, seam CTA ──────────
 * The "before" side is deliberately icon-only, never AI-text -- inventing
 * per-post "before" symptom claims would be an unsupported clinical claim,
 * the same reasoning that keeps Stat Spotlight's statistic user-supplied. */
function BeforeAfterFocus(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  return (
    <FrameShell style={{ background: "#0f172a" }}>
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute flex items-center justify-center text-center" style={{ left: 0, right: 0, top: 0, height: 128, padding: "0 26px 14px", alignItems: "flex-end" }}>
        <p className="font-extrabold text-white" style={{ fontSize: fitSize(24, p.headline, 34), lineHeight: 1.22, wordBreak: "break-word" }}>{p.headline}</p>
      </div>
      <div className="absolute flex" style={{ left: 0, right: 0, top: 128, bottom: BAR_H + 56 }}>
        <div className="relative flex flex-col items-center justify-center" style={{ width: "42%", background: "#1e293b", gap: 12 }}>
          <div className="flex items-center gap-3" style={{ opacity: 0.55 }}>
            <AlertCircle style={{ height: 20, width: 20, color: "#94a3b8" }} />
            <Clock style={{ height: 20, width: 20, color: "#94a3b8" }} />
            <Frown style={{ height: 20, width: 20, color: "#94a3b8" }} />
          </div>
          <span className="uppercase font-bold" style={{ fontSize: 11, letterSpacing: "0.16em", color: "#94a3b8" }}>Before</span>
        </div>
        <div className="relative overflow-hidden" style={{ width: "58%" }}>
          <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
          <div className="absolute flex items-center" style={{ left: 14, bottom: 14, gap: 6, background: "rgba(255,255,255,0.92)", borderRadius: 20, padding: "5px 12px 5px 8px" }}>
            <span className="grid place-items-center rounded-full" style={{ height: 18, width: 18, background: primary, color: "#fff" }}>
              <Check style={{ height: 12, width: 12 }} />
            </span>
            <span className="uppercase font-bold" style={{ fontSize: 10.5, letterSpacing: "0.12em", color: "#1a1a1a" }}>After</span>
          </div>
        </div>
      </div>
      {p.cta && (
        <span
          className="absolute rounded-full font-bold text-white"
          style={{ left: "50%", transform: "translateX(-50%)", bottom: BAR_H + 16, background: primary, padding: "9px 22px", fontSize: 14, boxShadow: "0 8px 18px rgba(0,0,0,0.25)", whiteSpace: "nowrap" }}
        >
          {p.cta}
        </span>
      )}
      <LogoSlot logo={p.logo} placeholders={p.placeholders} corner="right" />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg={secondary} fg="#ffffff" pillBg="#ffffff" pillFg={secondary}
      />
    </FrameShell>
  );
}

/* ── Frame 13: full-bleed photo, diagonal waypoint trail, bottom card ───────
 * Waypoint count/position is fixed (always 3, always this arrangement) --
 * pure decorative rhythm, never content-driven, unlike Content Studio's
 * ProcessFlow archetype which lays out N pieces of AI-generated step content. */
function TreatmentJourney(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  const waypoints = [
    { left: 54, bottom: BAR_H + 200 },
    { left: 210, bottom: BAR_H + 270 },
    { left: 366, bottom: BAR_H + 340 },
  ];
  return (
    <FrameShell>
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute overflow-hidden" style={{ inset: 0, bottom: BAR_H }}>
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(200deg, rgba(8,14,24,0.05) 24%, rgba(8,14,24,0.85) 100%)" }} />
      </div>
      {waypoints.map((w, i) => (
        <div
          key={i}
          className="absolute rounded-full grid place-items-center font-bold text-white"
          style={{ left: w.left, bottom: w.bottom, height: 26, width: 26, background: primary, boxShadow: "0 3px 8px rgba(0,0,0,0.3)", fontSize: 12 }}
        >
          {i + 1}
        </div>
      ))}
      <div className="absolute flex flex-col text-white" style={{ left: 26, right: 26, bottom: BAR_H + 22, gap: 10 }}>
        <p className="font-extrabold" style={{ fontSize: fitSize(27, p.headline, 32), lineHeight: 1.22, wordBreak: "break-word", textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>{p.headline}</p>
        {p.subline && (
          <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.95, wordBreak: "break-word", textShadow: "0 2px 8px rgba(0,0,0,0.35)" }}>{p.subline}</p>
        )}
        {p.cta && (
          <span className="self-start rounded-full font-bold text-white" style={{ background: primary, padding: "9px 20px", fontSize: 14, marginTop: 2, boxShadow: "0 6px 16px rgba(0,0,0,0.3)" }}>
            {p.cta}
          </span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg="rgba(8,14,24,0.92)" fg="#ffffff" pillBg={primary} pillFg="#ffffff"
      />
    </FrameShell>
  );
}

/* ── Frame 14: central photo medallion, radiating leader-line callouts ──────
 * Reuses the SAME `features` field Benefit Grid generates -- same content,
 * deliberately different visual expression (annotations, not an icon row) --
 * and the 3 callout slots/positions are fixed, unlike Content Studio's
 * CalloutDiagram which requires structured part/step data to activate. */
function AnatomyCallout(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  const features = (p.features ?? []).slice(0, 3);
  const slots: { pos: React.CSSProperties; line: React.CSSProperties }[] = [
    { pos: { left: 18, top: 66 }, line: { left: 120, top: 108, width: 64, height: 1.5, transform: "rotate(24deg)", transformOrigin: "left center" } },
    { pos: { right: 18, top: 66 }, line: { right: 120, top: 108, width: 64, height: 1.5, transform: "rotate(-24deg)", transformOrigin: "right center" } },
    { pos: { left: "50%", bottom: BAR_H + 16, transform: "translateX(-50%)" }, line: { left: "50%", bottom: BAR_H + 58, width: 1.5, height: 40, transform: "translateX(-50%)" } },
  ];
  return (
    <FrameShell style={{ background: "#fbfbf9" }}>
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute rounded-full" style={{ left: "50%", top: 236, transform: "translate(-50%,-50%)", height: 270, width: 270, border: `2px dashed ${primary}55` }} />
      <div
        className="absolute overflow-hidden rounded-full"
        style={{ left: "50%", top: 236, transform: "translate(-50%,-50%)", height: 230, width: 230, border: `5px solid ${primary}`, boxShadow: "0 10px 24px rgba(0,0,0,0.14)" }}
      >
        <PhotoFill imageUrl={p.imageUrl} offsetX={p.imageOffsetX} offsetY={p.imageOffsetY} zoom={p.imageZoom} />
      </div>
      {features.map((label, i) => {
        const slot = slots[i];
        if (!slot) return null;
        return (
          <div key={i}>
            <div className="absolute" style={{ ...slot.line, background: `${primary}88` }} />
            <div
              className="absolute rounded-full font-semibold"
              style={{ ...slot.pos, background: "#ffffff", border: `1.5px solid ${primary}55`, color: secondary, fontSize: 11, padding: "5px 12px", boxShadow: "0 4px 10px rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}
            >
              {label}
            </div>
          </div>
        );
      })}
      <div className="absolute flex flex-col items-center text-center" style={{ left: 26, right: 26, bottom: BAR_H + 16, gap: 8 }}>
        <p className="font-extrabold" style={{ fontSize: fitSize(24, p.headline, 36), lineHeight: 1.24, color: secondary, wordBreak: "break-word" }}>{p.headline}</p>
        {p.cta && (
          <span className="rounded-full font-bold text-white" style={{ background: primary, padding: "8px 20px", fontSize: 13.5, marginTop: 4 }}>{p.cta}</span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg={secondary} fg="#ffffff" pillBg={primary} pillFg="#ffffff"
      />
    </FrameShell>
  );
}

/* ── Frame 15: doctor's real photo + credential badge, topic headline ───────
 * The one frame whose photo slot is the clinician's real Brand Kit photo,
 * never the AI-generated image -- fabricating a "doctor" photo would be
 * actively misleading, so this frame doesn't offer AI image generation at
 * all (see the registry's `usesAiImage: false` below). Not a quote card:
 * the headline is a topic statement, never literal attributed speech. */
function DoctorAuthority(p: TemplateFrameProps) {
  const { primary, secondary } = p.colors;
  return (
    <FrameShell style={{ background: "#f7f8f6" }}>
      <Quote className="absolute" style={{ left: 24, top: 54, height: 60, width: 60, color: `${primary}18` }} />
      <div className="absolute overflow-hidden" style={{ right: 0, top: 0, width: "46%", bottom: BAR_H }}>
        {p.doctorPhoto ? (
          <img src={p.doctorPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center" style={{ background: `linear-gradient(160deg, ${primary} 0%, ${secondary} 100%)` }}>
            <div className="rounded-full grid place-items-center" style={{ height: 96, width: 96, background: "rgba(255,255,255,0.18)" }}>
              <UserRound style={{ height: 44, width: 44, color: "#ffffff" }} />
            </div>
          </div>
        )}
      </div>
      <div className="absolute flex flex-col justify-center" style={{ left: 0, width: "54%", top: 0, bottom: BAR_H, padding: "26px 22px", gap: 12 }}>
        {p.doctorName && (
          <div>
            <p className="font-extrabold" style={{ fontSize: 18, color: secondary }}>{p.doctorName}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full font-bold uppercase" style={{ background: `${primary}18`, color: primary, fontSize: 9.5, letterSpacing: "0.08em", padding: "3px 10px", marginTop: 4 }}>
              <Award style={{ height: 11, width: 11 }} /> Verified Specialist
            </span>
          </div>
        )}
        <p className="font-extrabold" style={{ fontSize: fitSize(23, p.headline, 30), lineHeight: 1.24, color: "#1a1a1a", wordBreak: "break-word" }}>{p.headline}</p>
        {p.subline && <p style={{ fontSize: 13, lineHeight: 1.5, color: "#475569", wordBreak: "break-word" }}>{p.subline}</p>}
        {p.cta && (
          <span className="self-start rounded-full font-bold text-white" style={{ background: primary, padding: "9px 20px", fontSize: 14, marginTop: 2 }}>{p.cta}</span>
        )}
      </div>
      <LogoSlot logo={p.logo} placeholders={p.placeholders} />
      <ContactBar
        businessName={p.businessName} phone={p.phone} placeholders={p.placeholders}
        bg={secondary} fg="#ffffff" pillBg="#ffffff" pillFg={secondary}
      />
    </FrameShell>
  );
}

export const templateFrames: {
  id: TemplateFrameId;
  name: string;
  tagline: string;
  // Whether this frame's photo slot is the AI-generated image (gates the
  // "Generate AI visual"/"Upload photo"/pan-zoom controls in Studio). False
  // only for Doctor Authority, whose photo slot is the real Brand Kit photo.
  usesAiImage: boolean;
  Frame: (p: TemplateFrameProps) => React.ReactElement;
}[] = [
  { id: "clinic-classic", name: "Classic Promo", tagline: "Photo left, bold service ribbon", usesAiImage: true, Frame: ClinicClassic },
  { id: "photo-panel", name: "Angled Panel", tagline: "Full photo with angled text panel", usesAiImage: true, Frame: PhotoPanel },
  { id: "hex-accent", name: "Hex Badge", tagline: "Colour card with hexagon photo", usesAiImage: true, Frame: HexAccent },
  { id: "curve-card", name: "Curve Card", tagline: "Rounded panel + photo window", usesAiImage: true, Frame: CurveCard },
  { id: "bold-ask", name: "Bold Question", tagline: "Big question headline beside photo", usesAiImage: true, Frame: BoldAsk },
  { id: "full-photo", name: "Full Photo", tagline: "Edge-to-edge photo, overlay text", usesAiImage: true, Frame: FullPhoto },
  { id: "top-banner", name: "Banner Header", tagline: "Headline on top, photo below", usesAiImage: true, Frame: TopBanner },
  { id: "tilt-card", name: "Tilted Card", tagline: "Angled photo card on colour wedge", usesAiImage: true, Frame: TiltCard },
  { id: "arch-window", name: "Arch Window", tagline: "Centered heading + arch photo", usesAiImage: true, Frame: ArchWindow },
  { id: "ribbon-banner", name: "Photo Banner", tagline: "Photo top, message band below", usesAiImage: true, Frame: RibbonBanner },
  { id: "benefit-grid", name: "Benefit Grid", tagline: "Photo circle + icon benefit row", usesAiImage: true, Frame: BenefitGrid },
  { id: "before-after-focus", name: "Before / After Focus", tagline: "Problem panel + photo solution panel", usesAiImage: true, Frame: BeforeAfterFocus },
  { id: "treatment-journey", name: "Treatment Journey", tagline: "Full photo + diagonal care waypoints", usesAiImage: true, Frame: TreatmentJourney },
  { id: "anatomy-callout", name: "Anatomy Callout", tagline: "Photo medallion + leader-line callouts", usesAiImage: true, Frame: AnatomyCallout },
  { id: "doctor-authority", name: "Doctor Authority", tagline: "Clinician photo + credential badge", usesAiImage: false, Frame: DoctorAuthority },
];

export function getTemplateFrame(id: string | null | undefined) {
  return templateFrames.find((f) => f.id === id) ?? templateFrames[0];
}
