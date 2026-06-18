import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Copy,
  Loader2,
  Wand2,
  Image as ImageIcon,
  Square,
  Layers,
  Smartphone,
  Film,
  CalendarDays,
  Heart,
  ChevronLeft,
  ChevronRight,
  Heart as HeartIcon,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  specialties,
  tones,
  audiences,
  festivals,
  workflows,
  type WorkflowKind,
} from "@/lib/mock-data";
import {
  generateContent,
  type GenerateInput,
  type GenerateOutput,
  type Visual,
  type SinglePost,
  type CarouselPost,
  type StoryPost,
  type ReelScript,
  type Campaign,
  type FestivePost,
} from "@/lib/api/generate.functions";
import {
  carouselThemes,
  slideLayouts,
  fontFamilies,
  iconsFor,
  primaryIconFor,
  suggestThemeId,
  getTheme,
  type SlideLayout,
} from "@/lib/carousel-themes";
import { useBrandKit } from "@/lib/brand-kit";
import { Phone, Globe, Image as ImagePlus } from "lucide-react";

export const Route = createFileRoute("/_app/generate")({
  head: () => ({ meta: [{ title: "Content Studio — Medipost AI" }] }),
  component: GeneratePage,
});

const PROGRESS_STAGES = [
  "Analyzing your brief…",
  "Researching medical context…",
  "Drafting your content…",
  "Polishing for your audience…",
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  square: Square,
  layers: Layers,
  smartphone: Smartphone,
  film: Film,
  calendar: CalendarDays,
  sparkles: Heart,
};

function GeneratePage() {
  const callGenerate = useServerFn(generateContent);

  const [kind, setKind] = useState<WorkflowKind>("single");
  const [form, setForm] = useState<Omit<GenerateInput, "kind">>({
    specialty: "Dentist",
    topic: "Daily oral hygiene habits",
    tone: "Friendly",
    audience: "Patients",
    festival: "Diwali",
    slideCount: 7,
  });

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<GenerateOutput | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function switchKind(next: WorkflowKind) {
    setKind(next);
    setResult(null);
  }

  async function run() {
    if (!form.topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    setLoading(true);
    setStage(0);
    setResult(null);
    const ticker = setInterval(() => {
      setStage((s) => Math.min(s + 1, PROGRESS_STAGES.length - 1));
    }, 900);
    try {
      const out = await callGenerate({ data: { kind, ...form } });
      setResult(out);
      toast.success("Your content is ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      clearInterval(ticker);
      setLoading(false);
    }
  }

  const activeWorkflow = workflows.find((w) => w.kind === kind)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Content Studio</h1>
        <p className="text-muted-foreground mt-1">
          Pick a format and generate complete, ready-to-publish healthcare content.
        </p>
      </div>

      {/* Workflow picker */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {workflows.map((w) => {
          const Icon = ICONS[w.icon] ?? Square;
          const active = w.kind === kind;
          return (
            <button
              key={w.kind}
              type="button"
              onClick={() => switchKind(w.kind)}
              className={`group text-left rounded-xl border p-4 transition-all ${
                active
                  ? "border-[color:var(--teal)] bg-gradient-to-br from-[color:var(--teal)]/10 to-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-[color:var(--teal)]/50"
              }`}
            >
              <div
                className={`h-9 w-9 grid place-items-center rounded-lg mb-2 ${
                  active ? "bg-[color:var(--teal)] text-white" : "bg-accent text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">{w.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{w.tagline}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Brief */}
        <Card className="lg:col-span-2 border-border/60 h-fit lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[color:var(--teal)]" />
              Brief — {activeWorkflow.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Medical Specialty">
              <Select value={form.specialty} onValueChange={(v) => update("specialty", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label={kind === "festive" ? "Theme / Message angle" : "Topic"}>
              <Input
                value={form.topic}
                onChange={(e) => update("topic", e.target.value)}
                placeholder={
                  kind === "campaign"
                    ? "e.g. Heart health awareness month"
                    : kind === "festive"
                    ? "e.g. Wishing patients health this season"
                    : "e.g. Root canal myths, Pediatric flu season"
                }
              />
            </Field>

            {kind === "festive" && (
              <Field label="Festival / Occasion">
                <Select value={form.festival} onValueChange={(v) => update("festival", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {festivals.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {kind === "carousel" && (
              <Field label={`Slides — ${form.slideCount}`}>
                <input
                  type="range"
                  min={5}
                  max={10}
                  value={form.slideCount}
                  onChange={(e) => update("slideCount", Number(e.target.value))}
                  className="w-full accent-[color:var(--teal)]"
                />
              </Field>
            )}

            <Field label="Tone">
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update("tone", t)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      form.tone === t
                        ? "bg-[color:var(--teal)] text-white border-[color:var(--teal)]"
                        : "bg-background border-border hover:bg-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Target Audience">
              <Select value={form.audience} onValueChange={(v) => update("audience", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {audiences.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Button onClick={run} disabled={loading} size="lg" className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating…" : `Generate ${activeWorkflow.title}`}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="lg:col-span-3 space-y-6">
          {loading && <LoadingPanel stage={stage} />}

          {!loading && !result && (
            <Card className="border-border/60 border-dashed">
              <CardContent className="grid place-items-center text-center py-20 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[color:var(--teal)]/20 to-primary/20 grid place-items-center mb-4">
                  <Sparkles className="h-6 w-6 text-[color:var(--teal)]" />
                </div>
                <p className="font-medium text-foreground">
                  Your {activeWorkflow.title.toLowerCase()} preview will appear here
                </p>
                <p className="text-sm mt-1">Fill in the brief and hit Generate.</p>
              </CardContent>
            </Card>
          )}

          {!loading && result && (
            <>
              <ResultPreview result={result} specialty={form.specialty} />
              <VisualConceptCard visual={result.visual} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function LoadingPanel({ stage }: { stage: number }) {
  const pct = ((stage + 1) / PROGRESS_STAGES.length) * 100;
  return (
    <Card className="border-border/60">
      <CardContent className="py-8 space-y-5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[color:var(--teal)]" />
          <div className="flex-1">
            <p className="font-medium">{PROGRESS_STAGES[stage]}</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[color:var(--teal)] to-primary transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-accent/30 p-6 space-y-3 animate-pulse">
          <div className="h-4 w-1/3 bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-5/6 bg-muted rounded" />
          <div className="h-3 w-4/6 bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================ Previews ============================ */

function ResultPreview({ result, specialty }: { result: GenerateOutput; specialty: string }) {
  switch (result.kind) {
    case "single":
      return <SinglePostPreview post={result} specialty={specialty} />;
    case "carousel":
      return <CarouselPreview post={result} specialty={specialty} />;
    case "story":
      return <StoryPreview post={result} specialty={specialty} />;
    case "reel":
      return <ReelPreview post={result} specialty={specialty} />;
    case "campaign":
      return <CampaignPreview plan={result} />;
    case "festive":
      return <FestivePreview post={result} specialty={specialty} />;
  }
}

function copyText(text: string, label = "Copied") {
  navigator.clipboard.writeText(text);
  toast.success(label);
}

function PreviewToolbar({ onCopy, title }: { onCopy: () => void; title: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={onCopy}>
        <Copy className="h-3.5 w-3.5" /> Copy
      </Button>
    </div>
  );
}

/* ---- Single Post ---- */
function SinglePostPreview({ post, specialty }: { post: SinglePost; specialty: string }) {
  const fullText = [
    post.headline,
    "",
    post.content,
    "",
    post.caption,
    "",
    post.cta,
    "",
    post.hashtags.join(" "),
  ].join("\n");

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title="Instagram Post Preview" onCopy={() => copyText(fullText, "Post copied")} />

        <div className="mx-auto w-full max-w-md rounded-xl border border-border overflow-hidden bg-background shadow-sm">
          <div className="flex items-center gap-3 p-3 border-b border-border">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[color:var(--teal)] to-primary grid place-items-center text-white text-xs font-semibold">
              {specialty.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{specialty.toLowerCase()}.clinic</p>
              <p className="text-[11px] text-muted-foreground">Sponsored</p>
            </div>
            <MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground" />
          </div>

          <VisualCanvas visual={post.visual} headline={post.headline} />

          <div className="flex items-center gap-4 px-3 pt-3">
            <HeartIcon className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Send className="h-5 w-5" />
            <Bookmark className="ml-auto h-5 w-5" />
          </div>

          <div className="px-3 pb-4 pt-2 space-y-2">
            <p className="text-sm">
              <span className="font-semibold">{specialty.toLowerCase()}.clinic</span>{" "}
              {post.caption}
            </p>
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            <p className="text-sm font-medium text-[color:var(--teal)]">{post.cta}</p>
            <p className="text-xs text-[oklch(0.55_0.13_240)] leading-relaxed">
              {post.hashtags.join(" ")}
            </p>
          </div>
        </div>

        <SectionBlock title="Headline" body={post.headline} />
        <SectionBlock title="Main Content" body={post.content} />
        <SectionBlock title="Caption" body={post.caption} />
        <SectionBlock title="Call To Action" body={post.cta} />
        <SectionBlock title="Hashtags" body={post.hashtags.join(" ")} />
      </CardContent>
    </Card>
  );
}

/* ---- Carousel ---- */
function CarouselPreview({ post, specialty }: { post: CarouselPost; specialty: string }) {
  const [idx, setIdx] = useState(0);
  const total = post.slides.length;
  const slide = post.slides[idx];
  if (!slide) return null;

  const fullText = post.slides
    .map((s, i) => `Slide ${i + 1} — ${s.title}\n${s.content}`)
    .join("\n\n") + `\n\nCTA: ${post.cta}\n${post.hashtags.join(" ")}`;

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title={post.title || "Carousel Preview"} onCopy={() => copyText(fullText, "Carousel copied")} />

        <div className="relative mx-auto w-full max-w-md">
          <div
            className="aspect-square rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col text-white p-6"
            style={{
              background: `linear-gradient(135deg, ${post.visual.colors[0] || "#0E7C7B"}, ${post.visual.colors[1] || "#1f4e79"})`,
            }}
          >
            <div className="flex items-center justify-between text-xs opacity-80">
              <span className="font-semibold">{specialty.toLowerCase()}.clinic</span>
              <span>Slide {idx + 1} of {total}</span>
            </div>
            <div className="flex-1 grid place-items-center text-center">
              <div>
                <p className="text-xl font-bold leading-tight mb-3">{slide.title}</p>
                <p className="text-sm leading-relaxed opacity-95 whitespace-pre-wrap">
                  {slide.content}
                </p>
                {idx === total - 1 && (
                  <p className="mt-4 inline-block px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
                    {post.cta}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1 justify-center">
              {post.slides.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === idx ? "w-6 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-background border border-border shadow disabled:opacity-40"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
            disabled={idx === total - 1}
            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-background border border-border shadow disabled:opacity-40"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {post.slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                i === idx ? "border-[color:var(--teal)] bg-accent/40" : "border-border hover:bg-accent/30"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Slide {i + 1}{i === total - 1 ? " · CTA" : ""}
              </p>
              <p className="text-sm font-semibold mt-0.5">{s.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.content}</p>
            </button>
          ))}
        </div>

        <SectionBlock title="Hashtags" body={post.hashtags.join(" ")} />
      </CardContent>
    </Card>
  );
}

/* ---- Story ---- */
function StoryPreview({ post, specialty }: { post: StoryPost; specialty: string }) {
  const fullText = `${post.headline}\n\n${post.message}\n\n${post.cta}`;
  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title="Story (9:16) Preview" onCopy={() => copyText(fullText, "Story copied")} />

        <div
          className="mx-auto rounded-3xl overflow-hidden shadow-lg border-[6px] border-foreground/80"
          style={{ width: 270, height: 480 }}
        >
          <div
            className="w-full h-full flex flex-col p-5 text-white"
            style={{
              background: `linear-gradient(160deg, ${post.visual.colors[0] || "#0E7C7B"}, ${post.visual.colors[1] || "#1f4e79"} 60%, ${post.visual.colors[2] || "#0a3d62"})`,
            }}
          >
            <div className="flex gap-1">
              <span className="h-0.5 flex-1 bg-white rounded" />
              <span className="h-0.5 flex-1 bg-white/40 rounded" />
              <span className="h-0.5 flex-1 bg-white/40 rounded" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-white/30 grid place-items-center text-[10px] font-bold">
                {specialty.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs font-medium">{specialty.toLowerCase()}.clinic</p>
            </div>

            <div className="flex-1 grid place-items-center text-center">
              <div>
                <p className="text-2xl font-bold leading-tight">{post.headline}</p>
                <p className="text-sm mt-3 opacity-95">{post.message}</p>
              </div>
            </div>

            <div className="rounded-full bg-white text-foreground text-sm font-semibold py-2.5 text-center shadow">
              {post.cta}
            </div>
          </div>
        </div>

        <SectionBlock title="Headline" body={post.headline} />
        <SectionBlock title="Short Message" body={post.message} />
        <SectionBlock title="CTA" body={post.cta} />
      </CardContent>
    </Card>
  );
}

/* ---- Reel ---- */
function ReelPreview({ post, specialty }: { post: ReelScript; specialty: string }) {
  const fullText =
    `HOOK (0-3s)\n${post.hook}\n\nMAIN TALKING POINTS\n` +
    post.talkingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n") +
    `\n\nCTA\n${post.cta}`;

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title="Reel Script" onCopy={() => copyText(fullText, "Script copied")} />

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="bg-gradient-to-r from-[color:var(--teal)]/10 to-primary/10 px-5 py-3 flex items-center gap-2 border-b border-border">
            <Film className="h-4 w-4 text-[color:var(--teal)]" />
            <p className="text-sm font-semibold">30–45 second reel · {specialty}</p>
          </div>

          <div className="p-5 space-y-5">
            <ScriptRow label="HOOK" time="0–3s" text={post.hook} accent />
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground mb-2">
                MAIN TALKING POINTS
              </p>
              <ol className="space-y-2">
                {post.talkingPoints.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="h-5 w-5 shrink-0 grid place-items-center rounded-full bg-[color:var(--teal)]/15 text-[color:var(--teal)] text-[11px] font-semibold">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
            <ScriptRow label="CTA" time="End" text={post.cta} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScriptRow({
  label,
  time,
  text,
  accent,
}: {
  label: string;
  time: string;
  text: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? "border-[color:var(--teal)]/40 bg-[color:var(--teal)]/5" : "border-border"}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">{label}</p>
        <Badge variant="secondary" className="text-[10px]">{time}</Badge>
      </div>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}

/* ---- Campaign ---- */
function CampaignPreview({ plan }: { plan: Campaign }) {
  const fullText =
    `Theme: ${plan.theme}\nObjective: ${plan.objective}\n\nPost ideas:\n` +
    plan.postIdeas.map((p, i) => `${i + 1}. ${p}`).join("\n") +
    `\n\nWeekly schedule:\n` +
    plan.weeklySchedule.map((d) => `${d.day} · ${d.format} — ${d.idea}`).join("\n") +
    `\n\nCTAs:\n` +
    plan.ctaSuggestions.map((c) => `• ${c}`).join("\n");

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-6">
        <PreviewToolbar title="Awareness Campaign Plan" onCopy={() => copyText(fullText, "Campaign copied")} />

        <div className="rounded-xl border border-border bg-gradient-to-br from-[color:var(--teal)]/10 to-primary/5 p-5">
          <p className="text-xs font-semibold tracking-wide text-[color:var(--teal)]">CAMPAIGN THEME</p>
          <p className="text-xl font-bold mt-1">{plan.theme}</p>
          <p className="text-sm text-muted-foreground mt-2">{plan.objective}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Post Ideas
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {plan.postIdeas.map((p, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3 text-sm flex gap-3">
                <span className="h-5 w-5 shrink-0 grid place-items-center rounded-full bg-[color:var(--teal)]/15 text-[color:var(--teal)] text-[11px] font-semibold">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Suggested Weekly Schedule
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
            {plan.weeklySchedule.map((d, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[color:var(--teal)]/10 text-[color:var(--teal)] grid place-items-center font-semibold text-sm">
                  {d.day.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{d.format}</p>
                  <p className="text-sm mt-0.5">{d.idea}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            CTA Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {plan.ctaSuggestions.map((c, i) => (
              <Badge key={i} variant="secondary" className="text-xs py-1.5 px-3">{c}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---- Festive ---- */
function FestivePreview({ post, specialty }: { post: FestivePost; specialty: string }) {
  const fullText = `${post.greeting}\n\n${post.caption}\n\n${post.hashtags.join(" ")}`;
  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title={`${post.festival} Greeting`} onCopy={() => copyText(fullText, "Greeting copied")} />

        <div className="mx-auto w-full max-w-md">
          <div
            className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-border p-8 flex flex-col text-white relative"
            style={{
              background: `radial-gradient(circle at top right, ${post.visual.colors[1] || "#f4b400"} 0%, ${post.visual.colors[0] || "#0E7C7B"} 60%, ${post.visual.colors[2] || "#0a3d62"})`,
            }}
          >
            <div className="absolute top-4 right-4 opacity-30">
              <Heart className="h-16 w-16" />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] opacity-80">Happy</p>
            <p className="text-4xl font-bold mt-1 mb-6">{post.festival}</p>
            <p className="text-base leading-relaxed flex-1">{post.greeting}</p>
            <div className="mt-6 pt-4 border-t border-white/30">
              <p className="text-xs uppercase tracking-wide opacity-80">With warm wishes from</p>
              <p className="text-sm font-semibold">{specialty.toLowerCase()}.clinic</p>
            </div>
          </div>
        </div>

        <SectionBlock title="Greeting Message" body={post.greeting} />
        <SectionBlock title="Social Caption" body={post.caption} />
        <SectionBlock title="Hashtags" body={post.hashtags.join(" ")} />
      </CardContent>
    </Card>
  );
}

/* ============================ Shared bits ============================ */

function SectionBlock({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--teal)]">
          {title}
        </p>
        <button
          type="button"
          onClick={() => copyText(body, `${title} copied`)}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{body}</p>
    </div>
  );
}

function VisualCanvas({ visual, headline }: { visual: Visual; headline: string }) {
  const [c1, c2, c3] = [
    visual.colors[0] || "#0E7C7B",
    visual.colors[1] || "#1f4e79",
    visual.colors[2] || "#e8f4f8",
  ];
  return (
    <div
      className="aspect-square w-full grid place-items-center p-6 text-center text-white"
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      <div>
        <div
          className="h-12 w-12 rounded-full mx-auto mb-4 grid place-items-center"
          style={{ background: c3, color: c1 }}
        >
          <ImageIcon className="h-5 w-5" />
        </div>
        <p className="text-lg font-bold leading-tight">{headline}</p>
        <p className="text-[11px] mt-3 opacity-80 italic line-clamp-2">{visual.concept}</p>
      </div>
    </div>
  );
}

function VisualConceptCard({ visual }: { visual: Visual }) {
  if (!visual?.concept) return null;
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-[color:var(--teal)]" /> Visual Asset Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <VisualField label="Visual Concept" value={visual.concept} />
          <VisualField label="Design Style" value={visual.style} />
          <VisualField label="Layout Recommendation" value={visual.layout} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Suggested Color Palette
            </p>
            <div className="flex flex-wrap gap-2">
              {visual.colors.map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-3 py-1"
                >
                  <span
                    className="h-5 w-5 rounded-full border border-border"
                    style={{ background: c }}
                  />
                  <span className="text-xs font-mono">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VisualField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}