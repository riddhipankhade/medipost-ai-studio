/**
 * src/lib/template-generation-hints.ts
 *
 * Render_key-aware prompt guidance for Template Studio generations. Pure,
 * synchronous, no DB/network/package dependencies -- safe to import from
 * generate.functions.ts's request handler and from a standalone verification
 * script alike.
 *
 * Mechanism (see the approved implementation plan):
 *   selected template -> render_key -> RENDER_KEY_HINTS[render_key]
 *   -> its cluster(s) -> CLUSTER_BUILDERS[cluster.id](params) -> short text
 *   appended to (or, Polaroid Stack only, substituted for) the existing
 *   kind/category prompt in buildPrompt().
 *
 * render_key here is a PROMPT HINT ONLY. It must never be used for
 * authorization, entitlement, credit, or security decisions -- a missing or
 * unrecognized render_key (any plain Content Studio generation, any Group-A
 * template, a stale/unknown value) must produce the exact same guidance as
 * before this file existed: none.
 *
 * The 20 Group-A render_keys from the audit have no entry below -- that
 * absence, not a special case, is what keeps their generations byte-for-byte
 * unchanged (see buildRenderKeyGuidance()'s lookup-miss return of "").
 */

export type GenerationFormat = "template" | "single" | "carousel" | "story";

export type ClusterId =
  | "short-caption"
  | "tight-tip-line"
  | "override-caption-only"
  | "stat-citation"
  | "tight-headline"
  | "photo-primary-brief-copy"
  | "feature-labels"
  | "carousel-zone-budget"
  | "hard-headline-cap";

// ─── Cluster param shapes ────────────────────────────────────────────────

export type ShortCaptionParams = { minWords: number; maxWords: number };
export type TightTipLineParams = { maxWordsPerTip: number };
export type OverrideCaptionOnlyParams = { maxWords: number };
export type StatCitationParams = Record<string, never>;
export type TightHeadlineParams = { maxWords: number };
export type PhotoPrimaryBriefCopyParams = { maxSublineWords: number };
export type FeatureLabelsParams = { count: number; maxWords: number; style: "standard" | "compact" };
export type WordRange = { min: number; max: number };
export type CarouselZoneBudgetParams = { cover: WordRange; interior: WordRange; closing: WordRange };
export type HardHeadlineCapParams = { maxWords: number };

type ParamsFor<C extends ClusterId> =
  C extends "short-caption" ? ShortCaptionParams :
  C extends "tight-tip-line" ? TightTipLineParams :
  C extends "override-caption-only" ? OverrideCaptionOnlyParams :
  C extends "stat-citation" ? StatCitationParams :
  C extends "tight-headline" ? TightHeadlineParams :
  C extends "photo-primary-brief-copy" ? PhotoPrimaryBriefCopyParams :
  C extends "feature-labels" ? FeatureLabelsParams :
  C extends "carousel-zone-budget" ? CarouselZoneBudgetParams :
  C extends "hard-headline-cap" ? HardHeadlineCapParams :
  never;

// ─── Cluster 01 — short single-line caption, not a paragraph ───────────────
// blueprint-grid, certified-seal, swiss-grid-bold, editorial-column: the
// renderer clamps content to 1-3 lines; the generic kind/category default
// (60-100 words) overshoots every one of these boxes.
function shortCaption(p: ShortCaptionParams): string {
  return `RENDER-SPECIFIC LENGTH — this design shows "content" as a short caption, not a paragraph.
Keep "content" to ${p.minWords}-${p.maxWords} words, ONE crisp thought, no "\\n\\n" paragraph breaks.`;
}

// ─── Cluster 02 — tightened single-line tip cap ─────────────────────────────
// checklist-sidebar: category structure already gives \n-separated tips;
// this only tightens the per-tip word cap so each survives its single-line box.
function tightTipLine(p: TightTipLineParams): string {
  return `RENDER-SPECIFIC LENGTH — each tip renders on ONE line with no wrap.
Keep every tip in "content" to ${p.maxWordsPerTip} words or fewer (tighter than the general cap above).`;
}

// ─── Cluster 03 — override the category structure entirely ─────────────────
// polaroid-stack: this render_key's own category forces a tip checklist the
// renderer never shows (only a first-sentence caption is ever rendered).
function overrideCaptionOnly(p: OverrideCaptionOnlyParams): string {
  return `CONTENT STRUCTURE OVERRIDE — ignore any list/checklist structure implied above.
"content" MUST be exactly ONE short, evocative sentence (${p.maxWords} words or fewer), suitable as a
photo caption. No line breaks, no bullet points, no multiple sentences.`;
}

// ─── Cluster 04 — structured statistic + source citation ───────────────────
// stat-editorial: the supplied-statistic rule (verbatim, user-authored) is
// already enforced upstream in the shared base block -- this cluster is
// strictly additive and only asks for a parseable citation FORMAT so the
// renderer's source chip has something to extract. It never restates or
// loosens the no-invented-statistic rule itself.
function statCitation(_p: StatCitationParams): string {
  return `RENDER-SPECIFIC CITATION FORMAT — this design shows the source as a small citation chip parsed
from the end of "content". End "content" with the source in parentheses, e.g. "(WHO, 2023)" —
do not just mention the source in prose elsewhere. This is a formatting instruction only: the
statistic itself must still follow the SUPPLIED STATISTIC rule above exactly.`;
}

// ─── Cluster 05 — tight, question-friendly headline ─────────────────────────
// bold-ask, doctor-authority: the two narrowest headline columns of the 15
// Poster frames (tightest auto-shrink thresholds in the set).
function tightHeadline(p: TightHeadlineParams): string {
  return `RENDER-SPECIFIC LENGTH — this design's headline column is unusually narrow.
Keep "headline" to ${p.maxWords} words or fewer.`;
}

// ─── Cluster 06 — photo is the focal point, keep copy brief ────────────────
// arch-window, curve-card: the photo window shares flexible space with the
// text block, so a long subline visibly shrinks the photo.
function photoPrimaryBriefCopy(p: PhotoPrimaryBriefCopyParams): string {
  return `RENDER-SPECIFIC EMPHASIS — the photo is this design's focal point, not the copy.
Keep "subline" to ${p.maxSublineWords} words or fewer so the photo window stays the dominant element.`;
}

// ─── Cluster 07 — feature-label count & length by badge style ──────────────
// benefit-grid (standard, forgiving icon row) vs anatomy-callout (compact,
// no-wrap leader-line badges, only 3 slots even though the base prompt asks
// for exactly 4).
function featureLabels(p: FeatureLabelsParams): string {
  const styleNote = p.style === "compact"
    ? "These render as single-line, non-wrapping leader-line badges — a label that runs long will visibly overflow its badge."
    : "These render in a forgiving icon row that wraps up to two lines.";
  return `RENDER-SPECIFIC FEATURES — this design shows exactly ${p.count} feature labels, not 4.
Provide exactly ${p.count} labels, each ${p.maxWords} words or fewer. ${styleNote}`;
}

// ─── Cluster 08 — per-zone word budget within one carousel deck ────────────
// swiss-grid-deck (cover/closing tight, interior full) and frame-stack
// (interior tight, cover/closing full) -- same mechanism, opposite weighting,
// layered on top of carouselStructureFor()'s existing cover/interior/closing
// narrative, never replacing it.
function carouselZoneBudget(p: CarouselZoneBudgetParams): string {
  return `SLIDE-BY-SLIDE LENGTH (this deck's fixed visual system) — override the general per-slide word
count above with these per-position targets:
- Slide 1 (cover): "content" ≈ ${p.cover.min}-${p.cover.max} words
- Interior slides: "content" ≈ ${p.interior.min}-${p.interior.max} words
- Final slide (closing/CTA): "content" ≈ ${p.closing.min}-${p.closing.max} words`;
}

// ─── Cluster 09 — hard headline cap where no rendering safety net exists ───
// split-duotone (and any future Story render_key): Story templates don't
// uniformly use the shrink-to-fit helper every Poster/Post design relies on,
// so the prompt itself has to guarantee brevity.
function hardHeadlineCap(p: HardHeadlineCapParams): string {
  return `RENDER-SPECIFIC LENGTH — this design's headline has no auto-shrink or line-clamp safety net.
"headline" MUST be ${p.maxWords} words or fewer, one line, no exceptions.`;
}

const CLUSTER_BUILDERS: { [C in ClusterId]: (params: ParamsFor<C>) => string } = {
  "short-caption": shortCaption,
  "tight-tip-line": tightTipLine,
  "override-caption-only": overrideCaptionOnly,
  "stat-citation": statCitation,
  "tight-headline": tightHeadline,
  "photo-primary-brief-copy": photoPrimaryBriefCopy,
  "feature-labels": featureLabels,
  "carousel-zone-budget": carouselZoneBudget,
  "hard-headline-cap": hardHeadlineCap,
};

// ─── Render-key -> cluster/params registry ──────────────────────────────────

type ClusterRef = { [C in ClusterId]: { id: C; params: ParamsFor<C> } }[ClusterId];

export type RenderKeyHint = {
  format: GenerationFormat;
  /** Polaroid Stack only -- see overrideCaptionOnly(). When true, buildPrompt()
   *  substitutes this hint's guidance for the category structure text instead
   *  of appending after it. */
  overridesCategoryStructure?: true;
  clusters: ClusterRef[];
};

/**
 * Only the 15 render_keys the audit flagged (Groups B + C) appear here. The
 * 20 Group-A render_keys are deliberately absent -- see buildRenderKeyGuidance().
 */
export const RENDER_KEY_HINTS: Record<string, RenderKeyHint> = {
  // ── Poster (kind "template") ──
  "bold-ask": {
    format: "template",
    clusters: [{ id: "tight-headline", params: { maxWords: 5 } }],
  },
  "doctor-authority": {
    format: "template",
    clusters: [{ id: "tight-headline", params: { maxWords: 5 } }],
  },
  "arch-window": {
    format: "template",
    clusters: [{ id: "photo-primary-brief-copy", params: { maxSublineWords: 10 } }],
  },
  "curve-card": {
    format: "template",
    clusters: [{ id: "photo-primary-brief-copy", params: { maxSublineWords: 10 } }],
  },
  // Benefit Grid is deliberately NOT registered here. The audit classified it
  // Group A ("Full match -- exactly 4 is written for this design"): its base
  // template-kind prompt already asks for exactly 4 labels at 1-3 words, so a
  // feature-labels hint would only restate the existing instruction. Adding
  // one anyway would contradict "Group-A templates must receive no additional
  // prompt guidance" for zero behavioral gain -- Anatomy Callout below is the
  // genuine Group-B case this cluster exists for (3 labels, not 4; no-wrap
  // badges need a tighter word cap the base prompt doesn't specify).
  "anatomy-callout": {
    format: "template",
    clusters: [{ id: "feature-labels", params: { count: 3, maxWords: 2, style: "compact" } }],
  },

  // ── Post (kind "single") ──
  "blueprint-grid": {
    format: "single",
    clusters: [{ id: "short-caption", params: { minWords: 15, maxWords: 22 } }],
  },
  "certified-seal": {
    format: "single",
    clusters: [{ id: "short-caption", params: { minWords: 30, maxWords: 40 } }],
  },
  "swiss-grid-bold": {
    format: "single",
    clusters: [{ id: "short-caption", params: { minWords: 15, maxWords: 20 } }],
  },
  "editorial-column": {
    format: "single",
    clusters: [{ id: "short-caption", params: { minWords: 50, maxWords: 60 } }],
  },
  "checklist-sidebar": {
    format: "single",
    clusters: [{ id: "tight-tip-line", params: { maxWordsPerTip: 8 } }],
  },
  "polaroid-stack": {
    format: "single",
    overridesCategoryStructure: true,
    clusters: [{ id: "override-caption-only", params: { maxWords: 12 } }],
  },
  "stat-editorial": {
    format: "single",
    clusters: [{ id: "stat-citation", params: {} }],
  },

  // ── Carousel ──
  "swiss-grid-deck": {
    format: "carousel",
    clusters: [{
      id: "carousel-zone-budget",
      params: { cover: { min: 12, max: 18 }, interior: { min: 22, max: 32 }, closing: { min: 12, max: 20 } },
    }],
  },
  "frame-stack": {
    format: "carousel",
    clusters: [{
      id: "carousel-zone-budget",
      params: { cover: { min: 20, max: 35 }, interior: { min: 8, max: 12 }, closing: { min: 20, max: 35 } },
    }],
  },

  // ── Story ──
  "split-duotone": {
    format: "story",
    clusters: [{ id: "hard-headline-cap", params: { maxWords: 6 } }],
  },
};

/**
 * Looks up `renderKey` and, if it resolves to an entry whose `format` matches
 * the caller's, concatenates its clusters' guidance text. Returns "" for a
 * missing/unrecognized renderKey or a format mismatch -- the exact same
 * prompt output as before this mechanism existed. Never throws: a bad or
 * stale renderKey degrades to "no hint", not a failed generation.
 */
export function buildRenderKeyGuidance(
  renderKey: string | null | undefined,
  format: GenerationFormat,
): string {
  if (!renderKey) return "";
  const hint = RENDER_KEY_HINTS[renderKey];
  if (!hint || hint.format !== format) return "";
  return hint.clusters
    .map((c) => CLUSTER_BUILDERS[c.id](c.params as never))
    .join("\n\n");
}

/** Whether `renderKey` is registered with `overridesCategoryStructure` for
 *  `format` -- buildPrompt()'s `single` case uses this to decide whether to
 *  substitute (Polaroid Stack) or append (everything else) its guidance. */
export function rendererOverridesCategoryStructure(
  renderKey: string | null | undefined,
  format: GenerationFormat,
): boolean {
  if (!renderKey) return false;
  const hint = RENDER_KEY_HINTS[renderKey];
  return !!hint && hint.format === format && !!hint.overridesCategoryStructure;
}
