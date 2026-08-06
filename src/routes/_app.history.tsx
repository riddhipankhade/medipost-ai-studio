import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Copy, Loader2, Star, ImageDown, Eye } from "lucide-react";
import { isExportableNode } from "@/lib/export-filter";
import { RemoveWatermarkRow } from "@/components/Watermark";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import StoryCard from "@/components/StoryCard";
import FestiveCard from "@/components/FestiveCard";
import { SlideCanvas, ExactScalePreview, CREATIVE_DESIGN_WIDTH } from "@/routes/_app.generate";
import { useBrandKit } from "@/lib/brand-kit";
import type { ContentCategory } from "@/lib/mock-data";
import type { SlideCanvasProps } from "@/components/carousel-layouts";
import { getTemplateFrame } from "@/components/template-frames";
import { ShareButtons } from "@/components/ShareButtons";
import {
  parseCustomization,
  resolveTheme,
  resolveFestiveColors,
  resolveTemplateColors,
  defaultSingleCustomization,
  defaultCarouselCustomization,
  defaultFestiveCustomization,
  defaultTemplateCustomization,
} from "@/lib/post-customization";

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "Content History — Medipost AI" }] }),
  component: History,
});

// ── Types ────────────────────────────────────────────────────────────────────

type ContentRow = {
  id:                  string;
  workflow_kind:       string;
  content_category:    string;
  specialty:           string;
  topic:               string;
  generated_text:      string | null;
  generated_image_url: string | null;
  customization:       unknown;
  hashtags:            string[];
  status:              string;
  is_favorite:         boolean;
  ai_model:            string | null;
  created_at:          string;
};

type BrandSnap = {
  doctorName:     string;
  clinicName:     string;
  phone:          string;
  website?:       string;
  address?:       string;
  primaryColor?:  string;
  secondaryColor?: string;
  logo?:          string;
  doctorPhoto?:   string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const KIND_LABELS: Record<string, string> = {
  single:   "Single Post",
  carousel: "Carousel",
  story:    "Story",
  reel:     "Reel Script",
  campaign: "Campaign",
  festive:  "Festive",
  template: "Template Post",
};

function parsePost(text: string | null): Record<string, any> | null {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function bodyPreview(row: ContentRow): string {
  const p = parsePost(row.generated_text);
  if (!p) return row.generated_text?.slice(0, 200) ?? "—";
  switch (row.workflow_kind) {
    case "carousel": return (p.slides?.[0]?.content ?? p.title ?? "").slice(0, 200);
    case "festive":  return (p.greeting ?? "").slice(0, 200);
    case "story":    return (p.message ?? "").slice(0, 200);
    case "reel":     return (p.hook ?? "").slice(0, 200);
    case "campaign": return (p.objective ?? "").slice(0, 200);
    case "template": return (p.subline || p.headline || "").slice(0, 200);
    default:         return (p.content ?? "").slice(0, 200);
  }
}

function parseSlideImages(row: ContentRow): (string | null)[] {
  const u = row.generated_image_url;
  if (!u?.startsWith("[")) return [];
  try {
    const arr = JSON.parse(u);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function rowHasImage(row: ContentRow): boolean {
  const u = row.generated_image_url;
  if (!u) return false;
  return u.startsWith("[") ? parseSlideImages(row).some(Boolean) : true;
}

function fullCopyText(row: ContentRow): string {
  const p = parsePost(row.generated_text);
  if (!p) return row.topic;
  const parts: string[] = [];
  if (p?.headline)          parts.push(p.headline);
  if (p?.subline)           parts.push(p.subline);
  if (p?.slides?.length)    parts.push(p.slides.map((s: any) => `${s.title}\n${s.content}`).join("\n\n"));
  if (p?.content)           parts.push(p.content);
  if (p?.caption)           parts.push(p.caption);
  if (p?.cta)               parts.push(p.cta);
  if (p?.greeting)          parts.push(p.greeting);
  if (p?.hook)              parts.push(p.hook);
  if (p?.talkingPoints?.length) parts.push(p.talkingPoints.join("\n"));
  if (row.hashtags?.length) parts.push(row.hashtags.join(" "));
  return parts.join("\n\n") || row.topic;
}

// ── Card download hook ──────────────────────────────────────────────────────

function useCardDownload(doctorName: string) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const download = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);

    const imgEl = cardRef.current.querySelector("img") as HTMLImageElement | null;
    const originalSrc = imgEl?.src ?? null;
    let swapped = false;
    if (imgEl && originalSrc && !originalSrc.startsWith("data:")) {
      try {
        const res = await fetch(originalSrc);
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((ok, fail) => {
          const r = new FileReader();
          r.onload  = () => ok(r.result as string);
          r.onerror = fail;
          r.readAsDataURL(blob);
        });
        imgEl.src = dataUrl;
        swapped = true;
      } catch {}
    }

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: isExportableNode,
      });
      const slug = doctorName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const link = document.createElement("a");
      link.download = `medipost-${slug}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Post downloaded!");
    } catch (err) {
      console.error("[download]", err);
      toast.error("Download failed — check console.");
    } finally {
      if (swapped && imgEl && originalSrc) imgEl.src = originalSrc;
      setDownloading(false);
    }
  }, [doctorName]);

  return { cardRef, download, downloading };
}

// ── Post Detail Dialog ────────────────────────────────────────────────────────

function PostDetailDialog({
  row,
  brand,
  open,
  onClose,
}: {
  row: ContentRow;
  brand: BrandSnap;
  open: boolean;
  onClose: () => void;
}) {
  const p = parsePost(row.generated_text);
  const { cardRef, download, downloading } = useCardDownload(
    brand.doctorName || brand.clinicName || "medipost"
  );
  const [slideBrand] = useBrandKit();

  const kind = row.workflow_kind;

  const hasImage = !!row.generated_image_url && !row.generated_image_url.startsWith("[");
  const directImageUrl = hasImage ? row.generated_image_url! : undefined;

  const slides: { title: string; content: string }[] = kind === "carousel" ? (p?.slides ?? []) : [];
  const [slideIdx, setSlideIdx] = useState(0);
  const slideImages = kind === "carousel" ? parseSlideImages(row) : [];

  const isStory    = kind === "story";
  const isFestive  = kind === "festive";
  const isSingle   = kind === "single";
  const isCarousel = kind === "carousel";
  const isReel     = kind === "reel";
  const isCampaign = kind === "campaign";
  const isTemplate = kind === "template";

  // Read the Studio customization the user actually finalized; fall back to
  // today's computed defaults for older rows (or anything that fails
  // validation) so nothing here duplicates Studio's own resolution logic —
  // both call the exact same resolveTheme/resolveFestiveColors/
  // resolveTemplateColors/defaultXCustomization functions from post-customization.ts.
  const singleCustom = isSingle
    ? parseCustomization(row.customization, "single")
      ?? defaultSingleCustomization({ headline: p?.headline ?? row.topic, content: p?.content ?? "" }, row.content_category as ContentCategory, row.specialty)
    : null;
  const carouselCustom = isCarousel
    ? parseCustomization(row.customization, "carousel")
      ?? defaultCarouselCustomization({ slides }, row.content_category as ContentCategory, row.specialty)
    : null;
  const festiveCustom = isFestive
    ? parseCustomization(row.customization, "festive") ?? defaultFestiveCustomization()
    : null;
  const templateCustom = isTemplate
    ? parseCustomization(row.customization, "template") ?? defaultTemplateCustomization()
    : null;

  // Template frame choice now comes from persisted customization (falls back
  // to the default frame for older rows that never saved one).
  const TemplateFrame = isTemplate && templateCustom ? getTemplateFrame(templateCustom.frameId).Frame : null;
  const templateProps = isTemplate && templateCustom
    ? {
        headline: p?.headline ?? row.topic,
        subline:  p?.subline ?? "",
        cta:      p?.cta ?? "",
        logo:         brand.logo,
        businessName: brand.clinicName,
        phone:        brand.phone,
        colors: resolveTemplateColors(templateCustom, slideBrand, p?.visual?.colors ?? []),
        imageUrl: directImageUrl ?? null,
        imageOffsetX: templateCustom.imageOffsetX, imageOffsetY: templateCustom.imageOffsetY, imageZoom: templateCustom.imageZoom,
      }
    : null;

  const canvasProps: SlideCanvasProps | null =
    isSingle && singleCustom
      ? {
          slideTitle: p?.headline ?? row.topic,
          slideBody: p?.content ?? "",
          slideIndex: 0,
          totalSlides: 1,
          isCta: true,
          cta: p?.cta ?? "",
          specialty: row.specialty,
          theme: resolveTheme(singleCustom.theme, slideBrand),
          layout: singleCustom.strategy.layout,
          fontScale: singleCustom.theme.fontScale,
          showIcons: singleCustom.theme.showIcons,
          brand: slideBrand,
          imageUrl: directImageUrl,
          topic: row.topic,
          category: row.content_category as ContentCategory,
          composition: singleCustom.strategy.composition,
        }
      : isCarousel && carouselCustom && slides[slideIdx]
      ? {
          slideTitle: slides[slideIdx].title,
          slideBody: slides[slideIdx].content,
          slideIndex: slideIdx,
          totalSlides: slides.length,
          isCta: slideIdx === slides.length - 1,
          cta: p?.cta ?? "",
          specialty: row.specialty,
          theme: resolveTheme(carouselCustom.theme, slideBrand),
          layout: carouselCustom.slides[slideIdx]?.layout ?? "centered",
          fontScale: carouselCustom.theme.fontScale,
          showIcons: carouselCustom.theme.showIcons,
          brand: slideBrand,
          imageUrl: slideImages[slideIdx] ?? undefined,
          topic: row.topic,
          category: row.content_category as ContentCategory,
          composition: carouselCustom.slides[slideIdx]?.composition ?? "balanced",
        }
      : null;

  const wideDialog = isCarousel || isCampaign;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${wideDialog ? "max-w-[560px]" : "max-w-[460px]"} p-4 max-h-[90vh] overflow-y-auto min-w-0`}>
        <DialogHeader className="pb-1 pr-6 min-w-0">
          <DialogTitle className="text-base font-semibold">
            {KIND_LABELS[kind] ?? kind}
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Prompt
          </p>
          <p className="text-sm font-medium leading-snug wrap-break-word">{row.topic}</p>
        </div>

        {isCarousel && canvasProps && (
          <div className="space-y-3">
            <div className="flex justify-center overflow-auto max-h-[70vh]">
              <div className="w-full max-w-md">
                <ExactScalePreview>
                  <SlideCanvas {...canvasProps} />
                </ExactScalePreview>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" disabled={slideIdx === 0} onClick={() => setSlideIdx(i => i - 1)}>← Prev</Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={slideIdx === slides.length - 1} onClick={() => setSlideIdx(i => i + 1)}>Next →</Button>
            </div>
          </div>
        )}

        {isReel && (
          <div className="space-y-3 max-h-[65vh] overflow-y-auto">
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">🎬 Hook (first 3 seconds)</p>
              <p className="font-semibold text-base leading-snug">{p?.hook ?? row.topic}</p>
            </div>
            {(p?.talkingPoints?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Talking Points</p>
                {(p?.talkingPoints ?? []).map((pt: string, i: number) => (
                  <div key={i} className="flex gap-2 items-start rounded-lg border bg-muted/20 p-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <p className="text-sm leading-relaxed">{pt}</p>
                  </div>
                ))}
              </div>
            )}
            {p?.cta && (
              <div className="rounded-lg border border-dashed border-primary/40 p-3 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">CTA</p>
                <p className="text-sm font-medium text-primary">{p.cta}</p>
              </div>
            )}
            {row.hashtags?.length > 0 && <p className="text-xs text-muted-foreground line-clamp-2">{row.hashtags.join(" ")}</p>}
          </div>
        )}

        {isCampaign && (
          <div className="space-y-3 max-h-[65vh] overflow-y-auto">
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">📣 Campaign Theme</p>
              <p className="font-semibold text-base">{p?.theme ?? row.topic}</p>
              {p?.objective && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.objective}</p>}
            </div>
            {(p?.weeklySchedule?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Weekly Schedule</p>
                <div className="space-y-1.5">
                  {(p?.weeklySchedule ?? []).map((d: any, i: number) => (
                    <div key={i} className="flex gap-2 items-start rounded-lg border bg-muted/20 p-2.5 text-sm">
                      <span className="w-8 font-bold text-primary flex-shrink-0">{d.day}</span>
                      <span className="text-xs bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 flex-shrink-0">{d.format}</span>
                      <span className="text-muted-foreground leading-snug">{d.idea}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(p?.ctaSuggestions?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">CTA Ideas</p>
                <div className="flex flex-wrap gap-1.5">
                  {(p?.ctaSuggestions ?? []).map((c: string, i: number) => (
                    <span key={i} className="text-xs border rounded-full px-2.5 py-1 bg-background">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isSingle && canvasProps && (
          <div className="flex justify-center overflow-auto max-h-[70vh]">
            <div className="w-full max-w-md">
              <ExactScalePreview>
                <SlideCanvas {...canvasProps} />
              </ExactScalePreview>
            </div>
          </div>
        )}

        {canvasProps && (
          <div aria-hidden className="fixed pointer-events-none" style={{ left: -10000, top: 0, width: CREATIVE_DESIGN_WIDTH }}>
            <div ref={cardRef}>
              <SlideCanvas {...canvasProps} />
            </div>
          </div>
        )}

        {isStory && (
          <div className="flex justify-center overflow-auto max-h-[70vh]">
            <StoryCard
              ref={cardRef}
              headline={p?.headline ?? row.topic}
              message={p?.message ?? ""}
              cta={p?.cta ?? ""}
              colors={p?.visual?.colors ?? []}
              brand={slideBrand}
              specialty={row.specialty}
              imageUrl={directImageUrl}
            />
          </div>
        )}

        {isTemplate && TemplateFrame && templateProps && (
          <>
            <div className="flex justify-center overflow-auto max-h-[70vh]">
              <div className="w-full max-w-md">
                <ExactScalePreview>
                  <TemplateFrame {...templateProps} />
                </ExactScalePreview>
              </div>
            </div>
            {/* offscreen full-size render — capture source for the PNG download */}
            <div aria-hidden className="fixed pointer-events-none" style={{ left: -10000, top: 0, width: CREATIVE_DESIGN_WIDTH }}>
              <div ref={cardRef}>
                <TemplateFrame {...templateProps} />
              </div>
            </div>
          </>
        )}

        {isFestive && festiveCustom && (
          <div className="flex justify-center overflow-auto max-h-[70vh]">
            <FestiveCard
              ref={cardRef}
              festival={p?.festival ?? row.topic}
              greeting={p?.greeting ?? ""}
              colors={p?.visual?.colors ?? []}
              brand={{
                doctorName:    brand.doctorName,
                clinicName:    brand.clinicName,
                phone:         brand.phone,
                website:       brand.website,
                address:       brand.address,
                primaryColor:  brand.primaryColor,
                secondaryColor: brand.secondaryColor,
                logo:          brand.logo,
                doctorPhoto:   brand.doctorPhoto,
              }}
              specialty={row.specialty}
              imageUrl={directImageUrl}
              colorOverrides={resolveFestiveColors(festiveCustom, slideBrand, p?.visual?.colors ?? [])}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline" size="sm" className="flex-1 gap-1.5"
            onClick={() => { navigator.clipboard.writeText(fullCopyText(row)); toast.success("Copied to clipboard"); }}
          >
            <Copy className="h-3.5 w-3.5" /> Copy Text
          </Button>
          {(isStory || isFestive || isSingle || isCarousel || isTemplate) && (
            <Button size="sm" className="flex-1 gap-1.5" onClick={download} disabled={downloading}>
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />}
              {isCarousel ? `Download Slide ${slideIdx + 1}` : "Download Post"}
            </Button>
          )}
        </div>
        <RemoveWatermarkRow />

        {/* Share buttons */}
        <div className="border-t border-border pt-3">
          <ShareButtons text={fullCopyText(row)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function History() {
  const [rows,    setRows]    = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [brand,   setBrand]   = useState<BrandSnap>({ doctorName: "", clinicName: "", phone: "" });
  const [q,       setQ]       = useState("");
  const [kind,    setKind]    = useState("all");
  const [range,   setRange]   = useState("all");
  const [selected, setSelected] = useState<ContentRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not signed in."); setLoading(false); return; }

      const { data: bk } = await supabase
        .from("brand_kits")
        .select("doctor_name, clinic_name, phone, website, address, logo_url, doctor_photo_url, brand_colors")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && bk) {
        const colors = (bk.brand_colors ?? {}) as Record<string, string>;
        setBrand({
          doctorName:     bk.doctor_name ?? "",
          clinicName:     bk.clinic_name ?? "",
          phone:          bk.phone ?? "",
          website:        bk.website ?? undefined,
          address:        bk.address ?? undefined,
          logo:           bk.logo_url ?? undefined,
          doctorPhoto:    bk.doctor_photo_url ?? undefined,
          primaryColor:   colors.primary ?? undefined,
          secondaryColor: colors.secondary ?? undefined,
        });
      }

      const { data, error: dbErr } = await supabase
        .from("content_generations")
        .select(
          "id, workflow_kind, content_category, specialty, topic, " +
          "generated_text, generated_image_url, customization, hashtags, status, " +
          "is_favorite, ai_model, created_at"
        )
        .eq("user_id", user.id)
        .eq("status", "completed")
        .neq("generated_text", "")
        .not("generated_text", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);

      if (cancelled) return;
      if (dbErr) setError(dbErr.message);
      else setRows((data as unknown as ContentRow[]) ?? []);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function toggleFavourite(id: string, current: boolean) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, is_favorite: !current } : r));
    const { error: upErr } = await supabase
      .from("content_generations")
      .update({ is_favorite: !current })
      .eq("id", id);
    if (upErr) {
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, is_favorite: current } : r));
      toast.error("Could not update favourite.");
    }
  }

  const items = useMemo(() => rows.filter((c) => {
    if (kind !== "all" && c.workflow_kind !== kind) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (!(c.topic + " " + (c.generated_text ?? "")).toLowerCase().includes(needle)) return false;
    }
    if (range !== "all") {
      const cutoff = Date.now() - parseInt(range, 10) * 86_400_000;
      if (new Date(c.created_at).getTime() < cutoff) return false;
    }
    return true;
  }), [rows, q, kind, range]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Content History</h1>
        <p className="text-muted-foreground mt-1">
          Click <strong>View Post</strong> on any item to preview and download the branded card.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search content…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(KIND_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All time" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /><span>Loading history…</span>
        </div>
      )}
      {!loading && error && <p className="text-center text-destructive py-12">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-3 min-w-0">
          {items.map((c) => (
            <Card
              key={c.id}
              className="min-w-0 overflow-hidden border-border/60 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(c)}
            >
              <CardContent className="py-4 min-w-0">
                <div className="flex items-start justify-between gap-4 min-w-0">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="secondary">{KIND_LABELS[c.workflow_kind] ?? c.workflow_kind}</Badge>
                      {c.specialty && <Badge variant="outline">{c.specialty}</Badge>}
                      {c.content_category && (
                        <Badge variant="outline" className="capitalize">
                          {c.content_category.replace("-", " ")}
                        </Badge>
                      )}
                      {rowHasImage(c) && (
                        <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                          Has Image
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Prompt
                    </p>
                    <p className="font-semibold text-foreground line-clamp-2 wrap-break-word">{c.topic}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {bodyPreview(c)}
                    </p>
                    {c.hashtags?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {c.hashtags.slice(0, 5).join(" ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => toggleFavourite(c.id, c.is_favorite)}
                      className={c.is_favorite ? "text-yellow-500" : "text-muted-foreground"}
                    >
                      <Star className="h-3.5 w-3.5" fill={c.is_favorite ? "currentColor" : "none"} />
                    </Button>
                    <Button
                      variant="outline" size="sm" className="gap-1.5"
                      onClick={() => setSelected(c)}
                    >
                      <Eye className="h-3.5 w-3.5" /> View Post
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="gap-1.5"
                      onClick={() => { navigator.clipboard.writeText(fullCopyText(c)); toast.success("Copied"); }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && rows.length > 0 && (
            <p className="text-center text-muted-foreground py-12">No content matches your filters.</p>
          )}
          {items.length === 0 && rows.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No content generated yet. Head to Generate to create your first post.
            </p>
          )}
        </div>
      )}

      {selected && (
        <PostDetailDialog
          row={selected}
          brand={brand}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}