import { Check, X } from "lucide-react";
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
  | "checklist-sidebar";

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
        <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: 10 }}>
          <p className="uppercase" style={{ fontSize: 11, letterSpacing: "0.2em", color: "#8a8a85" }}>{p.specialty}</p>
          <Statistic value={stat?.value ?? p.headline} color={primary} size={62} />
          <Divider color="#c9a96e" width={64} height={3} />
          <p className="line-clamp-4" style={{ fontSize: 15, lineHeight: 1.5, color: "#1a1a1a", maxWidth: "88%", marginTop: 4 }}>
            {stat?.rest || body}
          </p>
          {source && (
            <span
              className="uppercase font-semibold"
              style={{ fontSize: 9.5, letterSpacing: "0.08em", color: "#6b6b66", background: "#f1efe9", padding: "4px 10px", borderRadius: 20, marginTop: 6 }}
            >
              Source: {source}
            </span>
          )}
        </div>
        <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
        <div style={{ marginTop: 12 }}>
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

        <div className="flex items-start gap-2.5" style={{ marginTop: 16 }}>
          {p.brand.doctorPhoto ? (
            <img src={p.brand.doctorPhoto} alt="" className="rounded-full object-cover shrink-0" style={{ height: 40, width: 40 }} />
          ) : (
            <div className="rounded-full grid place-items-center shrink-0" style={{ height: 40, width: 40, background: `${primary}22`, color: primary }}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div
            className="rounded-2xl"
            style={{ background: primary, color: "#fff", padding: "10px 14px", borderRadius: "4px 16px 16px 16px" }}
          >
            <p className="line-clamp-3" style={{ fontSize: fitHeadline(15.5, question, 60), lineHeight: 1.35, fontWeight: 600 }}>{question}</p>
          </div>
        </div>

        <div
          className="flex-1 mt-3 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.94)", borderColor: "#e5e1d8", padding: "16px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}
        >
          <p className="line-clamp-6" style={{ fontSize: 13.5, lineHeight: 1.58, color: "#242422" }}>{p.content}</p>
          {p.brand.doctorName && (
            <p className="font-semibold" style={{ fontSize: 11, color: primary }}>
              — Dr. {p.brand.doctorName}{p.specialty ? `, ${p.specialty}` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
          <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
        </div>
        <div style={{ marginTop: 10 }}>
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
  return content.split(/\n|;/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
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
          className="font-bold"
          style={{ fontSize: fitHeadline(21, p.headline, 40), lineHeight: 1.25, color: "#1a1a1a", marginTop: 14, wordBreak: "break-word" }}
        >
          {p.headline}
        </p>

        <div className="flex-1 flex flex-col justify-center" style={{ gap: 10, marginTop: 12 }}>
          {tips.map((tip, i) => (
            <div key={i} className="flex items-center" style={{ gap: 11 }}>
              <span
                className="grid place-items-center rounded-full font-bold shrink-0"
                style={{ height: 22, width: 22, background: `${primary}1a`, color: primary, fontSize: 11.5 }}
              >
                {i + 1}
              </span>
              <p className="line-clamp-2" style={{ fontSize: 13, lineHeight: 1.4, color: "#242422", fontWeight: 500 }}>{tip}</p>
            </div>
          ))}
        </div>

        <TemplateCtaPill cta={p.cta} bg={primary} fg="#ffffff" />
        <div style={{ marginTop: 10 }}>
          <TemplateBrandFooter brand={p.brand} specialty={p.specialty} bg="#f1efe9" fg="#2a2a2a" />
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
];

/** Real lookup only -- an unknown key returns null (excluded, never guessed
 *  at), same philosophy as template-frames.tsx's getTemplateFrame(). Unlike
 *  getTemplateFrame(), this does NOT fall back to the first entry -- callers
 *  use a null result to fall through to the dynamic archetype engine instead. */
export function getPostTemplate(id: string | null | undefined) {
  return postTemplates.find((t) => t.id === id) ?? null;
}
