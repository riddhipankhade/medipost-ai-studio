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
  contentCategories,
  defaultCategoryFor,
  type ContentCategory,
} from "@/lib/mock-data";
import {
  generateContent,
  generateImage,
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
import { Phone, Globe, Image as ImagePlus, ImageDown, RefreshCw, Wand } from "lucide-react";

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
  const [brand] = useBrandKit();

  const [kind, setKind] = useState<WorkflowKind>("single");
  const [category, setCategory] = useState<ContentCategory>(defaultCategoryFor("single"));
  const [form, setForm] = useState<Omit<GenerateInput, "kind">>({
    category: "educational",
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
    const nextCat = defaultCategoryFor(next);
    setCategory(nextCat);
    setForm((f) => ({ ...f, category: nextCat }));
    setResult(null);
  }

  function pickCategory(next: ContentCategory) {
    setCategory(next);
    setForm((f) => ({ ...f, category: next }));
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
      const out = await callGenerate({
        data: {
          kind,
          ...form,
          category,
          brand: {
            clinicName: brand.clinicName,
            doctorName: brand.doctorName,
            primaryColor: brand.primaryColor,
            secondaryColor: brand.secondaryColor,
            website: brand.website,
            phone: brand.phone,
            hasLogo: Boolean(brand.logo),
            hasDoctorPhoto: Boolean(brand.doctorPhoto),
            hasClinicPhoto: Boolean(brand.clinicPhoto || brand.coverPhoto),
          },
        },
      });
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
  const recommendedCategories = contentCategories.filter((c) => c.bestFor.includes(kind));
  const otherCategories = contentCategories.filter((c) => !c.bestFor.includes(kind));

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
            <Field label="Content Category">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {recommendedCategories.map((c) => (
                    <CategoryChip
                      key={c.id}
                      cat={c}
                      active={category === c.id}
                      onClick={() => pickCategory(c.id)}
                    />
                  ))}
                </div>
                {otherCategories.length > 0 && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      More categories
                    </summary>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {otherCategories.map((c) => (
                        <CategoryChip
                          key={c.id}
                          cat={c}
                          active={category === c.id}
                          onClick={() => pickCategory(c.id)}
                        />
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </Field>

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

function CategoryChip({
  cat,
  active,
  onClick,
}: {
  cat: { id: ContentCategory; title: string; tagline: string; emoji: string };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={cat.tagline}
      className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5 ${
        active
          ? "border-[color:var(--teal)] bg-[color:var(--teal)]/10 text-foreground shadow-sm"
          : "border-border bg-background hover:border-[color:var(--teal)]/50 text-foreground"
      }`}
    >
      <span>{cat.emoji}</span>
      <span className="font-medium">{cat.title}</span>
    </button>
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

/* ============================ AI Image Hook ============================ */

function useAiImage() {
  const call = useServerFn(generateImage);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async (prompt: string, visualStyle?: string) => {
    if (!prompt || !prompt.trim()) {
      toast.error("No image prompt available — re-generate the content first.");
      return;
    }
    setLoading(true);
    try {
      const r = await call({ data: { prompt, visualStyle } });
      setUrl(r.dataUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setLoading(false);
    }
  };
  return { url, loading, run, setUrl };
}

function AiImageButton({
  loading,
  hasImage,
  onClick,
  size = "sm",
  label,
}: {
  loading: boolean;
  hasImage: boolean;
  onClick: () => void;
  size?: "sm" | "xs";
  label?: string;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={loading}
      size="sm"
      variant={hasImage ? "outline" : "default"}
      className={`gap-1.5 ${size === "xs" ? "h-7 text-[11px] px-2.5" : "h-8"}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : hasImage ? (
        <RefreshCw className="h-3.5 w-3.5" />
      ) : (
        <Wand className="h-3.5 w-3.5" />
      )}
      {loading
        ? "Generating image…"
        : label ?? (hasImage ? "Regenerate visual" : "Generate AI visual")}
    </Button>
  );
}

/* ---- Single Post ---- */
function SinglePostPreview({ post, specialty }: { post: SinglePost; specialty: string }) {
  const [brand] = useBrandKit();
  const ai = useAiImage();
  const handle = (brand.clinicName || `${specialty.toLowerCase()}.clinic`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24) || "clinic";
  const brandedVisual: Visual = {
    ...post.visual,
    colors: [
      brand.primaryColor,
      brand.secondaryColor,
      post.visual.colors[2] || "#e8f4f8",
      ...(post.visual.colors.slice(3) || []),
    ],
  };
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

        <div className="flex justify-end -mt-1">
          <AiImageButton
            loading={ai.loading}
            hasImage={!!ai.url}
            onClick={() => ai.run(post.visual.imagePrompt || post.visual.concept, post.visual.visualStyle)}
          />
        </div>

        <div className="mx-auto w-full max-w-md rounded-xl border border-border overflow-hidden bg-background shadow-sm">
          <div className="flex items-center gap-3 p-3 border-b border-border">
            {brand.logo ? (
              <img src={brand.logo} alt="" className="h-9 w-9 rounded-full object-cover bg-white border border-border" />
            ) : (
              <div
                className="h-9 w-9 rounded-full grid place-items-center text-white text-xs font-semibold"
                style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})` }}
              >
                {(brand.clinicName || specialty).slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{handle}</p>
              <p className="text-[11px] text-muted-foreground truncate">{brand.doctorName || "Sponsored"}</p>
            </div>
            <MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground" />
          </div>

          <VisualCanvas
            visual={brandedVisual}
            headline={post.headline}
            brand={brand}
            specialty={specialty}
            imageUrl={ai.url}
            imageLoading={ai.loading}
          />

          <div className="flex items-center gap-4 px-3 pt-3">
            <HeartIcon className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Send className="h-5 w-5" />
            <Bookmark className="ml-auto h-5 w-5" />
          </div>

          <div className="px-3 pb-4 pt-2 space-y-2">
            <p className="text-sm">
              <span className="font-semibold">{handle}</span>{" "}
              {post.caption}
            </p>
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            <p className="text-sm font-medium" style={{ color: brand.primaryColor }}>{post.cta}</p>
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
  const [brand] = useBrandKit();
  const [idx, setIdx] = useState(0);
  const [themeId, setThemeId] = useState<string>(() => suggestThemeId(specialty));
  const [layout, setLayout] = useState<SlideLayout>("centered");
  const [fontFamily, setFontFamily] = useState<string>(carouselThemes[0].fontFamily);
  const [fontScale, setFontScale] = useState<number>(1);
  const [headingColor, setHeadingColor] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [useBrandColors, setUseBrandColors] = useState<boolean>(true);
  const [showIcons, setShowIcons] = useState<boolean>(true);

  const baseTheme = getTheme(themeId);
  const theme = {
    ...baseTheme,
    bg: useBrandColors
      ? `linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.secondaryColor} 100%)`
      : baseTheme.bg,
    heading: headingColor || baseTheme.heading,
    text: textColor || baseTheme.text,
    accent: accentColor || (useBrandColors ? brand.primaryColor : baseTheme.accent),
    fontFamily,
  };

  const total = post.slides.length;
  const slide = post.slides[idx];
  if (!slide) return null;

  const fullText =
    post.slides
      .map((s, i) => `Slide ${i + 1} — ${s.title}\n${s.content}`)
      .join("\n\n") + `\n\nCTA: ${post.cta}\n${post.hashtags.join(" ")}`;

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar
          title={post.title || "Carousel Preview"}
          onCopy={() => copyText(fullText, "Carousel copied")}
        />

        <div className="grid gap-5 md:grid-cols-[1fr_280px]">
          {/* Slide canvas */}
          <div>
            <div className="relative mx-auto w-full max-w-md">
              <SlideCanvas
                slideTitle={slide.title}
                slideBody={slide.content}
                slideIndex={idx}
                totalSlides={total}
                isCta={idx === total - 1}
                cta={post.cta}
                specialty={specialty}
                theme={theme}
                layout={layout}
                fontScale={fontScale}
                showIcons={showIcons}
                brand={brand}
              />

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

            {/* Slide strip */}
            <div className="mt-4 grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
              {post.slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`group text-left rounded-md border overflow-hidden transition-all ${
                    i === idx
                      ? "border-[color:var(--teal)] ring-2 ring-[color:var(--teal)]/30"
                      : "border-border hover:border-[color:var(--teal)]/50"
                  }`}
                  title={s.title}
                >
                  <div
                    className="aspect-square p-1.5 text-[8px] leading-tight flex flex-col"
                    style={{ background: theme.bg, color: theme.text, fontFamily: theme.fontFamily }}
                  >
                    <span className="opacity-60">{i + 1}</span>
                    <span className="font-bold line-clamp-3 mt-auto" style={{ color: theme.heading }}>
                      {s.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Studio controls */}
          <StudioControls
            themeId={themeId}
            setThemeId={(id) => {
              setThemeId(id);
              setFontFamily(getTheme(id).fontFamily);
            }}
            layout={layout}
            setLayout={setLayout}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontScale={fontScale}
            setFontScale={setFontScale}
            headingColor={headingColor ?? theme.heading}
            setHeadingColor={setHeadingColor}
            textColor={textColor ?? theme.text}
            setTextColor={setTextColor}
            accentColor={accentColor ?? theme.accent}
            setAccentColor={setAccentColor}
            useBrandColors={useBrandColors}
            setUseBrandColors={setUseBrandColors}
            showIcons={showIcons}
            setShowIcons={setShowIcons}
          />
        </div>

        <SectionBlock title="Hashtags" body={post.hashtags.join(" ")} />
      </CardContent>
    </Card>
  );
}

/* ---------- Carousel sub-components ---------- */

type SlideCanvasProps = {
  slideTitle: string;
  slideBody: string;
  slideIndex: number;
  totalSlides: number;
  isCta: boolean;
  cta: string;
  specialty: string;
  theme: ReturnType<typeof getTheme> & { fontFamily: string };
  layout: SlideLayout;
  fontScale: number;
  showIcons: boolean;
  brand: ReturnType<typeof useBrandKit>[0];
};

function SlideCanvas(p: SlideCanvasProps) {
  const PrimaryIcon = primaryIconFor(p.specialty);
  const titleSize = 22 * p.fontScale;
  const bodySize = 14 * p.fontScale;

  const baseStyle: React.CSSProperties = {
    background: p.theme.bg,
    color: p.theme.text,
    fontFamily: p.theme.fontFamily,
  };

  return (
    <div
      className="relative aspect-square rounded-2xl border border-border overflow-hidden shadow-md"
      style={baseStyle}
    >
      {/* Contextual visual background */}
      {p.showIcons && (
        <ContextualBackground specialty={p.specialty} opacity={p.theme.iconOpacity} color={p.theme.heading} />
      )}

      {/* Layout */}
      {p.layout === "centered" && (
        <CenteredLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
      )}
      {p.layout === "image-left" && (
        <ImageLeftLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
      )}
      {p.layout === "full-image" && (
        <FullImageLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
      )}
      {p.layout === "split" && (
        <SplitLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
      )}
      {p.layout === "modern-card" && (
        <ModernCardLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
      )}

      {/* Page indicator */}
      <div className="absolute top-3 right-4 z-20 text-[10px] font-medium opacity-80" style={{ color: p.theme.heading }}>
        {p.slideIndex + 1} / {p.totalSlides}
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
        {Array.from({ length: p.totalSlides }).map((_, i) => (
          <span
            key={i}
            className="h-1 rounded-full transition-all"
            style={{
              width: i === p.slideIndex ? 18 : 6,
              background: i === p.slideIndex ? p.theme.heading : `${p.theme.heading}55`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

type LayoutProps = SlideCanvasProps & {
  titleSize: number;
  bodySize: number;
  PrimaryIcon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
};

function BrandHeader({ p }: { p: LayoutProps }) {
  return (
    <div className="flex items-center gap-2 relative z-10">
      {p.brand.logo ? (
        <img src={p.brand.logo} alt="" className="h-8 w-8 rounded-md object-cover bg-white" />
      ) : (
        <div
          className="h-8 w-8 rounded-md grid place-items-center"
          style={{ background: `${p.theme.heading}22`, color: p.theme.heading }}
        >
          <p.PrimaryIcon className="h-4 w-4" />
        </div>
      )}
      <p className="text-[11px] font-semibold tracking-wide truncate" style={{ color: p.theme.heading }}>
        {p.brand.clinicName}
      </p>
    </div>
  );
}

function BrandFooter({ p }: { p: LayoutProps }) {
  return (
    <div
      className="flex items-center gap-3 text-[9px] relative z-10 pt-2 border-t"
      style={{ borderColor: `${p.theme.heading}33`, color: p.theme.text }}
    >
      <span className="inline-flex items-center gap-1 truncate">
        <Globe className="h-2.5 w-2.5" /> {p.brand.website}
      </span>
      <span className="inline-flex items-center gap-1 truncate">
        <Phone className="h-2.5 w-2.5" /> {p.brand.phone}
      </span>
    </div>
  );
}

function CtaPill({ p }: { p: LayoutProps }) {
  if (!p.isCta) return null;
  return (
    <div
      className="inline-block px-4 py-2 rounded-full text-xs font-semibold mt-3"
      style={{ background: p.theme.accent, color: "#fff" }}
    >
      {p.cta}
    </div>
  );
}

function CenteredLayout(p: LayoutProps) {
  return (
    <div className="absolute inset-0 z-10 p-6 flex flex-col">
      <BrandHeader p={p} />
      <div className="flex-1 grid place-items-center text-center px-2">
        <div>
          <div
            className="h-10 w-10 rounded-full grid place-items-center mx-auto mb-3"
            style={{ background: `${p.theme.accent}33`, color: p.theme.accent }}
          >
            <p.PrimaryIcon className="h-5 w-5" />
          </div>
          <h3
            className="font-bold leading-tight"
            style={{ color: p.theme.heading, fontSize: p.titleSize }}
          >
            {p.slideTitle}
          </h3>
          <p className="mt-3 leading-relaxed" style={{ color: p.theme.text, fontSize: p.bodySize }}>
            {p.slideBody}
          </p>
          <CtaPill p={p} />
        </div>
      </div>
      <BrandFooter p={p} />
    </div>
  );
}

function ImageLeftLayout(p: LayoutProps) {
  return (
    <div className="absolute inset-0 z-10 p-5 flex flex-col">
      <BrandHeader p={p} />
      <div className="flex-1 grid grid-cols-[40%_1fr] gap-3 mt-3">
        <ImagePlaceholder p={p} />
        <div className="flex flex-col justify-center">
          <h3 className="font-bold leading-tight" style={{ color: p.theme.heading, fontSize: p.titleSize * 0.85 }}>
            {p.slideTitle}
          </h3>
          <p className="mt-2 leading-relaxed" style={{ color: p.theme.text, fontSize: p.bodySize * 0.95 }}>
            {p.slideBody}
          </p>
          <CtaPill p={p} />
        </div>
      </div>
      <BrandFooter p={p} />
    </div>
  );
}

function FullImageLayout(p: LayoutProps) {
  const photo = p.brand.coverPhoto || p.brand.clinicPhoto;
  return (
    <>
      {photo ? (
        <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <ImagePlaceholder p={p} full />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div className="absolute inset-0 z-10 p-6 flex flex-col text-white">
        <BrandHeader p={{ ...p, theme: { ...p.theme, heading: "#fff", text: "#fff" } }} />
        <div className="flex-1" />
        <div>
          <h3 className="font-bold leading-tight" style={{ fontSize: p.titleSize }}>
            {p.slideTitle}
          </h3>
          <p className="mt-2 opacity-90" style={{ fontSize: p.bodySize }}>
            {p.slideBody}
          </p>
          <CtaPill p={p} />
        </div>
        <BrandFooter p={{ ...p, theme: { ...p.theme, heading: "#fff", text: "#fff" } }} />
      </div>
    </>
  );
}

function SplitLayout(p: LayoutProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      <div className="h-[42%] relative p-5 flex flex-col justify-between" style={{ background: p.theme.accent }}>
        <BrandHeader p={{ ...p, theme: { ...p.theme, heading: "#fff" } }} />
        <h3 className="font-bold leading-tight text-white" style={{ fontSize: p.titleSize }}>
          {p.slideTitle}
        </h3>
      </div>
      <div className="flex-1 p-5 flex flex-col bg-white/95 backdrop-blur">
        <p className="leading-relaxed text-gray-700" style={{ fontSize: p.bodySize }}>
          {p.slideBody}
        </p>
        <CtaPill p={p} />
        <div className="mt-auto">
          <BrandFooter
            p={{ ...p, theme: { ...p.theme, heading: "#222", text: "#555" } }}
          />
        </div>
      </div>
    </div>
  );
}

function ModernCardLayout(p: LayoutProps) {
  return (
    <div className="absolute inset-0 z-10 p-5 flex flex-col">
      <BrandHeader p={p} />
      <div className="flex-1 grid place-items-center">
        <div
          className="w-full rounded-xl p-5 backdrop-blur shadow-lg border"
          style={{
            background: "rgba(255,255,255,0.92)",
            borderColor: `${p.theme.accent}55`,
          }}
        >
          <div
            className="h-9 w-9 rounded-lg grid place-items-center mb-3"
            style={{ background: `${p.theme.accent}22`, color: p.theme.accent }}
          >
            <p.PrimaryIcon className="h-5 w-5" />
          </div>
          <h3 className="font-bold leading-tight text-gray-900" style={{ fontSize: p.titleSize * 0.9 }}>
            {p.slideTitle}
          </h3>
          <p className="mt-2 leading-relaxed text-gray-600" style={{ fontSize: p.bodySize * 0.95 }}>
            {p.slideBody}
          </p>
          <CtaPill p={p} />
        </div>
      </div>
      <BrandFooter p={p} />
    </div>
  );
}

function ImagePlaceholder({ p, full }: { p: LayoutProps; full?: boolean }) {
  const photo = p.brand.clinicPhoto || p.brand.doctorPhoto || p.brand.coverPhoto;
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className={`${full ? "absolute inset-0 w-full h-full" : "w-full h-full"} object-cover rounded-lg`}
      />
    );
  }
  return (
    <div
      className={`${
        full ? "absolute inset-0" : "h-full w-full"
      } rounded-lg grid place-items-center text-center`}
      style={{
        background: `repeating-linear-gradient(45deg, ${p.theme.accent}11 0 10px, ${p.theme.accent}22 10px 20px)`,
        color: p.theme.heading,
      }}
    >
      <div className="flex flex-col items-center gap-1 opacity-80">
        <ImagePlus className="h-6 w-6" />
        <span className="text-[9px] font-medium tracking-wide uppercase">AI image area</span>
      </div>
    </div>
  );
}

function ContextualBackground({
  specialty,
  opacity,
  color,
}: {
  specialty: string;
  opacity: number;
  color: string;
}) {
  const Icons = iconsFor(specialty);
  // Deterministic scattered icon positions to evoke topic-specific visuals.
  const positions = [
    { top: "8%", left: "10%", size: 56, rot: -10 },
    { top: "20%", left: "78%", size: 38, rot: 18 },
    { top: "45%", left: "5%", size: 30, rot: 6 },
    { top: "60%", left: "85%", size: 64, rot: -22 },
    { top: "78%", left: "20%", size: 42, rot: 12 },
    { top: "30%", left: "45%", size: 90, rot: -6 },
    { top: "85%", left: "60%", size: 34, rot: 24 },
  ];
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {positions.map((pos, i) => {
        const Icon = Icons[i % Icons.length];
        return (
          <Icon
            key={i}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: pos.size,
              height: pos.size,
              transform: `rotate(${pos.rot}deg)`,
              color,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}

function StudioControls(props: {
  themeId: string;
  setThemeId: (v: string) => void;
  layout: SlideLayout;
  setLayout: (v: SlideLayout) => void;
  fontFamily: string;
  setFontFamily: (v: string) => void;
  fontScale: number;
  setFontScale: (v: number) => void;
  headingColor: string;
  setHeadingColor: (v: string | null) => void;
  textColor: string;
  setTextColor: (v: string | null) => void;
  accentColor: string;
  setAccentColor: (v: string | null) => void;
  useBrandColors: boolean;
  setUseBrandColors: (v: boolean) => void;
  showIcons: boolean;
  setShowIcons: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 text-sm h-fit">
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Theme</Label>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {carouselThemes.map((t) => {
            const active = t.id === props.themeId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => props.setThemeId(t.id)}
                className={`rounded-md border overflow-hidden text-left ${
                  active ? "ring-2 ring-[color:var(--teal)] border-[color:var(--teal)]" : "border-border"
                }`}
                title={t.tagline}
              >
                <div className="h-8" style={{ background: t.bg }} />
                <div className="px-1.5 py-1">
                  <p className="text-[10px] font-semibold leading-tight">{t.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Layout</Label>
        <Select value={props.layout} onValueChange={(v) => props.setLayout(v as SlideLayout)}>
          <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {slideLayouts.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Font</Label>
        <Select value={props.fontFamily} onValueChange={props.setFontFamily}>
          <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {fontFamilies.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span style={{ fontFamily: f.id }}>{f.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Font size
          </Label>
          <span className="text-xs font-mono">{Math.round(props.fontScale * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.8}
          max={1.4}
          step={0.05}
          value={props.fontScale}
          onChange={(e) => props.setFontScale(Number(e.target.value))}
          className="w-full accent-[color:var(--teal)] mt-1.5"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniColor label="Heading" value={props.headingColor} onChange={props.setHeadingColor} />
        <MiniColor label="Body" value={props.textColor} onChange={props.setTextColor} />
        <MiniColor label="Accent" value={props.accentColor} onChange={props.setAccentColor} />
      </div>

      <div className="space-y-2 pt-1">
        <label className="flex items-center justify-between gap-2 text-xs cursor-pointer">
          <span>Use clinic brand colors</span>
          <input
            type="checkbox"
            checked={props.useBrandColors}
            onChange={(e) => props.setUseBrandColors(e.target.checked)}
            className="accent-[color:var(--teal)]"
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs cursor-pointer">
          <span>Show contextual icons</span>
          <input
            type="checkbox"
            checked={props.showIcons}
            onChange={(e) => props.setShowIcons(e.target.checked)}
            className="accent-[color:var(--teal)]"
          />
        </label>
      </div>
    </div>
  );
}

function MiniColor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-8 w-full rounded border border-border cursor-pointer bg-transparent"
      />
    </div>
  );
}

/* ---- Story ---- */
function StoryPreview({ post, specialty }: { post: StoryPost; specialty: string }) {
  const [brand] = useBrandKit();
  const c1 = brand.primaryColor || post.visual.colors[0] || "#0E7C7B";
  const c2 = brand.secondaryColor || post.visual.colors[1] || "#1f4e79";
  const c3 = post.visual.colors[2] || "#0a3d62";
  const photo = brand.coverPhoto || brand.clinicPhoto || brand.doctorPhoto;
  const handle = (brand.clinicName || `${specialty.toLowerCase()}.clinic`).slice(0, 28);
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
            className="relative w-full h-full flex flex-col p-5 text-white"
            style={{ background: `linear-gradient(160deg, ${c1}, ${c2} 60%, ${c3})` }}
          >
            {photo && (
              <>
                <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c1}b3 0%, ${c2}f0 100%)` }} />
              </>
            )}
            <ContextualBackground specialty={specialty} opacity={0.08} color="#ffffff" />
            <div className="relative z-10 flex flex-col h-full">
            <div className="flex gap-1">
              <span className="h-0.5 flex-1 bg-white rounded" />
              <span className="h-0.5 flex-1 bg-white/40 rounded" />
              <span className="h-0.5 flex-1 bg-white/40 rounded" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              {brand.logo ? (
                <img src={brand.logo} alt="" className="h-7 w-7 rounded-full object-cover bg-white" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-white/30 grid place-items-center text-[10px] font-bold">
                  {(brand.clinicName || specialty).slice(0, 2).toUpperCase()}
                </div>
              )}
              <p className="text-xs font-medium truncate">{handle}</p>
            </div>

            <div className="flex-1 grid place-items-center text-center">
              <div>
                <p className="text-2xl font-bold leading-tight">{post.headline}</p>
                <p className="text-sm mt-3 opacity-95">{post.message}</p>
              </div>
            </div>

            <div className="rounded-full bg-white text-sm font-semibold py-2.5 text-center shadow" style={{ color: c1 }}>
              {post.cta}
            </div>
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
  const [brand] = useBrandKit();
  const c1 = brand.primaryColor || post.visual.colors[0] || "#0E7C7B";
  const c2 = post.visual.colors[1] || "#f4b400";
  const c3 = brand.secondaryColor || post.visual.colors[2] || "#0a3d62";
  const fullText = `${post.greeting}\n\n${post.caption}\n\n${post.hashtags.join(" ")}`;
  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title={`${post.festival} Greeting`} onCopy={() => copyText(fullText, "Greeting copied")} />

        <div className="mx-auto w-full max-w-md">
          <div
            className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-border p-8 flex flex-col text-white relative"
            style={{ background: `radial-gradient(circle at top right, ${c2} 0%, ${c1} 60%, ${c3})` }}
          >
            <div className="absolute top-4 right-4 opacity-30">
              <Heart className="h-16 w-16" />
            </div>
            <ContextualBackground specialty={specialty} opacity={0.07} color="#ffffff" />
            <div className="relative z-10 flex flex-col h-full">
            <p className="text-xs uppercase tracking-[0.3em] opacity-80">Happy</p>
            <p className="text-4xl font-bold mt-1 mb-6">{post.festival}</p>
            <p className="text-base leading-relaxed flex-1">{post.greeting}</p>
            <div className="mt-6 pt-4 border-t border-white/30 flex items-center gap-3">
              {brand.logo && (
                <img src={brand.logo} alt="" className="h-9 w-9 rounded-lg object-cover bg-white" />
              )}
              <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide opacity-80">With warm wishes from</p>
              <p className="text-sm font-semibold truncate">{brand.clinicName || `${specialty.toLowerCase()}.clinic`}</p>
              {brand.doctorName && (
                <p className="text-[11px] opacity-80 truncate">{brand.doctorName}</p>
              )}
              </div>
            </div>
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

function VisualCanvas({
  visual,
  headline,
  brand,
  specialty,
  imageUrl,
  imageLoading,
}: {
  visual: Visual;
  headline: string;
  brand?: ReturnType<typeof useBrandKit>[0];
  specialty?: string;
  imageUrl?: string | null;
  imageLoading?: boolean;
}) {
  const c1 = visual.colors[0] || brand?.primaryColor || "#0E7C7B";
  const c2 = visual.colors[1] || brand?.secondaryColor || "#1f4e79";
  const photo = brand?.coverPhoto || brand?.clinicPhoto || brand?.doctorPhoto;
  const PrimaryIcon = specialty ? primaryIconFor(specialty) : ImageIcon;

  // When an AI-generated image is available, render image-led creative.
  if (imageUrl) {
    return (
      <div className="relative aspect-square w-full overflow-hidden text-white">
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/0" />
        <div className="absolute inset-x-0 bottom-0 p-5 z-10">
          <p className="text-xl font-bold leading-tight drop-shadow-md">{headline}</p>
          {brand?.clinicName && (
            <p className="text-[10px] uppercase tracking-[0.25em] mt-2 opacity-90">
              {brand.clinicName}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-square w-full overflow-hidden text-white"
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      {imageLoading && <ImageLoadingOverlay />}
      {photo && (
        <>
          <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${c1}cc 0%, ${c2}e6 100%)`,
              mixBlendMode: "multiply",
            }}
          />
        </>
      )}
      {specialty && (
        <ContextualBackground specialty={specialty} opacity={0.08} color="#ffffff" />
      )}
      <div className="absolute inset-0 grid place-items-center p-6 text-center">
        <div className="relative z-10">
          <div
            className="h-12 w-12 rounded-full mx-auto mb-4 grid place-items-center backdrop-blur"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
          >
            <PrimaryIcon className="h-5 w-5" />
          </div>
          <p className="text-xl font-bold leading-tight">{headline}</p>
          <p className="text-[11px] mt-3 opacity-80 italic line-clamp-2">{visual.concept}</p>
        </div>
      </div>
      {brand?.clinicName && (
        <div className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-90">
          {brand.logo && <img src={brand.logo} alt="" className="h-4 w-4 rounded-sm object-cover bg-white/80" />}
          <span>{brand.clinicName}</span>
        </div>
      )}
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

function ImageLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2 text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-xs font-medium tracking-wide uppercase">Generating visual…</p>
      </div>
    </div>
  );
}