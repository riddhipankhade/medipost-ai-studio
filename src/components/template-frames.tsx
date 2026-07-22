import { Phone, ImageIcon } from "lucide-react";

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
  | "ribbon-banner";

export type TemplateFrameProps = {
  headline: string;
  subline?: string;
  cta?: string;
  logo?: string | null;
  businessName?: string;
  phone?: string;
  imageUrl?: string | null;
  imageLoading?: boolean;
  loadingOverlay?: React.ReactNode;
  colors: { primary: string; secondary: string };
  /** Gallery mode: show "Your Logo" / "Business Name" / "Mobile Number" slot chips */
  placeholders?: boolean;
};

/** Sample copy the frame gallery renders before anything is generated — one
 *  distinct example per template so the gallery doesn't read as ten copies
 *  of the same card. */
export const TEMPLATE_SAMPLES: Record<TemplateFrameId, { headline: string; subline: string; cta: string }> = {
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

/** Fills its box with the AI photo, or a quiet slot marker until one is generated. */
function PhotoFill({ imageUrl }: { imageUrl?: string | null }) {
  if (imageUrl) return <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />;
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
        <PhotoFill imageUrl={p.imageUrl} />
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
        <PhotoFill imageUrl={p.imageUrl} />
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
        <PhotoFill imageUrl={p.imageUrl} />
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
        <PhotoFill imageUrl={p.imageUrl} />
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
        <PhotoFill imageUrl={p.imageUrl} />
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
        <PhotoFill imageUrl={p.imageUrl} />
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
        <PhotoFill imageUrl={p.imageUrl} />
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
        <PhotoFill imageUrl={p.imageUrl} />
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
          <PhotoFill imageUrl={p.imageUrl} />
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
        <PhotoFill imageUrl={p.imageUrl} />
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

export const templateFrames: {
  id: TemplateFrameId;
  name: string;
  tagline: string;
  Frame: (p: TemplateFrameProps) => React.ReactElement;
}[] = [
  { id: "clinic-classic", name: "Classic Promo", tagline: "Photo left, bold service ribbon", Frame: ClinicClassic },
  { id: "photo-panel", name: "Angled Panel", tagline: "Full photo with angled text panel", Frame: PhotoPanel },
  { id: "hex-accent", name: "Hex Badge", tagline: "Colour card with hexagon photo", Frame: HexAccent },
  { id: "curve-card", name: "Curve Card", tagline: "Rounded panel + photo window", Frame: CurveCard },
  { id: "bold-ask", name: "Bold Question", tagline: "Big question headline beside photo", Frame: BoldAsk },
  { id: "full-photo", name: "Full Photo", tagline: "Edge-to-edge photo, overlay text", Frame: FullPhoto },
  { id: "top-banner", name: "Banner Header", tagline: "Headline on top, photo below", Frame: TopBanner },
  { id: "tilt-card", name: "Tilted Card", tagline: "Angled photo card on colour wedge", Frame: TiltCard },
  { id: "arch-window", name: "Arch Window", tagline: "Centered heading + arch photo", Frame: ArchWindow },
  { id: "ribbon-banner", name: "Photo Banner", tagline: "Photo top, message band below", Frame: RibbonBanner },
];

export function getTemplateFrame(id: string | null | undefined) {
  return templateFrames.find((f) => f.id === id) ?? templateFrames[0];
}
