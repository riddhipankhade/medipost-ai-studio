/**
 * src/lib/design-tokens.ts
 *
 * Shared visual language for the new content-driven layout archetypes
 * (StatisticHero, IconGrid, ComparisonSplit, ProcessFlow, CalloutDiagram, HeroCard, …).
 *
 * The 5 pre-existing carousel layouts (centered/image-left/full-image/split/modern-card)
 * do NOT consume these tokens — they keep their original hand-tuned values so nothing
 * already shipping changes. Tokens here exist so the *new* archetypes read as one
 * cohesive system instead of N bespoke designs.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY — scaled by the existing per-slide `fontScale` multiplier
// ─────────────────────────────────────────────────────────────────────────────

export const typeScale = {
  heroTitle:      { size: 30, weight: 800, lineHeight: 1.08 },
  sectionHeading: { size: 20, weight: 700, lineHeight: 1.15 },
  itemLabel:      { size: 14, weight: 700, lineHeight: 1.2 },
  body:           { size: 13.5, weight: 400, lineHeight: 1.5 },
  caption:        { size: 10.5, weight: 600, lineHeight: 1.3 },
  cta:            { size: 13, weight: 700, lineHeight: 1.2 },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SPACING — px, at the canvas's native 1080×1080 conceptual scale (rendered ~1:3)
// ─────────────────────────────────────────────────────────────────────────────

export const spacing = {
  outerPadding: 22, // matches existing layouts' `p-5`/`p-6`
  cardGap:      14,
  itemGap:      10,
  sectionGap:   18,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const shadow = {
  soft:   "0 4px 20px rgba(0,0,0,0.12)",
  card:   "0 8px 30px rgba(0,0,0,0.16)",
  floating: "0 12px 40px rgba(0,0,0,0.20)",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ILLUSTRATION STYLE — consumed by src/components/illustrations/*
// ─────────────────────────────────────────────────────────────────────────────

export const illustrationStyle = {
  strokeWidth: 1.75,
  /** illustrations use at most: 1 line color + 1 fill tint (from theme.accent) + white */
  maxColors: 2,
  cornerStyle: "rounded" as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITION — controls focal point / density / reading direction per archetype
// Produced by resolveComposition() in visual-strategy.ts, consumed by layouts.
// ─────────────────────────────────────────────────────────────────────────────

export type Composition =
  | "hero-left"
  | "hero-center"
  | "balanced"
  | "poster"
  | "infographic"
  | "split-focus";

export type CompositionRules = {
  /** where the illustration sits relative to text */
  illustrationPlacement: "left" | "right" | "top" | "behind" | "center";
  /** overall text volume allowance */
  density: "low" | "medium";
  /** reading order for the layout's internal flow */
  readingDirection: "top-down" | "left-right";
  /** how large/prominent the illustration is, 0-1 */
  illustrationEmphasis: number;
  /** whitespace multiplier applied to spacing.* tokens */
  whitespace: number;
};

export const compositionRules: Record<Composition, CompositionRules> = {
  "hero-left":   { illustrationPlacement: "left",   density: "medium", readingDirection: "left-right", illustrationEmphasis: 0.55, whitespace: 1.0 },
  "hero-center": { illustrationPlacement: "center",  density: "low",    readingDirection: "top-down",   illustrationEmphasis: 0.7,  whitespace: 1.15 },
  "balanced":    { illustrationPlacement: "top",     density: "medium", readingDirection: "top-down",   illustrationEmphasis: 0.45, whitespace: 1.0 },
  "poster":      { illustrationPlacement: "behind",  density: "low",    readingDirection: "top-down",   illustrationEmphasis: 0.85, whitespace: 1.3 },
  "infographic": { illustrationPlacement: "top",     density: "medium", readingDirection: "top-down",   illustrationEmphasis: 0.4,  whitespace: 0.9 },
  "split-focus": { illustrationPlacement: "right",   density: "medium", readingDirection: "left-right", illustrationEmphasis: 0.5,  whitespace: 1.0 },
};

export function getComposition(c: Composition): CompositionRules {
  return compositionRules[c];
}
