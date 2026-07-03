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
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PostCard from "@/components/PostCard";

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
  hashtags:            string[];
  status:              string;
  is_favorite:         boolean;
  ai_model:            string | null;
  created_at:          string;
};

type BrandSnap = {
  doctorName: string;
  clinicName: string;
  phone:      string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const KIND_LABELS: Record<string, string> = {
  single:   "Single Post",
  carousel: "Carousel",
  story:    "Story",
  reel:     "Reel Script",
  campaign: "Campaign",
  festive:  "Festive",
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
    default:         return (p.content ?? "").slice(0, 200);
  }
}

function fullCopyText(row: ContentRow): string {
  const p = parsePost(row.generated_text);
  if (!p) return row.topic;
  const parts: string[] = [];
  if (p?.headline)          parts.push(p.headline);
  if (p?.content)           parts.push(p.content);
  if (p?.caption)           parts.push(p.caption);
  if (p?.cta)               parts.push(p.cta);
  if (p?.greeting)          parts.push(p.greeting);
  if (p?.hook)              parts.push(p.hook);
  if (p?.talkingPoints?.length) parts.push(p.talkingPoints.join("\n"));
  if (row.hashtags?.length) parts.push(row.hashtags.join(" "));
  return parts.join("\n\n") || row.topic;
}

// ── PostCard download hook ─────────────────────────────────────────────────────
// Pre-fetches the card's <img> as a data URL at download time only (not on
// render), so html-to-image can capture it without CORS issues.

function useCardDownload(doctorName: string) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const download = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);

    // --- swap external img src → data URL before capture ---
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
      } catch {
        // CORS or network error — proceed with current src (may miss image in PNG)
      }
    }

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: (node) => node.nodeName !== "SCRIPT",
      });
      const slug = doctorName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const link = document.createElement("a");
      link.download = `medipost-${slug}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PostCard downloaded!");
    } catch (err) {
      console.error("[download]", err);
      toast.error("Download failed — check console.");
    } finally {
      // restore original src
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

  const kind = row.workflow_kind;
  const hashtags = row.hashtags?.join(" ") ?? "";

  // For PostCard types: extract title + body based on JSON shape per kind
  const { title, bodyText } = (() => {
    if (!p) return { title: row.topic, bodyText: "" };
    switch (kind) {
      case "single":  return { title: p.headline ?? row.topic, bodyText: p.content ?? "" };
      case "festive": return { title: p.festival ? `Happy ${p.festival}!` : row.topic, bodyText: p.greeting ?? "" };
      case "story":   return { title: p.headline ?? row.topic, bodyText: p.message ?? "" };
      default:        return { title: row.topic, bodyText: "" };
    }
  })();

  // Direct URL — browser <img> displays cross-origin URLs fine without CORS attr.
  // Pre-fetch as data URL happens only at download time (in useCardDownload).
  const hasImage = !!row.generated_image_url && !row.generated_image_url.startsWith("[");
  const directImageUrl = hasImage ? row.generated_image_url! : undefined;

  // Carousel state
  const slides: { title: string; content: string }[] = kind === "carousel" ? (p?.slides ?? []) : [];
  const [slideIdx, setSlideIdx] = useState(0);

  // Reel / Campaign don't use PostCard — they have dedicated viewers
  const isPostCard = kind === "single" || kind === "festive" || kind === "story";
  const isCarousel = kind === "carousel";
  const isReel     = kind === "reel";
  const isCampaign = kind === "campaign";

  const wideDialog = isCarousel || isCampaign;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${wideDialog ? "max-w-[560px]" : "max-w-[460px]"} p-4`}>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-semibold truncate">{row.topic}</DialogTitle>
        </DialogHeader>

        {/* ── CAROUSEL viewer ── */}
        {isCarousel && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{p?.title ?? row.topic}</span>
              <span>Slide {slideIdx + 1} / {slides.length}</span>
            </div>
            {slides[slideIdx] && (
              <div className="rounded-xl border bg-muted/30 p-5 min-h-[140px]">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Slide {slideIdx + 1}</p>
                <p className="font-semibold text-base leading-snug mb-2">{slides[slideIdx].title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{slides[slideIdx].content}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" disabled={slideIdx === 0} onClick={() => setSlideIdx(i => i - 1)}>← Prev</Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={slideIdx === slides.length - 1} onClick={() => setSlideIdx(i => i + 1)}>Next →</Button>
            </div>
            <div className="flex justify-center gap-1.5">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setSlideIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === slideIdx ? "w-4 bg-primary" : "w-1.5 bg-border"}`} />
              ))}
            </div>
            {p?.cta && <p className="text-sm font-medium text-center text-primary">{p.cta}</p>}
            {row.hashtags?.length > 0 && <p className="text-xs text-muted-foreground text-center line-clamp-2">{row.hashtags.join(" ")}</p>}
          </div>
        )}

        {/* ── REEL SCRIPT viewer ── */}
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

        {/* ── CAMPAIGN viewer ── */}
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

        {/* ── POSTCARD viewer (single / story / festive) ── */}
        {isPostCard && (
          <div className="flex justify-center overflow-auto max-h-[70vh]">
            <PostCard
              ref={cardRef}
              doctorName={brand.doctorName || "Dr. Your Name"}
              specialty={row.specialty}
              clinicName={brand.clinicName || "Your Clinic"}
              phone={brand.phone}
              imageUrl={directImageUrl}
              title={title}
              bodyText={bodyText}
              hashtags={hashtags}
              isTrial={true}
              maxBodyLength={kind === "story" ? Infinity : 130}
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
          {isPostCard && (
            <Button size="sm" className="flex-1 gap-1.5" onClick={download} disabled={downloading}>
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />}
              Download Post
            </Button>
          )}
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

  // ── Fetch history + brand ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not signed in."); setLoading(false); return; }

      // Fetch brand kit
      const { data: bk } = await supabase
        .from("brand_kits")
        .select("doctor_name, clinic_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && bk) {
        setBrand({
          doctorName: bk.doctor_name ?? "",
          clinicName: bk.clinic_name ?? "",
          phone:      bk.phone ?? "",
        });
      }

      // Fetch content history (text rows only)
      const { data, error: dbErr } = await supabase
        .from("content_generations")
        .select(
          "id, workflow_kind, content_category, specialty, topic, " +
          "generated_text, generated_image_url, hashtags, status, " +
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

  // ── Toggle favourite ──────────────────────────────────────────────────────
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

  // ── Filter ────────────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Content History</h1>
        <p className="text-muted-foreground mt-1">
          Click <strong>View Post</strong> on any item to preview and download the branded card.
        </p>
      </div>

      {/* Filters */}
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

      {/* States */}
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
                    {/* Badges + date */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="secondary">{KIND_LABELS[c.workflow_kind] ?? c.workflow_kind}</Badge>
                      {c.specialty && <Badge variant="outline">{c.specialty}</Badge>}
                      {c.content_category && (
                        <Badge variant="outline" className="capitalize">
                          {c.content_category.replace("-", " ")}
                        </Badge>
                      )}
                      {/* Show image indicator dot */}
                      {c.generated_image_url && !c.generated_image_url.startsWith("[") && (
                        <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                          Has Image
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Topic */}
                    <p className="font-semibold text-foreground truncate">{c.topic}</p>

                    {/* Preview */}
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {bodyPreview(c)}
                    </p>

                    {/* Hashtags */}
                    {c.hashtags?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {c.hashtags.slice(0, 5).join(" ")}
                      </p>
                    )}
                  </div>

                  {/* Actions — stop propagation so card click doesn't fire */}
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

      {/* Detail dialog */}
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