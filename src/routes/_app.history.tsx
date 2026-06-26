import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Copy, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "Content History — Medipost AI" }] }),
  component: History,
});

// ── Types ────────────────────────────────────────────────────────────────────

type ContentRow = {
  id:                 string;
  workflow_kind:      string;
  content_category:   string;
  specialty:          string;
  topic:              string;
  generated_text:     string | null;
  generated_image_url:string | null;
  hashtags:           string[];
  status:             string;
  is_favorite:        boolean;
  ai_model:           string | null;
  created_at:         string;
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

/** Extract a human-readable preview from the stored JSON. */
function bodyPreview(row: ContentRow): string {
  if (!row.generated_text) return "—";
  try {
    const parsed = JSON.parse(row.generated_text);
    return (
      parsed?.content   ||
      parsed?.greeting  ||
      parsed?.message   ||
      parsed?.hook      ||
      parsed?.objective ||
      parsed?.title     ||
      row.generated_text
    ).slice(0, 300);
  } catch {
    return row.generated_text.slice(0, 300);
  }
}

/** Text to copy to clipboard — full generated content if available. */
function copyText(row: ContentRow): string {
  if (!row.generated_text) return row.topic;
  try {
    const parsed = JSON.parse(row.generated_text);
    const parts: string[] = [];
    if (parsed?.headline) parts.push(parsed.headline);
    if (parsed?.content)  parts.push(parsed.content);
    if (parsed?.caption)  parts.push(parsed.caption);
    if (parsed?.cta)      parts.push(parsed.cta);
    if (parsed?.greeting) parts.push(parsed.greeting);
    if (parsed?.hook)     parts.push(parsed.hook);
    if (parsed?.talkingPoints?.length)
      parts.push(parsed.talkingPoints.join("\n"));
    if (row.hashtags?.length) parts.push(row.hashtags.join(" "));
    return parts.length ? parts.join("\n\n") : row.generated_text;
  } catch {
    return row.generated_text;
  }
}

// ── Component ────────────────────────────────────────────────────────────────

function History() {
  const [rows,    setRows]    = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [q,       setQ]       = useState("");
  const [kind,    setKind]    = useState("all");
  const [range,   setRange]   = useState("all");

  // ── Fetch from content_generations ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not signed in.");
        setLoading(false);
        return;
      }

      const { data, error: dbErr } = await supabase
        .from("content_generations")
        .select(
          "id, workflow_kind, content_category, specialty, topic, " +
          "generated_text, generated_image_url, hashtags, status, " +
          "is_favorite, ai_model, created_at"
        )
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(200);

      if (cancelled) return;

      if (dbErr) {
        setError(dbErr.message);
      } else {
        setRows((data as unknown as ContentRow[]) ?? []);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Toggle favourite ──────────────────────────────────────────────────────
  async function toggleFavourite(id: string, current: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_favorite: !current } : r))
    );
    const { error: upErr } = await supabase
      .from("content_generations")
      .update({ is_favorite: !current })
      .eq("id", id);
    if (upErr) {
      // revert on failure
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_favorite: current } : r))
      );
      toast.error("Could not update favourite.");
    }
  }

  // ── Client-side filter ────────────────────────────────────────────────────
  const items = useMemo(() => {
    return rows.filter((c) => {
      if (kind !== "all" && c.workflow_kind !== kind) return false;

      if (q) {
        const needle = q.toLowerCase();
        const haystack = (c.topic + " " + (c.generated_text ?? "")).toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      if (range !== "all") {
        const days   = parseInt(range, 10);
        const cutoff = Date.now() - days * 86_400_000;
        if (new Date(c.created_at).getTime() < cutoff) return false;
      }

      return true;
    });
  }, [rows, q, kind, range]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Content History</h1>
        <p className="text-muted-foreground mt-1">
          Search, filter, and reuse your generated content.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(KIND_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All time" />
          </SelectTrigger>
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
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading history…</span>
        </div>
      )}

      {!loading && error && (
        <p className="text-center text-destructive py-12">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid gap-3">
          {items.map((c) => (
            <Card key={c.id} className="border-border/60">
              <CardContent className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="secondary">
                        {KIND_LABELS[c.workflow_kind] ?? c.workflow_kind}
                      </Badge>
                      {c.specialty && (
                        <Badge variant="outline">{c.specialty}</Badge>
                      )}
                      {c.content_category && (
                        <Badge variant="outline" className="capitalize">
                          {c.content_category.replace("-", " ")}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="font-medium">{c.topic}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">
                      {bodyPreview(c)}
                    </p>

                    {c.hashtags?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {c.hashtags.slice(0, 5).join(" ")}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavourite(c.id, c.is_favorite)}
                      className={c.is_favorite ? "text-yellow-500" : "text-muted-foreground"}
                      title={c.is_favorite ? "Remove from favourites" : "Add to favourites"}
                    >
                      <Star className="h-3.5 w-3.5" fill={c.is_favorite ? "currentColor" : "none"} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        navigator.clipboard.writeText(copyText(c));
                        toast.success("Copied to clipboard");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && rows.length > 0 && (
            <p className="text-center text-muted-foreground py-12">
              No content matches your filters.
            </p>
          )}

          {items.length === 0 && rows.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No content generated yet. Head to Generate to create your first post.
            </p>
          )}
        </div>
      )}
    </div>
  );
}