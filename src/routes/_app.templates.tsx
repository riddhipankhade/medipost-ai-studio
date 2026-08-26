import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search, Heart, Crown, Sparkles, LayoutTemplate, ChevronLeft, ChevronRight,
  ArrowLeft, Loader2, Upload, ImageDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useBrandKit, fileToDataUrl } from "@/lib/brand-kit";
import type { BrandKit } from "@/lib/brand-kit";
import { contentCategories, workflows, type ContentCategory, type WorkflowKind } from "@/lib/mock-data";
import { SpecialtySelect } from "@/components/specialty-select";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";
import {
  templateFrames,
  getTemplateFrame,
  TEMPLATE_SAMPLES,
  type TemplateFrameId,
} from "@/components/template-frames";
import {
  ExactScalePreview,
  CreativeActions,
  AiImageButton,
  PreviewToolbar,
  CreativePreviewDialog,
  useAiImage,
  ImageLoadingOverlay,
  SectionBlock,
  MiniColor,
  PhotoAdjustPanel,
  savePng,
  CREATIVE_DESIGN_WIDTH,
} from "@/routes/_app.generate";
import { getPostTemplate } from "@/components/post-templates";
import { getCarouselTemplate } from "@/components/carousel-templates";
import { getStoryTemplate } from "@/components/story-templates";
import {
  POST_SAMPLES,
  CAROUSEL_SAMPLES,
  STORY_SAMPLES,
  type PostSample,
  type CarouselSample,
  type StorySample,
} from "@/lib/template-catalog-samples";
import { generateContent, type TemplatePost } from "@/lib/api/generate.functions";
import {
  resolveTemplateColors, DEFAULT_TEMPLATE_IMAGE_OFFSET, type TemplateCustomization,
} from "@/lib/post-customization";
import { usePersistCustomization } from "@/hooks/usePersistCustomization";
import { fetchStudioSessionRow } from "@/lib/studio-session";
import { RemoveWatermarkRow } from "@/components/Watermark";
import { ShareButtons } from "@/components/ShareButtons";
import { isExportableNode } from "@/lib/export-filter";
import { useIsPro, useGrowthTrialEligible } from "@/lib/use-subscription";
import { growthHeadline, growthButtonLabel } from "@/lib/growth-trial-copy";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Template Studio — Medipost AI" }] }),
  // Poster-only in-place workflow (Phase 1): `templateId` identifies the
  // selected catalog row, `rowId` identifies a completed generation
  // (`content_generations.id`) once one exists. Both optional/loose-typed
  // here, same convention _app.generate.tsx's own validateSearch uses --
  // real validation (does templateId resolve to a published Poster row?)
  // happens in the component, against the already-loaded catalog. Post/
  // Carousel/Story templates do NOT use these params in this phase -- their
  // "Use Template" still navigates to /generate exactly as before.
  validateSearch: (search: Record<string, unknown>): { templateId?: string; rowId?: string } => ({
    templateId: typeof search.templateId === "string" ? search.templateId : undefined,
    rowId:      typeof search.rowId === "string" ? search.rowId : undefined,
  }),
  component: TemplateStudioPage,
});

// ─── Catalog row + safe render_key -> component resolution ─────────────────
// render_key is never used to dynamically import or eval anything — it's a
// plain string looked up against the static, code-defined `templateFrames`
// array (same allowlist src/components/template-frames.tsx already exports).
// A row whose render_key doesn't match a known frame is excluded from the
// grid entirely (not silently mis-rendered as some other template) — see the
// filter in `resolvedTemplates` below.

type TemplateRow = {
  id: string;
  // Real, code-owned lookup key once a format's bespoke renderer registry
  // exists (Poster: templateFrames.tsx, Post: post-templates.tsx, Carousel:
  // carousel-templates.tsx, Story: story-templates.tsx). NULL means this
  // row's bespoke design hasn't shipped yet — see migration 20240001000016.
  render_key: string | null;
  name: string;
  description: string | null;
  category: ContentCategory;
  specialty_tags: string[];
  format: WorkflowKind;
  archetype: string;
  premium: boolean;
  sort_order: number;
};

function resolveFrame(renderKey: string | null) {
  return renderKey ? (templateFrames.find((f) => f.id === renderKey) ?? null) : null;
}

/**
 * Whether a catalog row has everything it needs to render a real preview —
 * generalizes the old Poster-only "does render_key resolve to a known frame"
 * check to all four formats. A row that fails this is excluded from the grid
 * entirely (never silently mis-rendered), same philosophy as the original
 * Poster-only check.
 */
function hasPreviewData(t: TemplateRow): boolean {
  switch (t.format) {
    case "template":  return resolveFrame(t.render_key) !== null;
    // Post now requires a real, built render_key (getPostTemplate()) -- a
    // row that hasn't shipped its bespoke design yet is excluded from the
    // grid rather than falling back to the generic archetype engine, which
    // is exactly the "template = category with different text" behavior
    // this architecture replaces.
    case "single":    return !!POST_SAMPLES[t.id] && getPostTemplate(t.render_key) !== null;
    // Same "real, built render_key required" rule as Post -- a Carousel or
    // Story row without a bespoke design yet is excluded rather than falling
    // back to the per-slide dynamic engine / generic StoryCard, which is
    // exactly the behavior this architecture replaces.
    case "carousel":  return !!CAROUSEL_SAMPLES[t.id] && getCarouselTemplate(t.render_key) !== null;
    case "story":     return !!STORY_SAMPLES[t.id] && getStoryTemplate(t.render_key) !== null;
    default:          return false;
  }
}

/** Measures its own box and reports the width — same ResizeObserver pattern
 *  ExactScalePreview uses, but reporting a raw pixel width instead of a CSS
 *  scale factor, since StoryCard already accepts a numeric `width` prop
 *  directly (no transform-scale trick needed for it). */
function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Post catalog rows render through the SAME postTemplates registry lookup
 * Content Studio's post-generation preview and Content History use (see
 * src/components/post-templates.tsx) -- one renderer, three call sites, not
 * a separate "preview approximation." resolveSinglePostStrategy() is never
 * called here; a Post row without a resolvable render_key is excluded by
 * hasPreviewData() above rather than falling back to it.
 */
function PostPreviewCanvas({ sample, brand, renderKey }: { sample: PostSample; brand: BrandKit; renderKey: string | null }) {
  const template = getPostTemplate(renderKey);
  if (!template) return null;
  return (
    <ExactScalePreview>
      <template.Component headline={sample.headline} content={sample.content} cta={sample.cta} specialty={sample.specialty} brand={brand} />
    </ExactScalePreview>
  );
}

/**
 * Carousel catalog rows render through the SAME carouselTemplates registry
 * lookup Content Studio's per-slide preview and Content History use (see
 * src/components/carousel-templates.tsx) -- resolveVisualStrategy() is never
 * called here. hasPreviewData() above already guarantees a bespoke render_key
 * resolves for any row reaching this component; the null guard is defensive.
 */
function CarouselPreviewCanvas({ sample, brand, renderKey, slideIdx }: {
  sample: CarouselSample; brand: BrandKit; renderKey: string | null; slideIdx: number;
}) {
  const template = getCarouselTemplate(renderKey);
  if (!template) return null;
  const total = sample.slides.length;
  const idx = Math.min(Math.max(slideIdx, 0), total - 1);
  const slide = sample.slides[idx];
  return (
    <ExactScalePreview>
      <template.Component
        slideTitle={slide.title} slideBody={slide.content} slideIndex={idx} totalSlides={total}
        cta={sample.cta} specialty={sample.specialty} brand={brand}
      />
    </ExactScalePreview>
  );
}

/**
 * Story catalog rows render through the SAME storyTemplates registry lookup
 * Content Studio's preview and Content History use (see
 * src/components/story-templates.tsx). hasPreviewData() above already
 * guarantees a bespoke render_key resolves; the null guard is defensive.
 */
function StoryPreviewCanvas({ sample, brand, renderKey }: { sample: StorySample; brand: BrandKit; renderKey: string | null }) {
  const [ref, width] = useMeasuredWidth();
  const template = getStoryTemplate(renderKey);
  if (!template) return null;
  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <template.Component
          headline={sample.headline} message={sample.message} cta={sample.cta}
          specialty={sample.specialty} brand={brand} width={width}
        />
      )}
    </div>
  );
}

/**
 * Dispatches to the right bespoke renderer for a catalog row's format —
 * Poster: getTemplateFrame()/TEMPLATE_SAMPLES; Post/Carousel/Story: the
 * sample-content canvases above, which are thin wrappers around each
 * format's template registry (post-templates.tsx / carousel-templates.tsx /
 * story-templates.tsx) — the exact same components Content Studio's
 * preview and Content History use for real generations. No dynamic-engine
 * fallback for any format.
 * `slideIdx` only matters for Carousel (defaults to a representative content
 * slide, not the hook, so the card shows the deck's inside-slide treatment
 * rather than just its cover); the preview dialog overrides it via local nav state.
 */
function CatalogCardPreview({ t, brand, frameProps, slideIdx }: {
  t: TemplateRow;
  brand: BrandKit;
  frameProps: Omit<import("@/components/template-frames").TemplateFrameProps, "headline" | "subline" | "cta">;
  slideIdx?: number;
}) {
  switch (t.format) {
    case "template": {
      const frame = resolveFrame(t.render_key)!;
      return (
        <ExactScalePreview>
          <frame.Frame {...TEMPLATE_SAMPLES[frame.id]} {...frameProps} />
        </ExactScalePreview>
      );
    }
    case "single": {
      const sample = POST_SAMPLES[t.id];
      return <PostPreviewCanvas sample={sample} brand={brand} renderKey={t.render_key} />;
    }
    case "carousel": {
      const sample = CAROUSEL_SAMPLES[t.id];
      const defaultIdx = Math.min(1, sample.slides.length - 1);
      return <CarouselPreviewCanvas sample={sample} brand={brand} renderKey={t.render_key} slideIdx={slideIdx ?? defaultIdx} />;
    }
    case "story": {
      const sample = STORY_SAMPLES[t.id];
      return <StoryPreviewCanvas sample={sample} brand={brand} renderKey={t.render_key} />;
    }
    default:
      return null;
  }
}

/**
 * Phase 1: Poster-only in-place creation workspace, rendered inside
 * /templates instead of navigating to /generate. Deliberately reuses --
 * never re-implements -- the existing generation backend, customization
 * schema, and renderer registry:
 *  - generateContent/generateImage (src/lib/api/generate.functions.ts) are
 *    the SAME server functions Content Studio calls; same credit
 *    deduction/refund path, same buildPrompt("template")/validateTemplateContent.
 *  - TemplateCustomizationSchema/resolveTemplateColors/DEFAULT_TEMPLATE_IMAGE_OFFSET
 *    (src/lib/post-customization.ts) are the SAME schema TemplatePreview
 *    writes in Content Studio -- no second customization shape.
 *  - getTemplateFrame(frameId) (src/components/template-frames.tsx) is the
 *    SAME registry Content Studio's preview and Content History use --
 *    frameId is fixed to the selected row's render_key and never changes
 *    here (no FramePicker), so the template is structurally authoritative.
 *  - fetchStudioSessionRow (src/lib/studio-session.ts) is the SAME by-id
 *    re-fetch Studio's own session-restore uses -- no second persistence
 *    system.
 * PreviewToolbar/FitScaledPreview/CreativePreviewDialog/useAiImage/
 * ImageLoadingOverlay/savePng/copyText/SectionBlock/MiniColor/
 * PhotoAdjustPanel are the Phase 0 exports from _app.generate.tsx, reused
 * as-is. Content Studio's FramePicker/StudioControls/dynamic-layout
 * machinery is intentionally NOT imported here at all.
 */
function PosterWorkspace({ row, rowIdParam, onBack, onGenerated }: {
  row: TemplateRow;
  rowIdParam?: string;
  onBack: () => void;
  /** Called once generation succeeds, to push ?rowId= into the URL. The
   *  caller navigates with `replace: true` so Back from a generated result
   *  returns straight to the catalog, per spec. */
  onGenerated: (rowId: string) => void;
}) {
  const { user } = useAuth();
  const [brand] = useBrandKit();
  const isPro = useIsPro(user?.id);
  const trialEligible = useGrowthTrialEligible(user?.id);
  const callGenerate = useServerFn(generateContent);

  // hasPreviewData() already guarantees this resolves for any Poster row
  // that reaches this component (see TemplateStudioPage below).
  const entry = getTemplateFrame(row.render_key as TemplateFrameId);
  const frameId = entry.id;
  const sample = TEMPLATE_SAMPLES[entry.id];

  const [specialty, setSpecialty] = useState(brand.specialty || "");
  const specialtyTouchedRef = useRef(false);
  useEffect(() => {
    if (brand.specialty && !specialtyTouchedRef.current) setSpecialty(brand.specialty);
  }, [brand.specialty]);

  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [result, setResult] = useState<TemplatePost | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  // Whether the current result/customization came from a DB re-fetch (arrival
  // via ?rowId=) rather than a fresh generation this session -- same role as
  // TemplatePreview's `!!initialCustomization` passed into usePersistCustomization.
  const [restored, setRestored] = useState(false);

  const ai = useAiImage(rowId, null);

  const [useBrandColors, setUseBrandColors] = useState(true);
  const [primaryPick, setPrimaryPick] = useState<string | null>(null);
  const [secondaryPick, setSecondaryPick] = useState<string | null>(null);
  const [imageOffsetX, setImageOffsetX] = useState<number>(DEFAULT_TEMPLATE_IMAGE_OFFSET.x);
  const [imageOffsetY, setImageOffsetY] = useState<number>(DEFAULT_TEMPLATE_IMAGE_OFFSET.y);
  const [imageZoom, setImageZoom] = useState<number>(DEFAULT_TEMPLATE_IMAGE_OFFSET.zoom);

  // Arrive with ?rowId= already set (refresh, back/forward, bookmark) --
  // re-fetch the generated row exactly the way Studio's own session-restore
  // does; no second persistence system, no duplicated fetch logic.
  const restoringRef = useRef<string | null>(null);
  useEffect(() => {
    if (!rowIdParam || rowIdParam === rowId || restoringRef.current === rowIdParam) return;
    restoringRef.current = rowIdParam;
    let cancelled = false;
    (async () => {
      const restoredRow = await fetchStudioSessionRow(rowIdParam);
      if (cancelled || !restoredRow || restoredRow.result.kind !== "template") return;
      setResult(restoredRow.result);
      setRowId(rowIdParam);
      ai.setUrl(restoredRow.initialImageUrl);
      const c = restoredRow.initialCustomization?.kind === "template" ? restoredRow.initialCustomization : null;
      if (c) {
        setUseBrandColors(c.useBrandColors);
        setPrimaryPick(c.primaryColor);
        setSecondaryPick(c.secondaryColor);
        setImageOffsetX(c.imageOffsetX ?? DEFAULT_TEMPLATE_IMAGE_OFFSET.x);
        setImageOffsetY(c.imageOffsetY ?? DEFAULT_TEMPLATE_IMAGE_OFFSET.y);
        setImageZoom(c.imageZoom ?? DEFAULT_TEMPLATE_IMAGE_OFFSET.zoom);
      }
      setRestored(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
    return () => { cancelled = true; };
  }, [rowIdParam, rowId]);

  const palette = result?.visual.colors ?? [];
  const colors = resolveTemplateColors({ useBrandColors, primaryColor: primaryPick, secondaryColor: secondaryPick }, brand, palette);
  const hasManualColors = primaryPick !== null || secondaryPick !== null;
  const resetManualColors = () => { setPrimaryPick(null); setSecondaryPick(null); };
  const hasCustomPhotoAdjust = imageOffsetX !== DEFAULT_TEMPLATE_IMAGE_OFFSET.x || imageOffsetY !== DEFAULT_TEMPLATE_IMAGE_OFFSET.y || imageZoom !== DEFAULT_TEMPLATE_IMAGE_OFFSET.zoom;
  const resetPhotoAdjust = () => {
    setImageOffsetX(DEFAULT_TEMPLATE_IMAGE_OFFSET.x);
    setImageOffsetY(DEFAULT_TEMPLATE_IMAGE_OFFSET.y);
    setImageZoom(DEFAULT_TEMPLATE_IMAGE_OFFSET.zoom);
  };

  const customization: TemplateCustomization = useMemo(() => ({
    v: 1, engine: "v1", kind: "template",
    frameId, useBrandColors, primaryColor: primaryPick, secondaryColor: secondaryPick,
    imageOffsetX, imageOffsetY, imageZoom,
  }), [frameId, useBrandColors, primaryPick, secondaryPick, imageOffsetX, imageOffsetY, imageZoom]);
  usePersistCustomization(rowId, customization, restored);

  async function handleGenerate() {
    if (!isPro) return; // button is replaced by an upgrade CTA below; defensive only
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    setLoading(true);
    setOutOfCredits(false);
    try {
      const out = await callGenerate({
        data: {
          kind: "template",
          category: "clinic-promo",
          specialty: specialty.trim() || "General Physician",
          topic: topic.trim(),
          tone: "Standard",
          audience: "General Public",
          language: "English",
          brand: {
            clinicName: brand.clinicName,
            doctorName: brand.doctorName,
            primaryColor: brand.primaryColor,
            secondaryColor: brand.secondaryColor,
            website: brand.website,
            phone: brand.phone,
            hasLogo: !!brand.logo,
            hasDoctorPhoto: !!brand.doctorPhoto,
            hasClinicPhoto: !!brand.clinicPhoto,
          },
          templateId: row.id,
        },
      });
      const out2 = out as TemplatePost & { _rowId?: string };
      const newRowId = out2._rowId ?? null;
      setResult(out2);
      setRowId(newRowId);
      ai.setUrl(null);
      setUseBrandColors(true);
      setPrimaryPick(null);
      setSecondaryPick(null);
      setImageOffsetX(DEFAULT_TEMPLATE_IMAGE_OFFSET.x);
      setImageOffsetY(DEFAULT_TEMPLATE_IMAGE_OFFSET.y);
      setImageZoom(DEFAULT_TEMPLATE_IMAGE_OFFSET.zoom);
      setRestored(false);
      toast.success("Your poster is ready");
      if (newRowId) onGenerated(newRowId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("INSUFFICIENT_CREDITS")) {
        setOutOfCredits(true);
        toast.error("You've used all your AI generations this period. Upgrade your plan to continue.");
      } else if (msg.includes("SUBSCRIPTION_NOT_FOUND")) {
        toast.error("No active subscription found. Visit the Subscription page to activate a plan.");
      } else if (msg.includes("GEMINI") || msg.includes("503")) {
        toast.error("AI service is busy — please try again in a moment.");
      } else {
        toast.error(msg || "Generation failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const captureRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function capturePng(): Promise<string | null> {
    if (!captureRef.current) return null;
    const { toPng } = await import("html-to-image");
    return toPng(captureRef.current, { canvasWidth: 1080, canvasHeight: 1080, pixelRatio: 1, cacheBust: true, filter: isExportableNode });
  }

  async function downloadPoster() {
    setDownloading(true);
    try {
      const png = await capturePng();
      if (!png) return;
      savePng(png, "medipost-template-post.png");
      toast.success("Post downloaded (1080×1080)");
    } catch (e) {
      console.error("[PosterWorkspace] download failed:", e);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function onUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    try {
      ai.setUrl(await fileToDataUrl(file));
      toast.success("Photo added to the template");
    } catch {
      toast.error("Couldn't read that file. Please try another image.");
    }
  }

  const content = result
    ? { headline: result.headline, subline: result.subline, cta: result.cta, features: result.features }
    : { headline: sample.headline, subline: sample.subline, cta: sample.cta, features: sample.features ?? [] };

  const frameProps = {
    ...content,
    logo: brand.logo,
    businessName: brand.clinicName,
    phone: brand.phone,
    doctorPhoto: brand.doctorPhoto,
    doctorName: brand.doctorName,
    colors,
    imageUrl: ai.url,
    imageOffsetX, imageOffsetY, imageZoom,
    // Pre-generation, this is still a representative sample -- show the
    // gallery's "Your Logo"/"Business Name" placeholder chips exactly like
    // the catalog card/preview dialog do, instead of real (possibly empty) brand data.
    placeholders: !result,
  };

  return (
    <div className="space-y-4">
      <button
        type="button" onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Template Studio
      </button>

      <div className="grid gap-6 md:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{entry.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{entry.tagline}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Specialty</Label>
                <SpecialtySelect value={specialty} onChange={(v) => { specialtyTouchedRef.current = true; setSpecialty(v); }} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Topic / Brief</Label>
                <AutoGrowTextarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. New patient offer for root canal treatment"
                  rows={3}
                  disabled={loading}
                />
              </div>

              {!isPro ? (
                <div className="rounded-lg border border-[color:var(--teal)]/30 bg-[color:var(--teal)]/5 p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Template Studio's ready-made promo designs are a Growth feature.</p>
                  <Button size="sm" className="w-full" onClick={() => window.location.href = "/subscription"}>
                    {growthButtonLabel(trialEligible)}
                  </Button>
                </div>
              ) : outOfCredits ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive">You've used all your AI generations this period.</p>
                  <Button size="sm" className="w-full" onClick={() => window.location.href = "/subscription"}>
                    {growthButtonLabel(trialEligible)}
                  </Button>
                </div>
              ) : (
                <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Generating…" : result ? "Regenerate" : "Generate Poster"}
                </Button>
              )}
            </CardContent>
          </Card>

          {result && (
            <>
              {entry.usesAiImage && ai.url && (
                <PhotoAdjustPanel
                  offsetX={imageOffsetX} offsetY={imageOffsetY} zoom={imageZoom}
                  onOffsetXChange={setImageOffsetX} onOffsetYChange={setImageOffsetY} onZoomChange={setImageZoom}
                  hasCustom={hasCustomPhotoAdjust} onReset={resetPhotoAdjust}
                />
              )}
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Colors</Label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <span>Use clinic brand colors</span>
                    <input type="checkbox" checked={useBrandColors} className="accent-[color:var(--teal)]"
                      onChange={(e) => { setUseBrandColors(e.target.checked); resetManualColors(); }} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniColor label="Primary" value={colors.primary} onChange={setPrimaryPick} />
                  <MiniColor label="Secondary" value={colors.secondary} onChange={setSecondaryPick} />
                </div>
                {hasManualColors && (
                  <button type="button" onClick={resetManualColors} className="text-[11px] text-[color:var(--teal)] hover:underline">
                    Reset to suggested colors
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="min-w-0">
          <Card className="border-border/60">
            <CardContent className="pt-6 space-y-4">
              <PreviewToolbar title={result ? `Poster — ${entry.name}` : `Preview — ${entry.name}`} />
              <div className="mx-auto w-full max-w-md">
                <ExactScalePreview>
                  <entry.Frame {...frameProps} imageLoading={ai.loading} loadingOverlay={<ImageLoadingOverlay />} />
                </ExactScalePreview>

                {result && (
                  <>
                    <CreativeActions className="mt-3">
                      {entry.usesAiImage && (
                        <>
                          <AiImageButton
                            loading={ai.loading} hasImage={!!ai.url}
                            label={ai.url ? "Regenerate photo" : "Generate photo"}
                            onClick={() => ai.run(result.visual.imagePrompt || result.visual.concept, result.visual.visualStyle)}
                          />
                          <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8"
                            onClick={() => fileInputRef.current?.click()} disabled={ai.loading}>
                            <Upload className="h-3.5 w-3.5" /> Upload photo
                          </Button>
                        </>
                      )}
                      <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8 col-span-2"
                        onClick={downloadPoster} disabled={downloading || ai.loading}>
                        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />}
                        Download post
                      </Button>
                    </CreativeActions>
                    <div className="mt-2">
                      <CreativePreviewDialog title={`Poster — ${entry.name}`} naturalWidth={CREATIVE_DESIGN_WIDTH} triggerClassName="w-full">
                        <entry.Frame {...frameProps} />
                      </CreativePreviewDialog>
                    </div>
                    <RemoveWatermarkRow className="mt-2" />
                    {entry.usesAiImage && (
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUploadPhoto} />
                    )}
                  </>
                )}
              </div>

              {result && (
                <div aria-hidden className="fixed pointer-events-none" style={{ left: -10000, top: 0, width: CREATIVE_DESIGN_WIDTH }}>
                  <div ref={captureRef}><entry.Frame {...frameProps} /></div>
                </div>
              )}

              {!result && !loading && (
                <p className="text-center text-xs text-muted-foreground">
                  Sample content shown — fill in your brief and generate to create your own.
                </p>
              )}
              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating your poster…
                </div>
              )}

              {result && (
                <>
                  <SectionBlock title="Headline" body={result.headline} />
                  <SectionBlock title="Supporting Line" body={result.subline} />
                  <SectionBlock title="Call To Action" body={result.cta} />
                  <SectionBlock title="Caption" body={result.caption} />
                  <SectionBlock title="Hashtags" body={result.hashtags.join(" ")} />
                  <div className="pt-3 border-t border-border/60">
                    <ShareButtons
                      text={[result.caption, result.cta, result.hashtags.join(" ")].filter(Boolean).join("\n\n")}
                      imageUrl={ai.url}
                      captureImage={capturePng}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const ALL = "__all__";

function TemplateStudioPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user } = useAuth();
  const [brand] = useBrandKit();

  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [formatFilter, setFormatFilter] = useState<string>(ALL);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(ALL);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // Which slide is shown in the preview dialog, for Carousel templates only —
  // local UI state, never persisted; reset whenever a new template is opened.
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("id, render_key, name, description, category, specialty_tags, format, archetype, premium, sort_order")
        .eq("status", "published")
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (error) { setLoadError(error.message); return; }
      setTemplates((data ?? []) as TemplateRow[]);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("template_favorites")
        .select("template_id")
        .eq("user_id", user.id);
      if (cancelled || error) return;
      setFavoriteIds(new Set((data ?? []).map((r) => r.template_id as string)));
    })();
    return () => { cancelled = true; };
  }, [user]);

  async function toggleFavorite(templateId: string) {
    if (!user) return;
    const isFav = favoriteIds.has(templateId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(templateId) : next.add(templateId);
      return next;
    });
    const { error } = isFav
      ? await supabase.from("template_favorites").delete().eq("user_id", user.id).eq("template_id", templateId)
      : await supabase.from("template_favorites").insert({ user_id: user.id, template_id: templateId });
    if (error) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFav ? next.add(templateId) : next.delete(templateId);
        return next;
      });
      toast.error("Could not update favorite.");
    }
  }

  // Only templates with real preview data are ever shown — a Poster row with
  // an unknown render_key, or a Post/Carousel/Story row missing its sample
  // entry, is excluded rather than guessed at (see hasPreviewData above).
  const resolvedTemplates = useMemo(
    () => (templates ?? []).filter(hasPreviewData),
    [templates],
  );

  const availableCategories = useMemo(
    () => Array.from(new Set(resolvedTemplates.map((t) => t.category))),
    [resolvedTemplates],
  );
  const availableFormats = useMemo(
    () => Array.from(new Set(resolvedTemplates.map((t) => t.format))),
    [resolvedTemplates],
  );
  const availableSpecialties = useMemo(
    () => Array.from(new Set(resolvedTemplates.flatMap((t) => t.specialty_tags))).sort(),
    [resolvedTemplates],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resolvedTemplates.filter((t) => {
      if (categoryFilter !== ALL && t.category !== categoryFilter) return false;
      if (formatFilter !== ALL && t.format !== formatFilter) return false;
      if (specialtyFilter !== ALL && !t.specialty_tags.includes(specialtyFilter)) return false;
      if (!q) return true;
      const haystack = [t.name, t.description ?? "", t.category, ...t.specialty_tags].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [resolvedTemplates, query, categoryFilter, formatFilter, specialtyFilter]);

  const frameProps = {
    logo: brand.logo,
    businessName: brand.clinicName,
    phone: brand.phone,
    doctorPhoto: brand.doctorPhoto,
    doctorName: brand.doctorName,
    colors: { primary: brand.primaryColor, secondary: brand.secondaryColor },
    placeholders: true,
  };

  // Poster rows (format "template") stay on /templates -- Phase 1's in-place
  // creation workspace, selected via ?templateId= (see PosterWorkspace below
  // and this route's validateSearch). Post/Carousel/Story rows still go
  // through /generate's ?kind=&renderKey= path unchanged (out of scope for
  // this phase; renderKey is what makes the destination brief use the exact
  // same bespoke template renderer this card just previewed (see
  // src/components/post-templates.tsx's getPostTemplate() -- Carousel/Story
  // don't have a resolvable render_key yet in this phase, so it's simply
  // undefined for them and SinglePostPreview's sibling components fall back
  // to their current behavior unchanged). Carousel additionally passes
  // slideCount so the brief opens with the same slide count this entry demonstrated.
  function useTemplate(t: TemplateRow) {
    if (t.format === "template") {
      setPreviewId(null); // close the preview dialog before entering the workspace
      navigate({ to: "/templates", search: { templateId: t.id } });
      return;
    }
    const slideCount = t.format === "carousel" ? CAROUSEL_SAMPLES[t.id]?.slides.length : undefined;
    navigate({
      to: "/generate",
      search: {
        kind: t.format, templateId: t.id, category: t.category,
        slideCount: slideCount ? String(slideCount) : undefined,
        renderKey: t.render_key ?? undefined,
      },
    });
  }

  const previewTemplate = previewId ? resolvedTemplates.find((t) => t.id === previewId) ?? null : null;
  const loading = templates === null;

  function openPreview(id: string) {
    // Matches CatalogCardPreview's own default (a representative content
    // slide, not the hook) so the dialog opens showing the same slide the
    // card already displayed — no visual jump. Harmless no-op for every
    // non-Carousel format, which ignores slideIdx entirely.
    setPreviewSlideIdx(1);
    setPreviewId(id);
  }

  // Phase 1: a selected Poster row (format === "template") renders the
  // in-place creation workspace instead of the browse grid. A ?templateId=
  // that resolves to a non-Poster row (or doesn't resolve yet/at all) falls
  // through to the ordinary browse view -- Post/Carousel/Story never set
  // this param in this phase (see useTemplate above), so that path is only
  // reachable via a stale/hand-edited URL, and failing safe to browse is
  // the right behavior for it.
  const selectedRow = search.templateId ? resolvedTemplates.find((t) => t.id === search.templateId) ?? null : null;
  const posterWorkspaceActive = !!selectedRow && selectedRow.format === "template";

  if (search.templateId && templates === null) {
    // Catalog still loading -- avoid a flash of the full browse grid/skeleton
    // behind a template that's about to become the workspace.
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posterWorkspaceActive && selectedRow) {
    return (
      <PosterWorkspace
        row={selectedRow}
        rowIdParam={search.rowId}
        onBack={() => navigate({ to: "/templates", search: {} })}
        onGenerated={(newRowId) =>
          navigate({ to: "/templates", search: { templateId: selectedRow.id, rowId: newRowId }, replace: true })
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <LayoutTemplate className="h-7 w-7 text-[color:var(--teal)]" />
          Template Studio
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready-made promo designs, already shaped to your brand. Pick one and Medipost writes the copy.
        </p>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="pl-9"
            />
          </div>

          <FilterRow
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={availableCategories.map((id) => ({
              value: id,
              label: contentCategories.find((c) => c.id === id)?.title ?? id,
            }))}
          />

          {availableFormats.length > 0 && (
            <FilterRow
              label="Format"
              value={formatFilter}
              onChange={setFormatFilter}
              options={availableFormats.map((id) => ({
                value: id,
                label: workflows.find((w) => w.kind === id)?.title ?? id,
              }))}
            />
          )}

          {availableSpecialties.length > 0 && (
            <FilterRow
              label="Specialty"
              value={specialtyFilter}
              onChange={setSpecialtyFilter}
              options={availableSpecialties.map((s) => ({ value: s, label: s }))}
            />
          )}
        </CardContent>
      </Card>

      {loadError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Couldn't load templates: {loadError}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60 border-dashed">
          <CardContent className="grid place-items-center text-center py-20 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[color:var(--teal)]/20 to-primary/20 grid place-items-center mb-4">
              <Search className="h-6 w-6 text-[color:var(--teal)]" />
            </div>
            <p className="font-medium text-foreground">
              {resolvedTemplates.length === 0 ? "No templates published yet" : "No templates match your search"}
            </p>
            <p className="text-sm mt-1">
              {resolvedTemplates.length === 0 ? "Check back soon." : "Try a different search term or clear your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((t) => {
            const isFav = favoriteIds.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => openPreview(t.id)}
                className="group min-w-0 text-left rounded-xl border border-border bg-card p-2 transition-all hover:border-[color:var(--teal)]/50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--teal)]"
              >
                <div className="relative">
                  <CatalogCardPreview t={t} brand={brand} frameProps={frameProps} />
                  {t.premium && (
                    <Badge variant="solid" className="absolute left-2 top-2 gap-1 py-0 text-[10px]">
                      <Crown className="h-2.5 w-2.5" /> Growth
                    </Badge>
                  )}
                  {user && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(t.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleFavorite(t.id); } }}
                      className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 backdrop-blur-sm shadow-sm transition-transform hover:scale-105"
                    >
                      <Heart className={`h-3.5 w-3.5 ${isFav ? "text-rose-500" : "text-muted-foreground"}`} fill={isFav ? "currentColor" : "none"} />
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs font-semibold truncate">{t.name}</p>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground truncate">
                    {contentCategories.find((c) => c.id === t.category)?.title ?? t.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">·</span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {workflows.find((w) => w.kind === t.format)?.title ?? t.format}
                  </span>
                  {t.specialty_tags.slice(0, 1).map((s) => (
                    <Badge key={s} variant="outline" className="py-0 text-[9px]">{s}</Badge>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="max-w-md">
          {previewTemplate && (() => {
            const isFav = favoriteIds.has(previewTemplate.id);
            const carouselSlideCount = previewTemplate.format === "carousel" ? CAROUSEL_SAMPLES[previewTemplate.id]?.slides.length ?? 0 : 0;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {previewTemplate.name}
                    {previewTemplate.premium && (
                      <Badge variant="solid" className="gap-1 py-0 text-[10px]">
                        <Crown className="h-2.5 w-2.5" /> Growth
                      </Badge>
                    )}
                  </DialogTitle>
                  {previewTemplate.description && (
                    <DialogDescription>{previewTemplate.description}</DialogDescription>
                  )}
                </DialogHeader>

                <div className="relative">
                  <CatalogCardPreview t={previewTemplate} brand={brand} frameProps={frameProps} slideIdx={previewSlideIdx} />
                  {carouselSlideCount > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous slide"
                        disabled={previewSlideIdx === 0}
                        onClick={() => setPreviewSlideIdx((i) => Math.max(0, i - 1))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow-sm border border-border disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next slide"
                        disabled={previewSlideIdx === carouselSlideCount - 1}
                        onClick={() => setPreviewSlideIdx((i) => Math.min(carouselSlideCount - 1, i + 1))}
                        className="absolute right-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow-sm border border-border disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                {carouselSlideCount > 1 && (
                  <p className="text-center text-[11px] text-muted-foreground -mt-2">
                    Slide {previewSlideIdx + 1} of {carouselSlideCount} — sample content, shown for preview only
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline">{contentCategories.find((c) => c.id === previewTemplate.category)?.title ?? previewTemplate.category}</Badge>
                  <Badge variant="outline">{workflows.find((w) => w.kind === previewTemplate.format)?.title ?? previewTemplate.format}</Badge>
                  {previewTemplate.specialty_tags.length === 0 ? (
                    <Badge variant="outline">All specialties</Badge>
                  ) : (
                    previewTemplate.specialty_tags.map((s) => <Badge key={s} variant="outline">{s}</Badge>)
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button onClick={() => useTemplate(previewTemplate)} size="lg" className="flex-1 gap-2">
                    <Sparkles className="h-4 w-4" />
                    Use Template
                  </Button>
                  {user && (
                    <Button
                      variant="outline" size="lg"
                      onClick={() => toggleFavorite(previewTemplate.id)}
                      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`h-4 w-4 ${isFav ? "text-rose-500" : ""}`} fill={isFav ? "currentColor" : "none"} />
                    </Button>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterRow({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  if (options.length <= 1) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange(ALL)}
          className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
            value === ALL ? "bg-[color:var(--teal)] text-white border-[color:var(--teal)]" : "bg-background border-border hover:bg-accent"
          }`}
        >
          All
        </button>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
              value === o.value ? "bg-[color:var(--teal)] text-white border-[color:var(--teal)]" : "bg-background border-border hover:bg-accent"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
