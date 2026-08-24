import { z } from "zod";
import type { TemplatePost } from "@/lib/api/generate.functions";

/**
 * Validation for AI-generated `template` (poster-style) content, closing the
 * coercion-not-validation gap in generate.functions.ts's normalize(). Scoped
 * deliberately to the `template` kind only -- the other six kinds keep their
 * existing, working coercion behavior unchanged.
 *
 * Two-stage design:
 *  1. sanitizeTemplateContent() -- deterministic cleanup (trim, cap length,
 *     cap array size, drop invalid array entries). Never throws, never
 *     rejects a generation over content that's merely too long or slightly
 *     messy -- matches the app's existing "hide gracefully" philosophy
 *     (e.g. Brand Kit's empty-field handling) rather than treating
 *     "excessive text" as a hard failure.
 *  2. TemplateGeneratedContentSchema.parse() -- structural validation only,
 *     against the sanitized value. Only genuinely missing/empty REQUIRED
 *     fields (headline, visual.imagePrompt) throw here -- everything else is
 *     optional-or-gracefully-hidden downstream, matching TemplateFrameProps'
 *     own optionality (src/components/template-frames.tsx: only `headline`
 *     is a required prop; subline/cta/logo/image are all optional).
 */

const MAX = {
  headline: 100, // prompt asks 3-6 words (~20-40 chars); generous cap catches runaway output, not creative variance
  subline: 220, // prompt asks 8-16 words total
  cta: 60, // prompt asks 2-4 words
  caption: 500,
  hashtag: 40,
  hashtagCount: 15,
  feature: 28, // prompt asks 1-3 words
  featureCount: 4,
  visualText: 300, // concept / style / layout / composition
  visualStyle: 60,
  imagePrompt: 1500, // prompt asks 60-120 words (~500-800 chars); generous cap
} as const;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max).trim() : t;
}

/** Deterministic cleanup -- never throws, never rejects. */
export function sanitizeTemplateContent(raw: TemplatePost): TemplatePost {
  return {
    kind: "template",
    headline: truncate(raw?.headline ?? "", MAX.headline),
    subline: truncate(raw?.subline ?? "", MAX.subline),
    cta: truncate(raw?.cta ?? "", MAX.cta),
    caption: truncate(raw?.caption ?? "", MAX.caption),
    hashtags: (Array.isArray(raw?.hashtags) ? raw.hashtags : [])
      .filter((h): h is string => typeof h === "string" && h.trim().length > 0)
      .slice(0, MAX.hashtagCount)
      .map((h) => truncate(h, MAX.hashtag)),
    features: (Array.isArray(raw?.features) ? raw.features : [])
      .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
      .slice(0, MAX.featureCount)
      .map((f) => truncate(f, MAX.feature)),
    visual: {
      concept: truncate(raw?.visual?.concept ?? "", MAX.visualText),
      colors: (Array.isArray(raw?.visual?.colors) ? raw.visual.colors : [])
        .filter((c): c is string => typeof c === "string" && HEX_COLOR.test(c))
        .slice(0, 6),
      style: truncate(raw?.visual?.style ?? "", MAX.visualText),
      layout: truncate(raw?.visual?.layout ?? "", MAX.visualText),
      visualStyle: truncate(raw?.visual?.visualStyle ?? "", MAX.visualStyle),
      composition: truncate(raw?.visual?.composition ?? "", MAX.visualText),
      imagePrompt: truncate(raw?.visual?.imagePrompt ?? "", MAX.imagePrompt),
    },
  };
}

const TemplateVisualSchema = z.object({
  concept: z.string(),
  colors: z.array(z.string().regex(HEX_COLOR)),
  style: z.string(),
  layout: z.string(),
  // Not a strict enum: an unrecognized visualStyle already degrades
  // gracefully downstream (STYLE_DIRECTIVES[visualStyle] ?? "" in
  // generate.functions.ts' generateImage), so rejecting the whole
  // generation over a label mismatch would be stricter than the
  // consequence of that mismatch actually warrants.
  visualStyle: z.string(),
  composition: z.string(),
  // The one field in `visual` that's load-bearing: without a real image
  // prompt, the template's photo window has nothing to generate against.
  imagePrompt: z.string().trim().min(1, "visual.imagePrompt is required"),
});

export const TemplateGeneratedContentSchema = z.object({
  kind: z.literal("template"),
  // The one required text field: TemplateFrameProps.headline is the only
  // non-optional prop across all 10 template frames.
  headline: z.string().trim().min(1, "headline is required"),
  subline: z.string(),
  cta: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  // Optional per-frame content -- most frames ignore it (see TemplatePost's
  // comment); never required, so a frame without a feature-row slot never
  // depends on the model producing anything here.
  features: z.array(z.string()),
  visual: TemplateVisualSchema,
});

/**
 * Sanitizes then structurally validates a `template`-kind generation.
 * Throws only if a required field (headline, visual.imagePrompt) is missing
 * or empty after sanitization -- the caller (generateContent) treats that as
 * retry-worthy rather than shipping a visibly broken creative.
 */
export function validateTemplateContent(raw: TemplatePost): TemplatePost {
  const sanitized = sanitizeTemplateContent(raw);
  return TemplateGeneratedContentSchema.parse(sanitized) as TemplatePost;
}
