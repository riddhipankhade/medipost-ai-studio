/**
 * src/lib/visual-strategy.ts
 *
 * Pipeline: Generated Content -> Relationship Detection -> Visual Strategy
 *           -> Composition -> Illustration -> Layout -> Renderer
 *
 * inferRelationship() is the primary, deterministic, model-agnostic source of
 * truth for what a slide "is" structurally. A model-returned `relationship`
 * hint (if present on the slide) is only ever used as a tie-breaker — it is
 * never required, so old generated_text rows with no such field behave
 * identically to new ones.
 */

import type { ContentCategory } from "@/lib/mock-data";
import type { Composition } from "@/lib/design-tokens";

export type Relationship =
  | "single"
  | "list"
  | "checklist"
  | "sequence"
  | "timeline"
  | "cause-effect"
  | "comparison"
  | "hierarchy"
  | "statistic"
  | "faq";

export type LayoutArchetype =
  | "hero-card"
  | "icon-grid"
  | "statistic-hero"
  | "comparison-split"
  | "process-flow"
  | "callout-diagram"
  | "timeline"
  | "faq-card"
  | "checklist"
  | "radial-diagram";

export type Emphasis = "educational" | "emergency" | "promotional";

export type SlideLike = {
  title: string;
  content: string;
  /** optional model-provided hint — used only as a tie-breaker, never required */
  relationship?: string;
};

export type SlideContext = {
  slideIndex: number;
  totalSlides: number;
  isCta: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1 — deterministic relationship classifier
// ─────────────────────────────────────────────────────────────────────────────

const STAT_PATTERN      = /(^|\s)(\d{1,3}(\.\d+)?\s?%|\d+\s?(x|times)\b|\d+\s?(out of|in)\s?\d+|\bhalf of\b|\bone in \d+\b)/i;
const COMPARISON_WORDS  = /\bvs\.?\b|\binstead of\b|\brather than\b|\bmyth\b.*\bfact\b|\bfact\b.*\bmyth\b|\bversus\b/i;
const SEQUENCE_PATTERN  = /^\s*(step\s?\d+|stage\s?\d+|\d+\s?[.)-])/i;
const TIMELINE_WORDS    = /\b(day\s?\d+|week\s?\d+|month\s?\d+|year\s?\d+|before|after|timeline|recovery period|follow-?up)\b/i;
const WARNING_WORDS     = /\b(warning|red flag|see a doctor|emergency|urgent|danger|don'?t ignore|call 911|seek help immediately)\b/i;
const HIERARCHY_WORDS   = /\b(types? of|categories|levels of|kinds of|classifications?)\b/i;
const QUESTION_PATTERN  = /\?\s*$/;
const IMPERATIVE_LIST_WORDS = /\b(do this|avoid|don'?t|always|never|remember to)\b/i;

/** splits free text into discrete items on line breaks, semicolons, or "word, Word" boundaries */
export function splitContentItems(text: string): string[] {
  return text
    .split(/\n|;|(?<=[a-z0-9])\s*,\s*(?=[A-Z0-9])/)
    .map((s) => s.trim().replace(/^[-•*\d.)\s]+/, ""))
    .filter(Boolean);
}

/** counts comma/semicolon/line-break separated items in free text */
function itemCount(text: string): number {
  return splitContentItems(text).length;
}

/**
 * Layout-facing splitter: item-based archetypes (grids, flows, diagrams) call
 * this instead of splitContentItems so a single prose paragraph still breaks
 * into sentence-sized items rather than one oversized chip. Kept separate from
 * splitContentItems so relationship classification (itemCount) is unaffected.
 */
export function splitContentItemsForLayout(text: string): string[] {
  const items = splitContentItems(text);
  if (items.length >= 2) return items;
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length >= 2) return sentences;
  return items.length ? items : [text.trim()].filter(Boolean);
}

/** Extracts a leading statistic (e.g. "40%", "1 in 3", "2x") and the remaining label text, if any. */
export function extractStatistic(text: string): { value: string; label: string } | null {
  const m = text.match(STAT_PATTERN);
  if (!m) return null;
  const value = m[2].trim();
  const label = text.replace(m[0], "").trim().replace(/^[,.\-–—\s]+/, "");
  return { value, label: label || text };
}

export function inferRelationship(
  slide: SlideLike,
  category: ContentCategory,
  ctx?: Partial<SlideContext>,
): Relationship {
  const title = slide.title ?? "";
  const content = slide.content ?? "";
  const text = `${title} ${content}`;

  // Category priors for the hook/CTA slides — these are structurally always
  // a single message regardless of body wording.
  const isEdgeSlide = ctx?.slideIndex === 0 || ctx?.isCta;

  if (QUESTION_PATTERN.test(title) || category === "patient-faq") return "faq";
  if (STAT_PATTERN.test(text)) return "statistic";
  if (COMPARISON_WORDS.test(text)) return "comparison";
  if (WARNING_WORDS.test(text) || category === "warning-signs") return "cause-effect";
  if (SEQUENCE_PATTERN.test(title)) return "sequence";
  if (TIMELINE_WORDS.test(text)) return "timeline";
  if (HIERARCHY_WORDS.test(text)) return "hierarchy";

  const items = itemCount(content);
  if (!isEdgeSlide && items >= 3) {
    if (IMPERATIVE_LIST_WORDS.test(text) || category === "prevention") return "checklist";
    if (category === "health-tips" || category === "awareness") return "list";
    return "list";
  }

  // Model-provided hint used only as a last-resort tie-breaker.
  const hinted = slide.relationship as Relationship | undefined;
  const known: Relationship[] = [
    "single", "list", "checklist", "sequence", "timeline",
    "cause-effect", "comparison", "hierarchy", "statistic", "faq",
  ];
  if (hinted && known.includes(hinted)) return hinted;

  return "single";
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2 — visual strategy: relationship (+category) -> archetype -> composition
// ─────────────────────────────────────────────────────────────────────────────

const ARCHETYPE_BY_RELATIONSHIP: Record<Relationship, LayoutArchetype> = {
  single:       "hero-card",
  list:         "icon-grid",
  checklist:    "checklist",
  sequence:     "process-flow",
  timeline:     "timeline",
  "cause-effect": "callout-diagram",
  comparison:   "comparison-split",
  hierarchy:    "radial-diagram",
  statistic:    "statistic-hero",
  faq:          "faq-card",
};

export function resolveArchetype(relationship: Relationship): LayoutArchetype {
  return ARCHETYPE_BY_RELATIONSHIP[relationship];
}

const EMERGENCY_CATEGORIES: ContentCategory[] = ["warning-signs"];
const PROMOTIONAL_CATEGORIES: ContentCategory[] = ["clinic-promo", "awareness"];

export function resolveEmphasis(category: ContentCategory): Emphasis {
  if (EMERGENCY_CATEGORIES.includes(category)) return "emergency";
  if (PROMOTIONAL_CATEGORIES.includes(category)) return "promotional";
  return "educational";
}

export function resolveComposition(archetype: LayoutArchetype, category: ContentCategory): Composition {
  const emphasis = resolveEmphasis(category);
  if (emphasis === "emergency") return "poster";

  switch (archetype) {
    case "statistic-hero":  return "poster";
    case "hero-card":       return emphasis === "promotional" ? "hero-center" : "hero-left";
    case "icon-grid":       return "infographic";
    case "checklist":       return "infographic";
    case "process-flow":    return "balanced";
    case "timeline":        return "balanced";
    case "comparison-split": return "split-focus";
    case "callout-diagram": return "poster";
    case "faq-card":        return "balanced";
    case "radial-diagram":  return "hero-center";
    default:                return "balanced";
  }
}

/** Convenience: full pipeline from raw slide -> archetype + composition + emphasis. */
export function resolveVisualStrategy(
  slide: SlideLike,
  category: ContentCategory,
  ctx?: Partial<SlideContext>,
) {
  const relationship = inferRelationship(slide, category, ctx);
  const archetype = resolveArchetype(relationship);
  const composition = resolveComposition(archetype, category);
  const emphasis = resolveEmphasis(category);
  return { relationship, archetype, composition, emphasis };
}
