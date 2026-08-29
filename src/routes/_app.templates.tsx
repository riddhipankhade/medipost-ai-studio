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
  SinglePostPreview,
  CarouselPreview,
  StoryPreview,
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
import {
  generateContent, type TemplatePost, type SinglePost, type CarouselPost, type StoryPost,
} from "@/lib/api/generate.functions";
import {
  resolveTemplateColors, DEFAULT_TEMPLATE_IMAGE_OFFSET, type TemplateCustomization,
} from "@/lib/post-customization";
import { usePersistCustomization } from "@/hooks/usePersistCustomization";
import { fetchStudioSessionRow, type StudioSessionRow } from "@/lib/studio-session";
import { RemoveWatermarkRow } from "@/components/Watermark";
import { ShareButtons } from "@/components/ShareButtons";
import { isExportableNode } from "@/lib/export-filter";
import { useIsPro, useGrowthTrialEligible } from "@/lib/use-subscription";
import { growthHeadline, growthButtonLabel } from "@/lib/growth-trial-copy";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Template Studio — Medipost AI" }] }),
  // In-place workflow, all four formats: `templateId` identifies the selected
  // catalog row, `rowId` identifies a completed generation
  // (`content_generations.id`) once one exists. Both optional/loose-typed
  // here, same convention _app.generate.tsx's own validateSearch uses --
  // real validation (does templateId resolve to a published row with a real
  // preview?) happens in the component, against the already-loaded catalog.
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
          renderKey: row.render_key ?? undefined,
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

/**
 * Shared shape for the Post/Carousel/Story in-place brief fields — every
 * catalog row's category is fixed (never a user-facing picker, same "template
 * is authoritative" rule Poster follows), so the only thing that varies by
 * category is whether the "Did You Know" statistic+source fields are shown.
 * generate.functions.ts's InputSchema.superRefine is the actual server-side
 * guard; this mirrors it client-side for UX only, exactly like run() does in
 * Content Studio.
 */
function StatisticFields({ statistic, setStatistic, statisticSource, setStatisticSource, statisticContext, setStatisticContext }: {
  statistic: string; setStatistic: (v: string) => void;
  statisticSource: string; setStatisticSource: (v: string) => void;
  statisticContext: string; setStatisticContext: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Statistic (required)</Label>
        <Input value={statistic} onChange={(e) => setStatistic(e.target.value)} placeholder="e.g. Nearly 1 in 3 adults have high blood pressure" />
        <p className="text-[11px] text-muted-foreground">Medipost formats this for social media — it never invents or changes the number.</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Source (required)</Label>
        <Input value={statisticSource} onChange={(e) => setStatisticSource(e.target.value)} placeholder="e.g. WHO, 2023" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Additional context (optional)</Label>
        <Input value={statisticContext} onChange={(e) => setStatisticContext(e.target.value)} placeholder="e.g. many don't know they have it" />
      </div>
    </>
  );
}

function brandPayload(brand: BrandKit) {
  return {
    clinicName: brand.clinicName, doctorName: brand.doctorName,
    primaryColor: brand.primaryColor, secondaryColor: brand.secondaryColor,
    website: brand.website, phone: brand.phone,
    hasLogo: !!brand.logo, hasDoctorPhoto: !!brand.doctorPhoto, hasClinicPhoto: !!brand.clinicPhoto,
  };
}

function errorToastFor(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("INSUFFICIENT_CREDITS")) return "__INSUFFICIENT_CREDITS__";
  if (msg.includes("SUBSCRIPTION_NOT_FOUND")) return "No active subscription found. Visit the Subscription page to activate a plan.";
  if (msg.includes("GEMINI") || msg.includes("503")) return "AI service is busy — please try again in a moment.";
  return msg || "Generation failed. Please try again.";
}

/**
 * Post (kind "single") in-place creation workspace — same reuse philosophy as
 * PosterWorkspace above, but the "generated result" side is the exported
 * SinglePostPreview from Content Studio's generate route, unmodified: it
 * already locks all customization to brand-only when a fixed renderKey is
 * present (see its own internal `template` dispatch), already handles AI
 * image generation, download, and persistence via usePersistCustomization.
 * This workspace only owns the compact brief and the pre-generation sample.
 */
function PostWorkspace({ row, rowIdParam, onBack, onGenerated }: {
  row: TemplateRow; rowIdParam?: string; onBack: () => void; onGenerated: (rowId: string) => void;
}) {
  const { user } = useAuth();
  const [brand] = useBrandKit();
  const trialEligible = useGrowthTrialEligible(user?.id);
  const callGenerate = useServerFn(generateContent);
  const sample = POST_SAMPLES[row.id];

  const [specialty, setSpecialty] = useState(brand.specialty || "");
  const specialtyTouchedRef = useRef(false);
  useEffect(() => {
    if (brand.specialty && !specialtyTouchedRef.current) setSpecialty(brand.specialty);
  }, [brand.specialty]);

  const [topic, setTopic] = useState("");
  const [statistic, setStatistic] = useState("");
  const [statisticSource, setStatisticSource] = useState("");
  const [statisticContext, setStatisticContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [result, setResult] = useState<SinglePost | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  const [resultKey, setResultKey] = useState<string>("none");
  const [sessionSeed, setSessionSeed] = useState<StudioSessionRow | null>(null);

  const restoringRef = useRef<string | null>(null);
  useEffect(() => {
    if (!rowIdParam || rowIdParam === rowId || restoringRef.current === rowIdParam) return;
    restoringRef.current = rowIdParam;
    let cancelled = false;
    (async () => {
      const restored = await fetchStudioSessionRow(rowIdParam);
      if (cancelled || !restored || restored.result.kind !== "single") return;
      setResult(restored.result);
      setRowId(rowIdParam);
      setResultKey(rowIdParam);
      setSessionSeed(restored);
    })();
    return () => { cancelled = true; };
  }, [rowIdParam, rowId]);

  async function handleGenerate() {
    if (!topic.trim()) { toast.error("Please enter a topic"); return; }
    if (row.category === "did-you-know" && (!statistic.trim() || !statisticSource.trim())) {
      toast.error("Please add the statistic and its source — Medipost formats it, but never invents the number.");
      return;
    }
    setLoading(true);
    setOutOfCredits(false);
    try {
      const out = await callGenerate({
        data: {
          kind: "single", category: row.category,
          specialty: specialty.trim() || "General Physician", topic: topic.trim(),
          tone: "Standard", audience: "General Public",
          brand: brandPayload(brand), templateId: row.id, renderKey: row.render_key ?? undefined,
          statistic: statistic.trim() || undefined,
          statisticSource: statisticSource.trim() || undefined,
          statisticContext: statisticContext.trim() || undefined,
        },
      });
      const out2 = out as SinglePost & { _rowId?: string };
      const newRowId = out2._rowId ?? null;
      setResult(out2);
      setRowId(newRowId);
      setResultKey(newRowId ?? `gen-${Date.now()}`);
      setSessionSeed(null);
      toast.success("Your post is ready");
      if (newRowId) onGenerated(newRowId);
    } catch (e) {
      const msg = errorToastFor(e);
      if (msg === "__INSUFFICIENT_CREDITS__") {
        setOutOfCredits(true);
        toast.error("You've used all your AI generations this period. Upgrade your plan to continue.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Template Studio
      </button>

      <div className="grid gap-6 md:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{row.name}</h2>
                {row.description && <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Specialty</Label>
                <SpecialtySelect value={specialty} onChange={(v) => { specialtyTouchedRef.current = true; setSpecialty(v); }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Topic / Brief</Label>
                <AutoGrowTextarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. New patient offer for root canal treatment" rows={3} disabled={loading} />
              </div>
              {row.category === "did-you-know" && (
                <StatisticFields
                  statistic={statistic} setStatistic={setStatistic}
                  statisticSource={statisticSource} setStatisticSource={setStatisticSource}
                  statisticContext={statisticContext} setStatisticContext={setStatisticContext}
                />
              )}
              {outOfCredits ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive">You've used all your AI generations this period.</p>
                  <Button size="sm" className="w-full" onClick={() => window.location.href = "/subscription"}>
                    {growthButtonLabel(trialEligible)}
                  </Button>
                </div>
              ) : (
                <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Generating…" : result ? "Regenerate" : "Generate Post"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0">
          {result ? (
            <SinglePostPreview
              key={resultKey}
              post={result} specialty={specialty} rowId={rowId} category={row.category} topic={topic}
              initialImageUrl={sessionSeed?.initialImageUrl ?? null}
              initialCustomization={sessionSeed?.initialCustomization?.kind === "single" ? sessionSeed.initialCustomization : null}
              renderKey={row.render_key}
            />
          ) : (
            <Card className="border-border/60">
              <CardContent className="pt-6 space-y-4">
                <PreviewToolbar title={`Preview — ${row.name}`} />
                <div className="mx-auto w-full max-w-md">
                  {sample && <PostPreviewCanvas sample={sample} brand={brand} renderKey={row.render_key} />}
                </div>
                {!loading ? (
                  <p className="text-center text-xs text-muted-foreground">Sample content shown — fill in your brief and generate to create your own.</p>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating your post…
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Carousel (kind "carousel") in-place creation workspace — same reuse
 * philosophy as PostWorkspace above; the generated deck renders via the
 * exported CarouselPreview, which already dispatches every slide through the
 * fixed carouselTemplates registry entry (renderKey) with per-slide AI image
 * generation, download, and persistence built in.
 */
function CarouselWorkspace({ row, rowIdParam, onBack, onGenerated }: {
  row: TemplateRow; rowIdParam?: string; onBack: () => void; onGenerated: (rowId: string) => void;
}) {
  const { user } = useAuth();
  const [brand] = useBrandKit();
  const trialEligible = useGrowthTrialEligible(user?.id);
  const callGenerate = useServerFn(generateContent);
  const sample = CAROUSEL_SAMPLES[row.id];

  const [specialty, setSpecialty] = useState(brand.specialty || "");
  const specialtyTouchedRef = useRef(false);
  useEffect(() => {
    if (brand.specialty && !specialtyTouchedRef.current) setSpecialty(brand.specialty);
  }, [brand.specialty]);

  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState<number>(() => sample?.slides.length ?? 5);
  const [statistic, setStatistic] = useState("");
  const [statisticSource, setStatisticSource] = useState("");
  const [statisticContext, setStatisticContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [result, setResult] = useState<CarouselPost | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  const [resultKey, setResultKey] = useState<string>("none");
  const [sessionSeed, setSessionSeed] = useState<StudioSessionRow | null>(null);

  const restoringRef = useRef<string | null>(null);
  useEffect(() => {
    if (!rowIdParam || rowIdParam === rowId || restoringRef.current === rowIdParam) return;
    restoringRef.current = rowIdParam;
    let cancelled = false;
    (async () => {
      const restored = await fetchStudioSessionRow(rowIdParam);
      if (cancelled || !restored || restored.result.kind !== "carousel") return;
      setResult(restored.result);
      setRowId(rowIdParam);
      setResultKey(rowIdParam);
      setSessionSeed(restored);
    })();
    return () => { cancelled = true; };
  }, [rowIdParam, rowId]);

  async function handleGenerate() {
    if (!topic.trim()) { toast.error("Please enter a topic"); return; }
    if (row.category === "did-you-know" && (!statistic.trim() || !statisticSource.trim())) {
      toast.error("Please add the statistic and its source — Medipost formats it, but never invents the number.");
      return;
    }
    setLoading(true);
    setOutOfCredits(false);
    try {
      const out = await callGenerate({
        data: {
          kind: "carousel", category: row.category,
          specialty: specialty.trim() || "General Physician", topic: topic.trim(),
          tone: "Standard", audience: "General Public", slideCount,
          brand: brandPayload(brand), templateId: row.id, renderKey: row.render_key ?? undefined,
          statistic: statistic.trim() || undefined,
          statisticSource: statisticSource.trim() || undefined,
          statisticContext: statisticContext.trim() || undefined,
        },
      });
      const out2 = out as CarouselPost & { _rowId?: string };
      const newRowId = out2._rowId ?? null;
      setResult(out2);
      setRowId(newRowId);
      setResultKey(newRowId ?? `gen-${Date.now()}`);
      setSessionSeed(null);
      toast.success("Your carousel is ready");
      if (newRowId) onGenerated(newRowId);
    } catch (e) {
      const msg = errorToastFor(e);
      if (msg === "__INSUFFICIENT_CREDITS__") {
        setOutOfCredits(true);
        toast.error("You've used all your AI generations this period. Upgrade your plan to continue.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Template Studio
      </button>

      <div className="grid gap-6 md:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{row.name}</h2>
                {row.description && <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Specialty</Label>
                <SpecialtySelect value={specialty} onChange={(v) => { specialtyTouchedRef.current = true; setSpecialty(v); }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Topic / Brief</Label>
                <AutoGrowTextarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. New patient offer for root canal treatment" rows={3} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Slides — {slideCount}</Label>
                <input type="range" min={2} max={10} value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} className="w-full accent-[color:var(--teal)]" disabled={loading} />
              </div>
              {row.category === "did-you-know" && (
                <StatisticFields
                  statistic={statistic} setStatistic={setStatistic}
                  statisticSource={statisticSource} setStatisticSource={setStatisticSource}
                  statisticContext={statisticContext} setStatisticContext={setStatisticContext}
                />
              )}
              {outOfCredits ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive">You've used all your AI generations this period.</p>
                  <Button size="sm" className="w-full" onClick={() => window.location.href = "/subscription"}>
                    {growthButtonLabel(trialEligible)}
                  </Button>
                </div>
              ) : (
                <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Generating…" : result ? "Regenerate" : "Generate Carousel"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0">
          {result ? (
            <CarouselPreview
              key={resultKey}
              post={result} specialty={specialty} rowId={rowId} category={row.category} topic={topic}
              initialSlideImages={sessionSeed?.initialSlideImages ?? null}
              initialCustomization={sessionSeed?.initialCustomization?.kind === "carousel" ? sessionSeed.initialCustomization : null}
              renderKey={row.render_key}
            />
          ) : (
            <Card className="border-border/60">
              <CardContent className="pt-6 space-y-4">
                <PreviewToolbar title={`Preview — ${row.name}`} />
                <div className="mx-auto w-full max-w-md">
                  {sample && <CarouselPreviewCanvas sample={sample} brand={brand} renderKey={row.render_key} slideIdx={Math.min(1, sample.slides.length - 1)} />}
                </div>
                {!loading ? (
                  <p className="text-center text-xs text-muted-foreground">Sample content shown — fill in your brief and generate to create your own.</p>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating your carousel…
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Story (kind "story") in-place creation workspace — same reuse philosophy as
 * PostWorkspace/CarouselWorkspace; the generated result renders via the
 * exported StoryPreview, which already dispatches through the fixed
 * storyTemplates registry entry (renderKey) with its own AI image generation,
 * download (1080x1920), and persistence built in.
 */
function StoryWorkspace({ row, rowIdParam, onBack, onGenerated }: {
  row: TemplateRow; rowIdParam?: string; onBack: () => void; onGenerated: (rowId: string) => void;
}) {
  const { user } = useAuth();
  const [brand] = useBrandKit();
  const trialEligible = useGrowthTrialEligible(user?.id);
  const callGenerate = useServerFn(generateContent);
  const sample = STORY_SAMPLES[row.id];

  const [specialty, setSpecialty] = useState(brand.specialty || "");
  const specialtyTouchedRef = useRef(false);
  useEffect(() => {
    if (brand.specialty && !specialtyTouchedRef.current) setSpecialty(brand.specialty);
  }, [brand.specialty]);

  const [topic, setTopic] = useState("");
  const [statistic, setStatistic] = useState("");
  const [statisticSource, setStatisticSource] = useState("");
  const [statisticContext, setStatisticContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [result, setResult] = useState<StoryPost | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  const [resultKey, setResultKey] = useState<string>("none");
  const [sessionSeed, setSessionSeed] = useState<StudioSessionRow | null>(null);

  const restoringRef = useRef<string | null>(null);
  useEffect(() => {
    if (!rowIdParam || rowIdParam === rowId || restoringRef.current === rowIdParam) return;
    restoringRef.current = rowIdParam;
    let cancelled = false;
    (async () => {
      const restored = await fetchStudioSessionRow(rowIdParam);
      if (cancelled || !restored || restored.result.kind !== "story") return;
      setResult(restored.result);
      setRowId(rowIdParam);
      setResultKey(rowIdParam);
      setSessionSeed(restored);
    })();
    return () => { cancelled = true; };
  }, [rowIdParam, rowId]);

  async function handleGenerate() {
    if (!topic.trim()) { toast.error("Please enter a topic"); return; }
    if (row.category === "did-you-know" && (!statistic.trim() || !statisticSource.trim())) {
      toast.error("Please add the statistic and its source — Medipost formats it, but never invents the number.");
      return;
    }
    setLoading(true);
    setOutOfCredits(false);
    try {
      const out = await callGenerate({
        data: {
          kind: "story", category: row.category,
          specialty: specialty.trim() || "General Physician", topic: topic.trim(),
          tone: "Standard", audience: "General Public",
          brand: brandPayload(brand), templateId: row.id, renderKey: row.render_key ?? undefined,
          statistic: statistic.trim() || undefined,
          statisticSource: statisticSource.trim() || undefined,
          statisticContext: statisticContext.trim() || undefined,
        },
      });
      const out2 = out as StoryPost & { _rowId?: string };
      const newRowId = out2._rowId ?? null;
      setResult(out2);
      setRowId(newRowId);
      setResultKey(newRowId ?? `gen-${Date.now()}`);
      setSessionSeed(null);
      toast.success("Your story is ready");
      if (newRowId) onGenerated(newRowId);
    } catch (e) {
      const msg = errorToastFor(e);
      if (msg === "__INSUFFICIENT_CREDITS__") {
        setOutOfCredits(true);
        toast.error("You've used all your AI generations this period. Upgrade your plan to continue.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Template Studio
      </button>

      <div className="grid gap-6 md:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{row.name}</h2>
                {row.description && <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Specialty</Label>
                <SpecialtySelect value={specialty} onChange={(v) => { specialtyTouchedRef.current = true; setSpecialty(v); }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Topic / Brief</Label>
                <AutoGrowTextarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. New patient offer for root canal treatment" rows={3} disabled={loading} />
              </div>
              {row.category === "did-you-know" && (
                <StatisticFields
                  statistic={statistic} setStatistic={setStatistic}
                  statisticSource={statisticSource} setStatisticSource={setStatisticSource}
                  statisticContext={statisticContext} setStatisticContext={setStatisticContext}
                />
              )}
              {outOfCredits ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive">You've used all your AI generations this period.</p>
                  <Button size="sm" className="w-full" onClick={() => window.location.href = "/subscription"}>
                    {growthButtonLabel(trialEligible)}
                  </Button>
                </div>
              ) : (
                <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Generating…" : result ? "Regenerate" : "Generate Story"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0">
          {result ? (
            <StoryPreview
              key={resultKey}
              post={result} specialty={specialty} rowId={rowId}
              initialImageUrl={sessionSeed?.initialImageUrl ?? null}
              initialCustomization={sessionSeed?.initialCustomization?.kind === "story" ? sessionSeed.initialCustomization : null}
              renderKey={row.render_key}
            />
          ) : (
            <Card className="border-border/60">
              <CardContent className="pt-6 space-y-4">
                <PreviewToolbar title={`Preview — ${row.name}`} />
                <div className="mx-auto w-full max-w-xs">
                  {sample && <StoryPreviewCanvas sample={sample} brand={brand} renderKey={row.render_key} />}
                </div>
                {!loading ? (
                  <p className="text-center text-xs text-muted-foreground">Sample content shown — fill in your brief and generate to create your own.</p>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating your story…
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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

  // Every format's catalog row stays on /templates -- selecting any card (Poster,
  // Post, Carousel, or Story) opens its in-place creation workspace via
  // ?templateId=, never navigates to /generate. See PosterWorkspace/
  // PostWorkspace/CarouselWorkspace/StoryWorkspace below and this route's
  // validateSearch. Content Studio's own /generate route is untouched and still
  // supports its ?kind=&renderKey= entry as latent infrastructure (the same
  // SinglePostPreview/CarouselPreview/StoryPreview these workspaces reuse), it
  // is simply no longer reachable from Template Studio's UI.
  function useTemplate(t: TemplateRow) {
    setPreviewId(null); // close the preview dialog before entering the workspace
    navigate({ to: "/templates", search: { templateId: t.id } });
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

  // A selected row (any format) renders its in-place creation workspace
  // instead of the browse grid. A ?templateId= that doesn't resolve yet/at
  // all falls through to the ordinary browse view.
  const selectedRow = search.templateId ? resolvedTemplates.find((t) => t.id === search.templateId) ?? null : null;

  if (search.templateId && templates === null) {
    // Catalog still loading -- avoid a flash of the full browse grid/skeleton
    // behind a template that's about to become the workspace.
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedRow) {
    const onBack = () => navigate({ to: "/templates", search: {} });
    const onGenerated = (newRowId: string) =>
      navigate({ to: "/templates", search: { templateId: selectedRow.id, rowId: newRowId }, replace: true });
    switch (selectedRow.format) {
      case "template": return <PosterWorkspace row={selectedRow} rowIdParam={search.rowId} onBack={onBack} onGenerated={onGenerated} />;
      case "single":   return <PostWorkspace row={selectedRow} rowIdParam={search.rowId} onBack={onBack} onGenerated={onGenerated} />;
      case "carousel": return <CarouselWorkspace row={selectedRow} rowIdParam={search.rowId} onBack={onBack} onGenerated={onGenerated} />;
      case "story":    return <StoryWorkspace row={selectedRow} rowIdParam={search.rowId} onBack={onBack} onGenerated={onGenerated} />;
    }
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
