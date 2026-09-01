import { Check, X, ImageIcon, ArrowRight, ShieldCheck } from "lucide-react";
import {
  TemplateShell,
  TemplateBrandHeader,
  TemplateBrandFooter,
  TemplateCtaPill,
  Divider,
  Statistic,
  extractLeadingStatistic,
  fitHeadline,
} from "@/components/template-primitives";
import { primaryIconFor } from "@/lib/carousel-themes";
import type { BrandKit } from "@/lib/brand-kit";

/**
 * src/components/post-templates.tsx
 *
 * Template-specific renderers for Post-format catalog templates. Each one is
 * a genuinely distinct composition -- render_key is a real lookup key here,
 * exactly like Poster's templateFrames.tsx, not a category label. This is
 * the ONE place a Post render_key becomes pixels: Template Studio's catalog
 * preview, Content Studio's post-generation preview, and Content History all
 * call getPostTemplate() and render the same component it returns.
 *
 * Props are the real SinglePost shape (headline/content/cta/specialty/brand),
 * not a poster's headline/subline -- these render actual generated content,
 * not placeholder copy.
 */

export type PostTemplateId =
  | "myth-fact-editorial"
  | "stat-editorial"
  | "doctor-qa"
  | "checklist-sidebar"
  | "polaroid-stack"
  | "editorial-column"
  | "blueprint-grid"
  | "torn-ticket"
  | "certified-seal"
  | "dossier-tab"
  | "layered-frame"
  | "swiss-grid-bold";

export type PostTemplateProps = {
  headline: string;
  content: string;
  cta: string;
  specialty: string;
  brand: BrandKit;
  imageUrl?: string | null;
  imageLoading?: boolean;
  loadingOverlay?: React.ReactNode;
};

/* ── 11 · Myth vs Fact Editorial ─────────────────────────────────────────────
 * Asymmetric magazine split: a dark, de-emphasized MYTH column against a
 * brand-tinted FACT column that gets more width and more visual weight --
 * the composition itself argues for the fact, not just the copy. */
function splitMythFact(content: string): { myth: string; fact: string } {
  const idx = content.search(/\bfact\s*[:\-–—]/i);
  const myth = idx > 0 ? content.slice(0, idx) : content;
  const fact = idx > 0 ? content.slice(idx) : "";
  const strip = (s: string) => s.replace(/^\s*(myth|fact)\s*[:\-–—]\s*/i, "").trim();
  return { myth: strip(myth), fact: strip(fact) };
}

function MythFactEditorial(p: PostTemplateProps) {
  const { primary } = { primary: p.brand.primaryColor || "#2E6E62" };
  const { myth, fact } = splitMythFact(p.content);
  return (
    <TemplateShell style={{ background: "#fbfbf9" }}>
      <div className="absolute inset-0 flex flex-col" style={{ padding: 22 }}>
        <TemplateBrandHeader brand={p.brand} />
        <p
          className="font-semibold"
          style={{
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            fontSize: fitHeadline(24, p.headline, 44),
            lineHeight: 1.22, color: "#1a1a1a", marginTop: 14, wordBreak: "break-word",
          }}
        >
          {p.headline}
        </p>
        <div style={{ marginTop: 10 }}><Divider color="#c9a96e" width={40} /></div>

        <div className="flex-1 flex mt-3 rounded-xl overflow-hidden border" style={{ borderColor: "#e5e1d8" }}>
          <div className="flex flex-col justify-center" style={{ width: "36%", background: "#1a1f1e", padding: "16px 14px", gap: 8 }}>
            <div className="flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" style={{ color: "#c96b5f" }} />
              <span className="uppercase font-bold" style={{ fontSize: 10, letterSpacing: "0.14em", color: "#c96b5f" }}>Myth</span>
            </div>
            <p className="line-clamp-6" style={{ fontSize: 12, lineHeight: 1.5, color: "#c9cfcd" }}>{myth}</p>
          </div>
          <div className="flex-1 flex flex-col justify-center" style={{ background: `${primary}14`, padding: "18px 16px", gap: 8 }}>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4" style={{ color: primary }} />
              <span className="uppercase font-bold" style={{ fontSize: 10.5, letterSpacing: "0.14em", color: primary }}>Fact</span>
            </div>
            <p className="line-clamp-6" style={{ fontSize: 13.5, lineHeight: 1.55, color: "#1a1a1a", fontWeight: 500 }}>{fact || p.content}</p>
          </div>
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
          <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
        </div>
        <div style={{ marginTop: 10 }}>
          <TemplateBrandFooter brand={p.brand} specialty={p.specialty} bg="#f1efe9" fg="#2a2a2a" />
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── 12 · Stat Spotlight (editorial) ─────────────────────────────────────────
 * Oversized number does the talking; a small citation chip keeps the source
 * visible instead of burying it in body copy -- the design itself enforces
 * "always show your source," matching the evidence-driven architecture. */
function extractSourceChip(content: string): { body: string; source: string | null } {
  const m = content.match(/\(([^)]{2,80})\)\s*$/) ?? content.match(/\(([^)]{2,80})\)/);
  if (!m) return { body: content, source: null };
  return { body: content.replace(m[0], "").trim(), source: m[1].trim() };
}

function StatEditorial(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const { body, source } = extractSourceChip(p.content);
  const stat = extractLeadingStatistic(body) ?? extractLeadingStatistic(p.headline);
  return (
    <TemplateShell style={{ background: "#fcfcfb" }}>
      {p.imageUrl && (
        <>
          <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.16 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #fcfcfbcc 0%, #fcfcfbf2 100%)" }} />
        </>
      )}
      {p.imageLoading && p.loadingOverlay}
      <div className="absolute inset-0 flex flex-col text-center" style={{ padding: 24 }}>
        <TemplateBrandHeader brand={p.brand} />
        <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: 7 }}>
          <p className="uppercase" style={{ fontSize: 11, letterSpacing: "0.2em", color: "#8a8a85" }}>{p.specialty}</p>
          <Statistic value={stat?.value ?? p.headline} color={primary} size={50} />
          <Divider color="#c9a96e" width={56} height={3} />
          <p className="line-clamp-3" style={{ fontSize: 14, lineHeight: 1.45, color: "#1a1a1a", maxWidth: "88%", marginTop: 2 }}>
            {stat?.rest || body}
          </p>
          {source && (
            <span
              className="uppercase font-semibold truncate"
              style={{ fontSize: 9.5, letterSpacing: "0.08em", color: "#6b6b66", background: "#f1efe9", padding: "4px 10px", borderRadius: 20, marginTop: 2, maxWidth: "90%" }}
            >
              Source: {source}
            </span>
          )}
        </div>
        <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
        <div style={{ marginTop: 8 }}>
          <TemplateBrandFooter brand={p.brand} specialty={p.specialty} bg="#f1efe9" fg="#2a2a2a" />
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── 13 · Doctor Q&A ──────────────────────────────────────────────────────────
 * A consultation card, not a chat bubble: question sits in an accent tag next
 * to the doctor's avatar, the answer lives in its own bordered card signed
 * by name -- reads as one clinician speaking, not a generic FAQ layout. */
function DoctorQA(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const Icon = primaryIconFor(p.specialty || "Default");
  const question = /\?\s*$/.test(p.headline) ? p.headline : `${p.headline}?`;
  return (
    <TemplateShell style={{ background: "#f7f8f6" }}>
      <Icon className="absolute" style={{ right: -20, bottom: -20, height: 180, width: 180, color: `${primary}0f` }} />
      <div className="absolute inset-0 flex flex-col" style={{ padding: 22 }}>
        <TemplateBrandHeader brand={p.brand} />

        <div className="flex items-start gap-2.5" style={{ marginTop: 12 }}>
          {p.brand.doctorPhoto ? (
            <img src={p.brand.doctorPhoto} alt="" className="rounded-full object-cover shrink-0" style={{ height: 36, width: 36 }} />
          ) : (
            <div className="rounded-full grid place-items-center shrink-0" style={{ height: 36, width: 36, background: `${primary}22`, color: primary }}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div
            className="rounded-2xl"
            style={{ background: primary, color: "#fff", padding: "9px 13px", borderRadius: "4px 16px 16px 16px" }}
          >
            <p className="line-clamp-2" style={{ fontSize: fitHeadline(15, question, 60), lineHeight: 1.3, fontWeight: 600 }}>{question}</p>
          </div>
        </div>

        <div
          className="flex-1 mt-2.5 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.94)", borderColor: "#e5e1d8", padding: "14px 14px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}
        >
          <p className="line-clamp-3" style={{ fontSize: 13, lineHeight: 1.5, color: "#242422" }}>{p.content}</p>
          {p.brand.doctorName && (
            <p className="font-semibold" style={{ fontSize: 11, color: primary }}>
              — {p.brand.doctorName}{p.specialty ? `, ${p.specialty}` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
          <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
        </div>
        <div style={{ marginTop: 8 }}>
          <TemplateBrandFooter brand={p.brand} bg="#eceae2" fg="#2a2a2a" />
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── 14 · Health Tips Checklist (sidebar) ─────────────────────────────────────
 * A full-height accent strip is the identity marker; each tip gets its own
 * numbered pill so the list reads as discrete, actionable steps rather than
 * a paragraph broken into lines. */
function splitTips(content: string): string[] {
  return content.split(/\n|;/).map((s) => s.trim()).filter(Boolean).slice(0, 5);
}

function ChecklistSidebar(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const tips = splitTips(p.content);
  return (
    <TemplateShell style={{ background: "#ffffff" }}>
      <div className="absolute inset-y-0 left-0" style={{ width: 10, background: primary }} />
      <div className="absolute inset-0 flex flex-col" style={{ padding: "22px 22px 22px 30px" }}>
        <TemplateBrandHeader brand={p.brand} />
        <p
          className="font-bold line-clamp-2"
          style={{ fontSize: fitHeadline(20, p.headline, 40), lineHeight: 1.25, color: "#1a1a1a", marginTop: 12, wordBreak: "break-word" }}
        >
          {p.headline}
        </p>

        <div className="flex-1 flex flex-col justify-center" style={{ gap: 8, marginTop: 10 }}>
          {tips.map((tip, i) => (
            <div key={i} className="flex items-center" style={{ gap: 10 }}>
              <span
                className="grid place-items-center rounded-full font-bold shrink-0"
                style={{ height: 20, width: 20, background: `${primary}1a`, color: primary, fontSize: 11 }}
              >
                {i + 1}
              </span>
              <p className="line-clamp-1" style={{ fontSize: 12.5, lineHeight: 1.4, color: "#242422", fontWeight: 500 }}>{tip}</p>
            </div>
          ))}
        </div>

        <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
        <div style={{ marginTop: 8 }}>
          <TemplateBrandFooter brand={p.brand} specialty={p.specialty} bg="#f1efe9" fg="#2a2a2a" />
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── 15 · Polaroid Stack ──────────────────────────────────────────────────────
 * The photo IS the composition -- a tilted, thick-bordered instant print on a
 * soft paper ground, not a supporting panel behind text. Shape-first, per the
 * Shape Library matrix: no content category determines this layout. */
function firstSentence(content: string, max: number): string {
  const m = content.match(/^[^.!?\n]+[.!?]?/);
  const s = (m?.[0] ?? content).trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function PolaroidStack(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const caption = firstSentence(p.content, 72);
  return (
    <TemplateShell style={{ background: "#f2ede2" }}>
      <div className="absolute inset-0 flex flex-col items-center" style={{ padding: "24px 20px 20px" }}>
        <div
          className="relative shrink-0"
          style={{ width: "64%", background: "#ffffff", padding: "12px 12px 40px", boxShadow: "0 16px 30px rgba(30,25,15,0.22)", transform: "rotate(-4deg)" }}
        >
          <div className="relative overflow-hidden" style={{ aspectRatio: "1 / 1", background: "#e3ded2" }}>
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center" style={{ background: "linear-gradient(150deg, #eef2f6 0%, #d7dfe7 100%)" }}>
                <ImageIcon className="h-6 w-6" style={{ color: "#9aa7b3" }} />
              </div>
            )}
            {p.imageLoading && p.loadingOverlay}
          </div>
          <p
            className="truncate"
            style={{ position: "absolute", left: 14, right: 14, bottom: 12, fontStyle: "italic", fontSize: 12.5, color: "#4b4438", textAlign: "center" }}
          >
            {caption}
          </p>
          {p.brand.logo && (
            <img
              src={p.brand.logo} alt=""
              className="absolute rounded-full object-cover shadow-md border-2 border-white"
              style={{ top: -14, right: -12, height: 38, width: 38, transform: "rotate(9deg)" }}
            />
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ gap: 10, marginTop: 16 }}>
          <p className="font-bold line-clamp-2" style={{ fontSize: fitHeadline(20, p.headline, 44), lineHeight: 1.28, color: "#241f16" }}>{p.headline}</p>
          <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
        </div>
        <TemplateBrandFooter brand={p.brand} specialty={p.specialty} bg="rgba(255,255,255,0.6)" fg="#332c1f" />
      </div>
    </TemplateShell>
  );
}

/* ── 16 · Editorial Column ────────────────────────────────────────────────────
 * A fixed narrow text column against a hard-edged, full-bleed photo strip --
 * no gutter, no radius on the seam. Sharp masthead register, not a soft
 * magazine spread (Magazine Spread already owns that Carousel territory). */
function EditorialColumn(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  return (
    <TemplateShell style={{ background: "#ffffff" }}>
      <div className="absolute inset-0 flex">
        <div className="flex flex-col" style={{ width: "38%", padding: "20px 16px 18px" }}>
          <TemplateBrandHeader brand={p.brand} />
          <div style={{ marginTop: 14 }}>
            <p className="uppercase font-bold" style={{ fontSize: 9.5, letterSpacing: "0.18em", color: primary }}>
              {p.specialty || "Clinical Note"}
            </p>
            <div style={{ marginTop: 6 }}><Divider color="#1a1a1a" width={26} height={2} /></div>
          </div>
          <p
            className="font-bold line-clamp-4"
            style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontSize: fitHeadline(21, p.headline, 46),
              lineHeight: 1.2, color: "#1a1a1a", marginTop: 10, wordBreak: "break-word",
            }}
          >
            {p.headline}
          </p>
          <p
            className="flex-1 line-clamp-[9]"
            style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontSize: 11.5, lineHeight: 1.55, color: "#3a3a36", marginTop: 8 }}
          >
            {p.content}
          </p>
          {p.cta && (
            <div className="flex items-center gap-1" style={{ marginTop: 10, borderBottom: `2px solid ${primary}`, paddingBottom: 4, alignSelf: "flex-start" }}>
              <span className="font-bold" style={{ fontSize: 12.5, color: primary }}>{p.cta}</span>
              <ArrowRight className="h-3.5 w-3.5" style={{ color: primary }} />
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <TemplateBrandFooter brand={p.brand} specialty={undefined} bg="#ffffff" fg="#2a2a2a" />
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden" style={{ borderLeft: "1px solid #eceae2" }}>
          {p.imageUrl ? (
            <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ background: "linear-gradient(160deg, #eef2f6 0%, #d7dfe7 100%)" }}>
              <ImageIcon className="h-7 w-7" style={{ color: "#9aa7b3" }} />
            </div>
          )}
          {p.imageLoading && p.loadingOverlay}
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── 17 · Blueprint Grid ───────────────────────────────────────────────────────
 * Technical schematic language: dot-grid ground, corner registration marks, a
 * rectangular spec-sheet photo annotated by orthogonal elbowed leader lines --
 * deliberately not Anatomy Callout's circular medallion + radiating lines. */
function CornerBracket({ pos, color }: { pos: "tl" | "tr" | "bl" | "br"; color: string }) {
  const size = 16;
  const base: React.CSSProperties = { position: "absolute", width: size, height: size, borderColor: color };
  const map: Record<string, React.CSSProperties> = {
    tl: { top: 10, left: 10, borderTop: "2px solid", borderLeft: "2px solid" },
    tr: { top: 10, right: 10, borderTop: "2px solid", borderRight: "2px solid" },
    bl: { bottom: 10, left: 10, borderBottom: "2px solid", borderLeft: "2px solid" },
    br: { bottom: 10, right: 10, borderBottom: "2px solid", borderRight: "2px solid" },
  };
  return <span style={{ ...base, ...map[pos], borderColor: color }} />;
}

function BlueprintGrid(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  return (
    <TemplateShell
      style={{
        background: "#f3f7fa",
        backgroundImage: `radial-gradient(${primary}33 1px, transparent 1px)`,
        backgroundSize: "13px 13px",
      }}
    >
      <CornerBracket pos="tl" color={primary} />
      <CornerBracket pos="tr" color={primary} />
      <CornerBracket pos="bl" color={primary} />
      <CornerBracket pos="br" color={primary} />
      <div className="absolute inset-0 flex flex-col" style={{ padding: 30 }}>
        <TemplateBrandHeader brand={p.brand} />
        <p className="uppercase font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.16em", color: primary, marginTop: 12 }}>
          Ref // {(p.specialty || "General Care").toUpperCase()}
        </p>
        <p
          className="font-bold line-clamp-2"
          style={{ fontSize: fitHeadline(19, p.headline, 42), lineHeight: 1.22, color: "#151a1f", marginTop: 6, wordBreak: "break-word" }}
        >
          {p.headline}
        </p>

        <div className="relative flex-1" style={{ marginTop: 12 }}>
          <div
            className="absolute overflow-hidden"
            style={{ top: "6%", left: "20%", width: "60%", height: "62%", border: `1.5px solid ${primary}`, background: "#e7edf1" }}
          >
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <ImageIcon className="h-6 w-6" style={{ color: "#9aa7b3" }} />
              </div>
            )}
            {p.imageLoading && p.loadingOverlay}
          </div>

          {/* elbowed leader -> left label */}
          <div className="absolute" style={{ top: "14%", left: "2%", width: "18%", height: 1.5, background: primary }} />
          <div className="absolute" style={{ top: "14%", left: "2%", width: 1.5, height: "10%", background: primary }} />
          <div className="absolute" style={{ top: "23%", left: 0, maxWidth: "20%" }}>
            <span className="font-bold uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.06em", color: "#151a1f", background: "#f3f7fa", padding: "2px 4px" }}>
              Diagnosis
            </span>
          </div>

          {/* elbowed leader -> right label */}
          <div className="absolute" style={{ top: "58%", right: "2%", width: "18%", height: 1.5, background: primary }} />
          <div className="absolute" style={{ top: "58%", right: "2%", width: 1.5, height: "10%", background: primary }} />
          <div className="absolute text-right" style={{ top: "67%", right: 0, maxWidth: "22%" }}>
            <span className="font-bold uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.06em", color: "#151a1f", background: "#f3f7fa", padding: "2px 4px" }}>
              Care Plan
            </span>
          </div>
        </div>

        <p className="line-clamp-2" style={{ fontSize: 11.5, lineHeight: 1.5, color: "#3a4550", marginTop: 6 }}>{p.content}</p>

        <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
          {p.cta && (
            <span className="font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: primary, border: `1.5px solid ${primary}`, padding: "5px 10px" }}>
              [ {p.cta} ]
            </span>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <TemplateBrandFooter brand={p.brand} specialty={undefined} bg="transparent" fg="#151a1f" />
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── 18 · Torn Ticket ─────────────────────────────────────────────────────────
 * A genuine admission-ticket silhouette -- wide photo stub + narrow accent
 * stub joined by a perforated seam. The CTA structurally lives in the stub,
 * not floated over the photo like every other design. */
function TornTicket(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const notches = Array.from({ length: 11 });
  return (
    <TemplateShell style={{ background: "#141414" }}>
      <div className="absolute inset-0 flex">
        <div className="relative" style={{ width: "72%" }}>
          {p.imageUrl ? (
            <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ background: "linear-gradient(160deg, #2a2a2a 0%, #101010 100%)" }}>
              <ImageIcon className="h-7 w-7" style={{ color: "#5a5a5a" }} />
            </div>
          )}
          {p.imageLoading && p.loadingOverlay}
          <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 42%, rgba(0,0,0,0.35) 100%)" }} />
          <div className="absolute" style={{ top: 16, left: 16 }}>
            <TemplateBrandHeader brand={p.brand} dark />
          </div>
          <span
            className="absolute uppercase font-bold"
            style={{ top: 16, right: 16, fontSize: 9, letterSpacing: "0.14em", color: "#fff", background: `${primary}cc`, padding: "4px 9px", borderRadius: 3 }}
          >
            Admit One
          </span>
          <div className="absolute" style={{ left: 18, right: 18, bottom: 16 }}>
            <p className="font-bold line-clamp-2" style={{ color: "#fff", fontSize: fitHeadline(20, p.headline, 40), lineHeight: 1.24 }}>{p.headline}</p>
          </div>
        </div>

        <div className="relative flex flex-col items-center" style={{ width: "28%", background: primary, padding: "16px 8px" }}>
          {notches.map((_, i) => (
            <span key={i} className="absolute rounded-full" style={{ left: -8, top: `${(i / (notches.length - 1)) * 100}%`, transform: "translateY(-50%)", height: 16, width: 16, background: "#141414" }} />
          ))}
          <div className="flex items-end" style={{ gap: 2, height: 26, marginTop: 4 }}>
            {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3].map((w, i) => (
              <span key={i} style={{ width: w, height: "100%", background: "rgba(255,255,255,0.85)" }} />
            ))}
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ gap: 8 }}>
            {p.cta && (
              <p className="font-bold uppercase" style={{ color: "#fff", fontSize: 13, lineHeight: 1.3, letterSpacing: "0.02em" }}>{p.cta}</p>
            )}
          </div>
          <p
            className="truncate"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.75)", maxHeight: 120 }}
          >
            {p.brand.clinicName || p.specialty || "Book Now"}
          </p>
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── 19 · Certified Seal ──────────────────────────────────────────────────────
 * A certificate/document composition, not a badge card -- double-rule border
 * with corner flourishes, a wax-seal credential badge, and a signed-by line.
 * No photo: the trust signal here is the document itself. */
function CertifiedSeal(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  const corners: ("tl" | "tr" | "bl" | "br")[] = ["tl", "tr", "bl", "br"];
  const cornerPos: Record<string, React.CSSProperties> = {
    tl: { top: 24, left: 24 }, tr: { top: 24, right: 24 },
    bl: { bottom: 24, left: 24 }, br: { bottom: 24, right: 24 },
  };
  return (
    <TemplateShell style={{ background: "#f8f2e4" }}>
      <div className="absolute" style={{ inset: 14, border: `2px solid ${primary}` }} />
      <div className="absolute" style={{ inset: 19, border: `1px solid ${primary}88` }} />
      {corners.map((c) => (
        <span key={c} className="absolute" style={{ ...cornerPos[c], height: 7, width: 7, background: primary, transform: "rotate(45deg)" }} />
      ))}

      <div className="absolute inset-0 flex flex-col items-center text-center" style={{ padding: "40px 42px" }}>
        {p.brand.logo && (
          <img src={p.brand.logo} alt="" className="rounded object-contain bg-white/90 shadow shrink-0" style={{ height: 30, width: 30, padding: 3 }} />
        )}
        <p className="uppercase font-bold" style={{ fontSize: 10, letterSpacing: "0.24em", color: primary, marginTop: p.brand.logo ? 8 : 4 }}>
          Certificate of Care
        </p>

        <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: 10 }}>
          <div className="relative grid place-items-center rounded-full" style={{ height: 76, width: 76, background: `${primary}14`, border: `2px solid ${primary}` }}>
            <div className="grid place-items-center rounded-full" style={{ height: 58, width: 58, border: `1.5px dashed ${primary}` }}>
              <ShieldCheck className="h-6 w-6" style={{ color: primary }} />
            </div>
            <span className="absolute" style={{ bottom: -10, left: 16, height: 16, width: 10, background: primary, clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
            <span className="absolute" style={{ bottom: -10, right: 16, height: 16, width: 10, background: primary, clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
          </div>

          <p
            className="font-bold line-clamp-2 uppercase"
            style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontSize: fitHeadline(17, p.headline, 44), letterSpacing: "0.03em", lineHeight: 1.35, color: "#241f16" }}
          >
            {p.headline}
          </p>
          <Divider color={primary} width={44} height={2} />
          <p className="line-clamp-3" style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontSize: 12, lineHeight: 1.55, color: "#4a4436", maxWidth: "84%" }}>
            {p.content}
          </p>

          {p.brand.doctorName && (
            <div style={{ marginTop: 4 }}>
              <p style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontStyle: "italic", fontSize: 15, color: "#241f16" }}>
                {p.brand.doctorName}
              </p>
              <div style={{ borderTop: "1px solid #241f16", width: 130, margin: "3px auto 0" }} />
              <p className="uppercase" style={{ fontSize: 8.5, letterSpacing: "0.14em", color: "#6b6355", marginTop: 3 }}>
                {p.specialty || "Signed"}
              </p>
            </div>
          )}
        </div>

        {p.cta && (
          <span
            className="font-bold uppercase"
            style={{ color: primary, border: `1.5px solid ${primary}`, boxShadow: `0 0 0 3px ${primary}22`, padding: "7px 16px", fontSize: 11, letterSpacing: "0.08em", transform: "rotate(-2deg)" }}
          >
            {p.cta}
          </span>
        )}
      </div>
    </TemplateShell>
  );
}

/* ── 20 · Dossier Tab ─────────────────────────────────────────────────────────
 * A clinical-paperwork metaphor: manila tab, justified typed body over faint
 * ruled lines, a small ID-style photo, and a rotated ink-stamp CTA. */
function DossierTab(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  return (
    <TemplateShell style={{ background: "#efe8d4" }}>
      <div className="absolute" style={{ top: 0, left: 26, width: 132, height: 24, background: "#d8cda8", borderRadius: "4px 4px 0 0" }}>
        <p className="uppercase font-bold truncate" style={{ fontSize: 8.5, letterSpacing: "0.1em", color: "#4a4430", padding: "6px 10px" }}>
          {p.specialty || "Patient File"}
        </p>
      </div>

      <div className="absolute" style={{ top: 24, left: 14, right: 14, bottom: 14, background: "#fbf8f0", border: "1px solid #d8cda8" }}>
        <div className="relative h-full flex flex-col" style={{ padding: 18 }}>
          <div className="flex items-start justify-between">
            <TemplateBrandHeader brand={p.brand} />
            <div className="relative shrink-0 overflow-hidden" style={{ height: 58, width: 58, borderRadius: 4, border: "2px solid #ffffff", boxShadow: "0 2px 6px rgba(0,0,0,0.18)" }}>
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center" style={{ background: "#e3dcc4" }}>
                  <ImageIcon className="h-4 w-4" style={{ color: "#a89f7f" }} />
                </div>
              )}
              {p.imageLoading && p.loadingOverlay}
            </div>
          </div>

          <p
            className="font-bold line-clamp-2"
            style={{ fontSize: fitHeadline(18, p.headline, 40), lineHeight: 1.24, color: "#241f16", marginTop: 12, wordBreak: "break-word" }}
          >
            {p.headline}
          </p>

          <div
            className="flex-1 line-clamp-[7]"
            style={{
              textAlign: "justify", fontSize: 12, lineHeight: 1.9, color: "#3a3323", marginTop: 8,
              backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 22px, #e3dcc4 23px)",
            }}
          >
            {p.content}
          </div>

          <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
            <TemplateBrandFooter brand={p.brand} specialty={undefined} bg="transparent" fg="#4a4430" />
            {p.cta && (
              <span
                className="font-bold uppercase shrink-0"
                style={{
                  color: "#b6432f", border: "2px solid #b6432f", borderRadius: "50% / 40%", padding: "9px 12px",
                  fontSize: 10, letterSpacing: "0.06em", transform: "rotate(-9deg)", opacity: 0.88,
                }}
              >
                {p.cta}
              </span>
            )}
          </div>
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── 21 · Layered Frame ───────────────────────────────────────────────────────
 * Three physically distinct, diagonally offset planes with graduated shadow
 * depth -- a color card behind, the photo in the middle, and a text/CTA card
 * up front. Unmistakably deeper than Curve Card's single panel. */
function LayeredFrame(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  return (
    <TemplateShell style={{ background: "#f4f1ea" }}>
      <div className="absolute inset-0">
        {/* back plane -- opaque color card, shifted down-right, peeks out top-left is covered but bottom-right shows clearly */}
        <div
          className="absolute rounded-2xl"
          style={{ top: 96, left: 92, width: 360, height: 292, background: primary, transform: "rotate(6deg)", boxShadow: "0 10px 22px rgba(0,0,0,0.14)" }}
        />
        {/* middle plane -- the photo, shifted up-left relative to the back plane so both a top and bottom sliver of the back plane peek out */}
        <div
          className="absolute rounded-2xl overflow-hidden"
          style={{ top: 52, left: 44, width: 360, height: 292, transform: "rotate(-4deg)", boxShadow: "0 20px 32px rgba(0,0,0,0.22)", background: "#e3ded2" }}
        >
          {p.imageUrl ? (
            <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ background: "linear-gradient(150deg, #eef2f6 0%, #d7dfe7 100%)" }}>
              <ImageIcon className="h-6 w-6" style={{ color: "#9aa7b3" }} />
            </div>
          )}
          {p.imageLoading && p.loadingOverlay}
        </div>

        {/* front plane -- the smallest footprint, closest to the viewer (strongest shadow), narrower than the other two so photo and color plane both remain visible around it */}
        <div
          className="absolute rounded-xl"
          style={{
            left: 62, right: 108, bottom: 38, background: "#ffffff", padding: "14px 16px",
            boxShadow: "0 28px 44px rgba(0,0,0,0.32)", transform: "rotate(2.5deg)",
          }}
        >
          <div className="flex items-center justify-between">
            <TemplateBrandHeader brand={p.brand} />
          </div>
          <p
            className="font-bold line-clamp-2"
            style={{ fontSize: fitHeadline(15.5, p.headline, 36), lineHeight: 1.22, color: "#1a1a1a", marginTop: p.brand.logo || p.brand.clinicName ? 6 : 0, wordBreak: "break-word" }}
          >
            {p.headline}
          </p>
          <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
            <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
          </div>
        </div>
      </div>
    </TemplateShell>
  );
}

/* ── 22 · Swiss Grid Bold ─────────────────────────────────────────────────────
 * International Typographic Style: one strong rule, extreme type-scale
 * contrast, an asymmetric lower grid, and deliberately no photo, no pill. */
function SwissGridBold(p: PostTemplateProps) {
  const primary = p.brand.primaryColor || "#2E6E62";
  return (
    <TemplateShell style={{ background: "#fafafa" }}>
      <div className="absolute inset-0 flex flex-col" style={{ padding: "26px 26px 22px" }}>
        <div className="flex items-center justify-between">
          <p className="uppercase font-bold" style={{ fontSize: 9.5, letterSpacing: "0.16em", color: "#1a1a1a" }}>
            {p.specialty || "Clinical Update"}
          </p>
          {p.brand.logo && <img src={p.brand.logo} alt="" className="object-contain shrink-0" style={{ height: 22, width: 22 }} />}
        </div>
        <div style={{ marginTop: 8, height: 3, background: "#1a1a1a" }} />

        <p
          className="font-black line-clamp-3"
          style={{
            fontSize: fitHeadline(38, p.headline, 40), lineHeight: 1.02, letterSpacing: "-0.02em",
            color: "#1a1a1a", marginTop: 16, wordBreak: "break-word",
          }}
        >
          {p.headline}
        </p>

        <div className="flex-1 flex items-end" style={{ marginTop: 14, gap: 16 }}>
          {p.cta && (
            <span
              className="font-bold uppercase shrink-0"
              style={{ background: "#1a1a1a", color: "#fff", padding: "13px 16px", fontSize: 12, letterSpacing: "0.04em" }}
            >
              {p.cta}
            </span>
          )}
          <div className="flex-1" style={{ borderLeft: `2px solid ${primary}`, paddingLeft: 12 }}>
            <p className="line-clamp-3 text-right" style={{ fontSize: 11.5, lineHeight: 1.5, color: "#3a3a36" }}>{p.content}</p>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <TemplateBrandFooter brand={p.brand} specialty={undefined} bg="transparent" fg="#1a1a1a" />
        </div>
      </div>
    </TemplateShell>
  );
}

export const postTemplates: {
  id: PostTemplateId; name: string;
  /** Whether this design has a slot for the AI-generated photo -- gates
   *  whether Content Studio shows the "Generate AI visual" action at all,
   *  so it's never offered for a design that wouldn't visibly change. */
  usesImage: boolean;
  Component: (p: PostTemplateProps) => React.ReactElement;
}[] = [
  { id: "myth-fact-editorial", name: "Myth vs Fact Editorial", usesImage: false, Component: MythFactEditorial },
  { id: "stat-editorial",      name: "Stat Spotlight",         usesImage: true,  Component: StatEditorial },
  { id: "doctor-qa",           name: "Patient FAQ",             usesImage: false, Component: DoctorQA },
  { id: "checklist-sidebar",   name: "Health Tips Checklist",   usesImage: false, Component: ChecklistSidebar },
  { id: "polaroid-stack",      name: "Polaroid Stack",          usesImage: true,  Component: PolaroidStack },
  { id: "editorial-column",    name: "Editorial Column",        usesImage: true,  Component: EditorialColumn },
  { id: "blueprint-grid",      name: "Blueprint Grid",          usesImage: true,  Component: BlueprintGrid },
  { id: "torn-ticket",         name: "Torn Ticket",             usesImage: true,  Component: TornTicket },
  { id: "certified-seal",      name: "Certified Seal",          usesImage: false, Component: CertifiedSeal },
  { id: "dossier-tab",         name: "Dossier Tab",             usesImage: true,  Component: DossierTab },
  { id: "layered-frame",       name: "Layered Frame",           usesImage: true,  Component: LayeredFrame },
  { id: "swiss-grid-bold",     name: "Swiss Grid Bold",         usesImage: false, Component: SwissGridBold },
];

/** Real lookup only -- an unknown key returns null (excluded, never guessed
 *  at), same philosophy as template-frames.tsx's getTemplateFrame(). Unlike
 *  getTemplateFrame(), this does NOT fall back to the first entry -- callers
 *  use a null result to fall through to the dynamic archetype engine instead. */
export function getPostTemplate(id: string | null | undefined) {
  return postTemplates.find((t) => t.id === id) ?? null;
}
