import { z } from "zod";
import type { BrandKit } from "@/lib/brand-kit";
import type { ContentCategory } from "@/lib/mock-data";
import { carouselThemes, fontFamilies, slideLayouts, getTheme, suggestThemeId, type SlideLayout, type CarouselTheme } from "@/lib/carousel-themes";
import { compositionRules, type Composition } from "@/lib/design-tokens";
import { resolveSinglePostStrategy, resolveVisualStrategy } from "@/lib/visual-strategy";
import { templateFrames, type TemplateFrameId } from "@/components/template-frames";
import type { GenerateOutput } from "@/lib/api/generate.functions";

/**
 * Frozen Studio customization: the single source of truth for turning a
 * user's theme/color/layout/frame CHOICES into final render props, called
 * identically by the Studio (live state), Content History (persisted state,
 * or these same defaults for older rows), and every download/share capture
 * (which just captures whatever the shared renderer already drew).
 *
 * Design rule: knobs are persisted, not resolved CSS — `useBrandColors:true`
 * bakes the CURRENT brand-kit color into the render every time it's resolved,
 * so editing the Brand Kit later still updates old posts (by design). The one
 * exception is `strategy`/`slides` (layout archetype + composition): those
 * depend only on immutable content + category, never on live state, so they
 * are frozen as resolved output — protecting old posts from silently
 * reshuffling if the archetype-selection algorithm changes later.
 */

export const CUSTOMIZATION_VERSION = 1 as const; // payload shape — how to PARSE the JSON
export const RENDER_ENGINE = "v1" as const;       // which resolver/component set produced it — which CODE PATH renders it

// ── narrow validators, derived from the live source arrays so they can never
// drift out of sync with the actual set of themes/fonts/layouts/frames ──────

const ThemeId = z.custom<string>((v) => typeof v === "string" && carouselThemes.some((t) => t.id === v), { message: "Unknown themeId" });
const FontFamilyId = z.custom<string>((v) => typeof v === "string" && fontFamilies.some((f) => f.id === v), { message: "Unknown fontFamily" });
const SlideLayoutId = z.custom<SlideLayout>((v) => typeof v === "string" && slideLayouts.some((l) => l.id === v), { message: "Unknown layout" });
const CompositionId = z.custom<Composition>((v) => typeof v === "string" && v in compositionRules, { message: "Unknown composition" });
const TemplateFrameIdSchema = z.custom<TemplateFrameId>((v) => typeof v === "string" && templateFrames.some((f) => f.id === v), { message: "Unknown frameId" });
const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a 6-digit hex color");

const SlideStrategySnapshot = z.object({ layout: SlideLayoutId, composition: CompositionId });

const ThemeKnobsSchema = z.object({
  themeId: ThemeId,
  useBrandColors: z.boolean(),
  headingColor: HexColor.nullable(),
  textColor: HexColor.nullable(),
  accentColor: HexColor.nullable(),
  fontFamily: FontFamilyId,
  fontScale: z.number().min(0.8).max(1.4),
  showIcons: z.boolean(),
});
export type ThemeKnobs = z.infer<typeof ThemeKnobsSchema>;

// every kind's payload shares these two envelope tags
const Envelope = { v: z.literal(CUSTOMIZATION_VERSION), engine: z.literal(RENDER_ENGINE) };

export const SingleCustomizationSchema = z.object({
  ...Envelope, kind: z.literal("single"),
  theme: ThemeKnobsSchema, strategy: SlideStrategySnapshot, autoLayout: z.boolean(),
});
export const CarouselCustomizationSchema = z.object({
  ...Envelope, kind: z.literal("carousel"),
  theme: ThemeKnobsSchema, autoLayout: z.boolean(),
  slides: z.array(SlideStrategySnapshot).max(20),
});
export const FestiveCustomizationSchema = z.object({
  ...Envelope, kind: z.literal("festive"),
  useBrandColors: z.boolean(),
  frameColor: HexColor.nullable(), glowColor: HexColor.nullable(),
  accentColor: HexColor.nullable(), contactBgColor: HexColor.nullable(),
});
export const TemplateCustomizationSchema = z.object({
  ...Envelope, kind: z.literal("template"),
  frameId: TemplateFrameIdSchema, useBrandColors: z.boolean(),
  primaryColor: HexColor.nullable(), secondaryColor: HexColor.nullable(),
  // Photo reposition/zoom within the frame's fixed photo window — lets the
  // user recover a subject that the default "50% 12%" crop cut off. Optional
  // so older persisted rows (saved before this field existed) still parse.
  imageOffsetX: z.number().min(0).max(100).optional(),
  imageOffsetY: z.number().min(0).max(100).optional(),
  imageZoom: z.number().min(1).max(2.5).optional(),
});
export const StoryCustomizationSchema    = z.object({ ...Envelope, kind: z.literal("story") });
export const ReelCustomizationSchema     = z.object({ ...Envelope, kind: z.literal("reel") });
export const CampaignCustomizationSchema = z.object({ ...Envelope, kind: z.literal("campaign") });

export const PostCustomizationSchema = z.discriminatedUnion("kind", [
  SingleCustomizationSchema,
  CarouselCustomizationSchema,
  FestiveCustomizationSchema,
  TemplateCustomizationSchema,
  StoryCustomizationSchema,
  ReelCustomizationSchema,
  CampaignCustomizationSchema,
]);
export type PostCustomization = z.infer<typeof PostCustomizationSchema>;
export type SingleCustomization = z.infer<typeof SingleCustomizationSchema>;
export type CarouselCustomization = z.infer<typeof CarouselCustomizationSchema>;
export type FestiveCustomization = z.infer<typeof FestiveCustomizationSchema>;
export type TemplateCustomization = z.infer<typeof TemplateCustomizationSchema>;

/** Parses `raw` (whatever the DB's jsonb column holds) and returns it only if valid AND matching `kind`; otherwise null so the caller can fall back to computed defaults. Never throws. */
export function parseCustomization<K extends PostCustomization["kind"]>(
  raw: unknown,
  kind: K,
): Extract<PostCustomization, { kind: K }> | null {
  if (raw == null) return null;
  const parsed = PostCustomizationSchema.safeParse(raw);
  if (!parsed.success || parsed.data.kind !== kind) return null;
  return parsed.data as Extract<PostCustomization, { kind: K }>;
}

// ── shared resolution functions: the single source of truth for knobs -> render props ──

// Matches SlideCanvasProps["theme"] exactly (CarouselTheme & {fontFamily}) so
// resolveTheme's output can be spread straight into SlideCanvas with no adapter.
export type ResolvedTheme = CarouselTheme & { fontFamily: string };

/** Identical to the formula previously duplicated in SinglePostPreview and CarouselPreview. */
export function resolveTheme(knobs: ThemeKnobs, brand: BrandKit): ResolvedTheme {
  const baseTheme = getTheme(knobs.themeId);
  return {
    ...baseTheme,
    bg: knobs.useBrandColors ? `linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.secondaryColor} 100%)` : baseTheme.bg,
    heading: knobs.headingColor || baseTheme.heading,
    text: knobs.textColor || baseTheme.text,
    accent: knobs.accentColor || (knobs.useBrandColors ? brand.primaryColor : baseTheme.accent),
    fontFamily: knobs.fontFamily,
  };
}

export function resolveFestiveColors(
  knobs: Pick<FestiveCustomization, "useBrandColors" | "frameColor" | "glowColor" | "accentColor" | "contactBgColor">,
  brand: BrandKit,
  palette: string[],
) {
  return {
    frame: knobs.frameColor ?? ((knobs.useBrandColors && brand.primaryColor) || palette[0] || "#0E7C7B"),
    glow: knobs.glowColor ?? (palette[1] || "#f4b400"),
    accent: knobs.accentColor ?? ((knobs.useBrandColors && brand.secondaryColor) || palette[2] || "#0a3d62"),
    contactBg: knobs.contactBgColor ?? "#ffffff",
  };
}

export function resolveTemplateColors(
  knobs: Pick<TemplateCustomization, "useBrandColors" | "primaryColor" | "secondaryColor">,
  brand: BrandKit,
  palette: string[],
) {
  return {
    primary: knobs.primaryColor ?? ((knobs.useBrandColors ? brand.primaryColor : "") || palette[0] || "#0E7C7B"),
    secondary: knobs.secondaryColor ?? ((knobs.useBrandColors ? brand.secondaryColor : "") || palette[1] || "#134e4a"),
  };
}

// ── defaults: the fallback for null/invalid rows, and Studio's own initial state ──

export function defaultThemeKnobs(specialty: string): ThemeKnobs {
  const themeId = suggestThemeId(specialty);
  return {
    themeId, useBrandColors: true,
    headingColor: null, textColor: null, accentColor: null,
    fontFamily: getTheme(themeId).fontFamily,
    fontScale: 1, showIcons: true,
  };
}

export function defaultSingleCustomization(
  post: { headline: string; content: string },
  category: ContentCategory,
  specialty: string,
): SingleCustomization {
  const strategy = resolveSinglePostStrategy(post, category);
  return {
    v: CUSTOMIZATION_VERSION, engine: RENDER_ENGINE, kind: "single",
    theme: defaultThemeKnobs(specialty),
    strategy: { layout: strategy.archetype, composition: strategy.composition },
    autoLayout: true,
  };
}

export function defaultCarouselCustomization(
  post: { slides: { title: string; content: string }[] },
  category: ContentCategory,
  specialty: string,
): CarouselCustomization {
  const total = post.slides.length;
  const slides = post.slides.map((s, i) => {
    const st = resolveVisualStrategy(s, category, { slideIndex: i, totalSlides: total, isCta: i === total - 1 });
    return { layout: st.archetype, composition: st.composition };
  });
  return {
    v: CUSTOMIZATION_VERSION, engine: RENDER_ENGINE, kind: "carousel",
    theme: defaultThemeKnobs(specialty), autoLayout: true, slides,
  };
}

export function defaultFestiveCustomization(): FestiveCustomization {
  return {
    v: CUSTOMIZATION_VERSION, engine: RENDER_ENGINE, kind: "festive",
    useBrandColors: true, frameColor: null, glowColor: null, accentColor: null, contactBgColor: null,
  };
}

export const DEFAULT_TEMPLATE_IMAGE_OFFSET = { x: 50, y: 12, zoom: 1 } as const;

export function defaultTemplateCustomization(): TemplateCustomization {
  return {
    v: CUSTOMIZATION_VERSION, engine: RENDER_ENGINE, kind: "template",
    frameId: "clinic-classic", useBrandColors: true, primaryColor: null, secondaryColor: null,
    imageOffsetX: DEFAULT_TEMPLATE_IMAGE_OFFSET.x, imageOffsetY: DEFAULT_TEMPLATE_IMAGE_OFFSET.y, imageZoom: DEFAULT_TEMPLATE_IMAGE_OFFSET.zoom,
  };
}

export function defaultStoryCustomization(): z.infer<typeof StoryCustomizationSchema> {
  return { v: CUSTOMIZATION_VERSION, engine: RENDER_ENGINE, kind: "story" };
}
export function defaultReelCustomization(): z.infer<typeof ReelCustomizationSchema> {
  return { v: CUSTOMIZATION_VERSION, engine: RENDER_ENGINE, kind: "reel" };
}
export function defaultCampaignCustomization(): z.infer<typeof CampaignCustomizationSchema> {
  return { v: CUSTOMIZATION_VERSION, engine: RENDER_ENGINE, kind: "campaign" };
}

/** Server-side seed: computes the right default for whatever kind was just generated, used to write a valid `customization` in the SAME insert that creates the row (closes the creation-race window — see plan). */
export function defaultCustomizationFor(
  result: GenerateOutput,
  category: ContentCategory,
  specialty: string,
): PostCustomization {
  switch (result.kind) {
    case "single":   return defaultSingleCustomization(result, category, specialty);
    case "carousel": return defaultCarouselCustomization(result, category, specialty);
    case "festive":  return defaultFestiveCustomization();
    case "template": return defaultTemplateCustomization();
    case "story":    return defaultStoryCustomization();
    case "reel":     return defaultReelCustomization();
    case "campaign": return defaultCampaignCustomization();
  }
}
