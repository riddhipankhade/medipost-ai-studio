import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Heart, Crown, Sparkles, LayoutTemplate, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useBrandKit } from "@/lib/brand-kit";
import type { BrandKit } from "@/lib/brand-kit";
import { contentCategories, workflows, type ContentCategory, type WorkflowKind } from "@/lib/mock-data";
import {
  templateFrames,
  TEMPLATE_SAMPLES,
  type TemplateFrameId,
} from "@/components/template-frames";
import { ExactScalePreview, SlideCanvas } from "@/routes/_app.generate";
import { resolveVisualStrategy } from "@/lib/visual-strategy";
import { resolveTheme } from "@/lib/post-customization";
import { suggestThemeId, getTheme } from "@/lib/carousel-themes";
import StoryCard from "@/components/StoryCard";
import { getPostTemplate } from "@/components/post-templates";
import {
  POST_SAMPLES,
  CAROUSEL_SAMPLES,
  STORY_SAMPLES,
  type PostSample,
  type CarouselSample,
  type StorySample,
} from "@/lib/template-catalog-samples";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Template Studio — Medipost AI" }] }),
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
  // NULL for every format except Poster ("template") — see migration
  // 20240001000015. Post/Carousel/Story rows resolve their renderer
  // dynamically from category + content instead of a stored lookup key.
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
    case "carousel":  return !!CAROUSEL_SAMPLES[t.id];
    case "story":     return !!STORY_SAMPLES[t.id];
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

/** Deterministic theme for a static sample — same resolveTheme() formula
 *  Content Studio's SinglePostPreview/CarouselPreview use, with brand colors
 *  on (matching their own default) so the preview reflects the real brand kit. */
function sampleTheme(specialty: string, brand: BrandKit) {
  const themeId = suggestThemeId(specialty);
  return resolveTheme(
    {
      themeId, useBrandColors: true,
      headingColor: null, textColor: null, accentColor: null,
      fontFamily: getTheme(themeId).fontFamily, fontScale: 1, showIcons: true,
    },
    brand,
  );
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

function CarouselPreviewCanvas({ sample, category, brand, slideIdx }: {
  sample: CarouselSample; category: ContentCategory; brand: BrandKit; slideIdx: number;
}) {
  const total = sample.slides.length;
  const idx = Math.min(Math.max(slideIdx, 0), total - 1);
  const slide = sample.slides[idx];
  const strategy = resolveVisualStrategy(slide, category, { slideIndex: idx, totalSlides: total, isCta: idx === total - 1 });
  return (
    <ExactScalePreview>
      <SlideCanvas
        slideTitle={slide.title} slideBody={slide.content} slideIndex={idx} totalSlides={total}
        isCta={idx === total - 1} cta={sample.cta} specialty={sample.specialty} theme={sampleTheme(sample.specialty, brand)}
        layout={strategy.archetype} fontScale={1} showIcons brand={brand}
        topic={sample.topic} category={category} composition={strategy.composition}
      />
    </ExactScalePreview>
  );
}

function StoryPreviewCanvas({ sample, brand }: { sample: StorySample; brand: BrandKit }) {
  const [ref, width] = useMeasuredWidth();
  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <StoryCard
          headline={sample.headline} message={sample.message} cta={sample.cta}
          colors={[]} brand={brand} specialty={sample.specialty} width={width}
        />
      )}
    </div>
  );
}

/**
 * Dispatches to the right existing renderer for a catalog row's format —
 * Poster keeps its original getTemplateFrame()/TEMPLATE_SAMPLES path
 * unchanged; Post/Carousel/Story use the sample-content canvases above,
 * which are themselves thin wrappers around the exact same rendering
 * pipeline Content Studio uses for real generations (resolveSinglePostStrategy/
 * resolveVisualStrategy + SlideCanvas, or StoryCard) — no new renderer.
 * `slideIdx` only matters for Carousel (defaults to a representative content
 * slide, not the hook, so the card shows the archetype rather than a generic
 * opener); the preview dialog overrides it via local nav state.
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
      return <CarouselPreviewCanvas sample={sample} category={t.category} brand={brand} slideIdx={slideIdx ?? defaultIdx} />;
    }
    case "story": {
      const sample = STORY_SAMPLES[t.id];
      return <StoryPreviewCanvas sample={sample} brand={brand} />;
    }
    default:
      return null;
  }
}

const ALL = "__all__";

function TemplateStudioPage() {
  const navigate = useNavigate();
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
    colors: { primary: brand.primaryColor, secondary: brand.secondaryColor },
    placeholders: true,
  };

  // Poster rows go through /generate's ?frameId= path (unchanged since Step
  // 2) -- render_key IS the frame there. Post/Carousel/Story rows go through
  // ?kind=&renderKey=; renderKey is what makes the destination brief use the
  // exact same bespoke template renderer this card just previewed (see
  // src/components/post-templates.tsx's getPostTemplate() -- Carousel/Story
  // don't have a resolvable render_key yet in this phase, so it's simply
  // undefined for them and SinglePostPreview's sibling components fall back
  // to their current behavior unchanged). Carousel additionally passes
  // slideCount so the brief opens with the same slide count this entry demonstrated.
  function useTemplate(t: TemplateRow) {
    if (t.format === "template") {
      navigate({ to: "/generate", search: { frameId: t.render_key ?? undefined, templateId: t.id, category: t.category } });
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
