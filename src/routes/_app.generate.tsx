import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
  Heart as HeartIcon,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { SpecialtySelect } from "@/components/specialty-select";
import {
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
  type TemplatePost,
} from "@/lib/api/generate.functions";
import {
  templateFrames,
  getTemplateFrame,
  TEMPLATE_SAMPLES,
  type TemplateFrameId,
} from "@/components/template-frames";
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
import { useBrandKit, fileToDataUrl, brandKitCompleteness } from "@/lib/brand-kit";
import { BrandKitProgressBanner } from "@/components/brand-kit-progress-banner";
import { supabase } from "@/lib/supabase";
import { Phone, ImageDown, RefreshCw, Wand, Upload } from "lucide-react";
import {
  type SlideCanvasProps,
  CenteredLayout,
  ImageLeftLayout,
  FullImageLayout,
  SplitLayout,
  ModernCardLayout,
  FullImageOverlayLayout,
  ContextualBackground,
  HeroCard,
  IconGrid,
  StatisticHero,
  ComparisonSplit,
  ProcessFlow,
  CalloutDiagram,
  Timeline,
  FaqCards,
  Checklist,
  RadialDiagram,
} from "@/components/carousel-layouts";
import { resolveVisualStrategy, resolveSinglePostStrategy } from "@/lib/visual-strategy";
import { useDownloadPost } from "@/hooks/useDownloadPost";
import { usePersistCustomization } from "@/hooks/usePersistCustomization";
import {
  resolveTheme,
  resolveFestiveColors,
  resolveTemplateColors,
  resolveStoryColors,
  DEFAULT_TEMPLATE_IMAGE_OFFSET,
  type SingleCustomization,
  type CarouselCustomization,
  type FestiveCustomization,
  type TemplateCustomization,
  type StoryCustomization,
} from "@/lib/post-customization";
import { Slider } from "@/components/ui/slider";
import FestiveCard from "@/components/FestiveCard";
import StoryCard from "@/components/StoryCard";
import { Watermark, RemoveWatermarkRow } from "@/components/Watermark";
import { isExportableNode } from "@/lib/export-filter";
import { useAuth } from "@/lib/auth-context";
import { useIsPro, useGrowthTrialEligible } from "@/lib/use-subscription";
import { growthHeadline, growthButtonLabel } from "@/lib/growth-trial-copy";
import { ShareButtons } from "@/components/ShareButtons";
import {
  readStudioSessionPointer,
  writeStudioSessionPointer,
  clearStudioSessionPointer,
  fetchStudioSessionRow,
  type StudioSessionRow,
} from "@/lib/studio-session";

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
  layout: LayoutTemplate,
};

const CONTENT_LANGUAGES = [
  "English", "Hindi", "Marathi", "Kannada", "Tamil", "Telugu", "Bengali", "Gujarati", "Punjabi", "Malayalam",
];

const BRIEF_STORAGE_PREFIX = "medipost.studio-brief.v1";

function briefStorageKey(userId: string) {
  return `${BRIEF_STORAGE_PREFIX}:${userId}`;
}

type PersistedBrief = {
  kind: WorkflowKind;
  category: ContentCategory;
  form: Omit<GenerateInput, "kind">;
};

function readPersistedBrief(userId: string): PersistedBrief | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(briefStorageKey(userId));
    return raw ? (JSON.parse(raw) as PersistedBrief) : null;
  } catch {
    return null;
  }
}

const DEFAULT_BRIEF_FORM: Omit<GenerateInput, "kind"> = {
  category: "educational",
  specialty: "Dentist",
  topic: "Daily oral hygiene habits",
  tone: "Standard",
  audience: "General Public",
  festival: "Diwali",
  customInstructions: "",
  festiveStyle: "Warm & Friendly",
  slideCount: 7,
  language: "English",
};

function GeneratePage() {
  const callGenerate = useServerFn(generateContent);
  const [brand] = useBrandKit();
  const brandKitPercent = brandKitCompleteness(brand).percent;
  const { user } = useAuth();
  const isPro = useIsPro(user?.id);
  const trialEligible = useGrowthTrialEligible(user?.id);
  // Set to open the "Upgrade to Growth" dialog with this explanation; null closes it.
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);

  const [outOfCredits, setOutOfCredits] = useState(false);
  const [supabaseBrand, setSupabaseBrand] = useState({
    clinicName:     "",
    doctorName:     "",
    primaryColor:   "#0d9488",
    secondaryColor: "#134e4a",
    website:        "",
    phone:          "",
    hasLogo:        false,
    hasDoctorPhoto: false,
    hasClinicPhoto: false,
  });

  const specialtyAppliedRef = useRef(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [kind, setKind] = useState<WorkflowKind>("single");
  const [category, setCategory] = useState<ContentCategory>(defaultCategoryFor("single"));
  const [form, setForm] = useState<Omit<GenerateInput, "kind">>(DEFAULT_BRIEF_FORM);
  const [templateFrame, setTemplateFrame] = useState<TemplateFrameId>("clinic-classic");

  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;
    window.localStorage.setItem(briefStorageKey(userId), JSON.stringify({ kind, category, form }));
  }, [userId, kind, category, form]);

  // Starter/free plan is locked to Standard tone + General Public audience —
  // clamp back if a persisted brief (from before a downgrade, or a prior
  // paid session) resumes with something else.
  useEffect(() => {
    if (isPro) return;
    if (form.tone === "Standard" && form.audience === "General Public") return;
    setForm((f) => ({ ...f, tone: "Standard", audience: "General Public" }));
  }, [isPro, form.tone, form.audience]);

  useEffect(() => {
    let cancelled = false;

    async function loadBrand() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      setUserId(user.id);
      const persistedBrief = readPersistedBrief(user.id);
      if (persistedBrief) {
        setKind(persistedBrief.kind);
        setCategory(persistedBrief.category);
        setForm(persistedBrief.form);
      }

      const { data } = await supabase
        .from("brand_kits")
        .select(
          "clinic_name, doctor_name, specialty, logo_url, doctor_photo_url, " +
          "clinic_photo_url, brand_colors, phone, website"
        )
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;

      const signupSpecialty = (user.user_metadata?.specialty as string) ?? "";
      const kitSpecialty = data ? ((data as unknown as Record<string, unknown>).specialty as string) ?? "" : "";
      const specialty = kitSpecialty || signupSpecialty;
      if (specialty && !persistedBrief && !specialtyAppliedRef.current) {
        specialtyAppliedRef.current = true;
        setForm((f) => ({ ...f, specialty }));
      }

      if (!data) return;
      const d = data as unknown as Record<string, unknown>;
      const colors = ((d.brand_colors ?? {}) as Record<string, string>);

      const logoUrl        = (d.logo_url           as string) ?? "";
      const doctorUrl      = (d.doctor_photo_url    as string) ?? "";
      const clinicUrl      = (d.clinic_photo_url    as string) ?? "";
      const clinicName     = (d.clinic_name         as string) ?? "";
      const doctorName     = (d.doctor_name         as string) ?? "";
      const primaryColor   = colors.primary                    ?? "#0d9488";
      const secondaryColor = colors.secondary                  ?? "#134e4a";
      const website        = (d.website             as string) ?? "";
      const phone          = (d.phone               as string) ?? "";

      setSupabaseBrand({
        clinicName,
        doctorName,
        primaryColor,
        secondaryColor,
        website,
        phone,
        hasLogo:        Boolean(logoUrl),
        hasDoctorPhoto: Boolean(doctorUrl),
        hasClinicPhoto: Boolean(clinicUrl),
      });
    }

    loadBrand();
    const handleVisibility = () => { if (!document.hidden) loadBrand(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<GenerateOutput | null>(null);
  const [rowId,  setRowId]  = useState<string | null>(null);
  const [sessionSeed, setSessionSeed] = useState<StudioSessionRow | null>(null);
  // The category `result` was generated/restored under — frozen separately
  // from the brief form's `category` (which resets per-tab in switchKind) so
  // that peeking at another workflow tab and coming back still renders the
  // preserved result with its own original category, not whatever tab you
  // last touched.
  const [resultCategory, setResultCategory] = useState<ContentCategory>(defaultCategoryFor("single"));

  // Restore the active workspace (which post + workflow the user was last
  // editing) once per login, independent of the brief/brand-kit effect above
  // so a tab-visibility refresh there can't re-run this and clobber
  // in-progress edits. Content/images/customization are re-fetched from
  // `content_generations` by id rather than duplicated into localStorage —
  // only the pointer (rowId/kind/category) lives there.
  const didRestoreSessionRef = useRef(false);
  const [sessionHydrated, setSessionHydrated] = useState(false);

  useEffect(() => {
    if (!userId || didRestoreSessionRef.current) return;
    didRestoreSessionRef.current = true;
    let cancelled = false;

    (async () => {
      const pointer = readStudioSessionPointer(userId);
      if (!pointer) { setSessionHydrated(true); return; }

      const row = await fetchStudioSessionRow(pointer.rowId);
      if (cancelled) return;

      if (row) {
        setKind(pointer.kind);
        setCategory(pointer.category);
        setForm((f) => ({ ...f, category: pointer.category }));
        setResult(row.result);
        setRowId(pointer.rowId);
        setSessionSeed(row);
        setResultCategory(pointer.category);
        if (pointer.kind === "template" && row.initialCustomization?.kind === "template") {
          setTemplateFrame(row.initialCustomization.frameId);
        }
      } else {
        clearStudioSessionPointer(userId);
      }
      setSessionHydrated(true);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId || !sessionHydrated) return;
    if (rowId && result) {
      // Pointer describes the *result*, not whichever tab is currently being
      // browsed — those can now differ while peeking at another workflow.
      writeStudioSessionPointer(userId, { rowId, kind: result.kind, category: resultCategory });
    } else {
      clearStudioSessionPointer(userId);
    }
  }, [userId, sessionHydrated, rowId, result, resultCategory]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function switchKind(next: WorkflowKind) {
    setKind(next);
    const nextCat = defaultCategoryFor(next);
    setCategory(nextCat);
    setForm((f) => ({ ...f, category: nextCat }));
    // Deliberately leave result/rowId/sessionSeed/resultCategory alone —
    // switching tabs to peek at another workflow shouldn't discard whatever
    // was generated under the tab you're leaving. It reappears if you switch
    // back (see the `result.kind === kind` check below); it's only actually
    // replaced when Generate succeeds for the new kind.
  }

  function pickCategory(next: ContentCategory) {
    setCategory(next);
    setForm((f) => ({ ...f, category: next }));
  }

  async function run() {
    if (kind === "template" && !isPro) {
      setUpgradePrompt("Template Studio's ready-made promo designs are a Growth feature.");
      return;
    }
    if (!isPro && (form.tone !== "Standard" || form.audience !== "General Public")) {
      setUpgradePrompt("Custom tones and audience targeting are a Growth feature.");
      return;
    }
    if (!form.topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    setLoading(true);
    setStage(0);
    setOutOfCredits(false);
    const ticker = setInterval(() => {
      setStage((s) => Math.min(s + 1, PROGRESS_STAGES.length - 1));
    }, 900);
    try {
      const out = await callGenerate({
        data: {
          kind,
          ...form,
          category,
          brand: supabaseBrand,
        },
      });
      // Only replace the in-memory result once generation actually succeeds
      // for this kind — a failed attempt leaves whatever was there (this
      // kind's own previous post, or another kind's preserved-while-peeking
      // one) intact instead of blanking the screen.
      setRowId((out as any)._rowId ?? null);
      setResult(out);
      setResultCategory(category);
      setSessionSeed(null);
      toast.success("Your content is ready");
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
      clearInterval(ticker);
      setLoading(false);
    }
  }

  const activeWorkflow = workflows.find((w) => w.kind === kind)!;
  const recommendedCategories = contentCategories.filter((c) => c.bestFor.includes(kind));
  const otherCategories = contentCategories.filter((c) => !c.bestFor.includes(kind));
  // Only show `result` while it belongs to the currently-selected tab —
  // peeking at another workflow hides it (without discarding it) rather
  // than rendering a different kind's post under the wrong tab.
  const showResult = !!result && result.kind === kind;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Content Studio</h1>
        <p className="text-muted-foreground mt-1">
          Pick a format and generate complete, ready-to-publish healthcare content.
        </p>
      </div>

      <BrandKitProgressBanner percent={brandKitPercent} />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {workflows.map((w) => {
          const Icon = ICONS[w.icon] ?? Square;
          const active = w.kind === kind;
          return (
            <button
              key={w.kind}
              type="button"
              onClick={() => switchKind(w.kind)}
              className={`group relative text-left rounded-xl border p-4 transition-all ${
                active
                  ? "border-[color:var(--teal)] bg-gradient-to-br from-[color:var(--teal)]/10 to-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-[color:var(--teal)]/50"
              }`}
            >
              {w.badge && (
                <Badge variant={w.badge === "Growth" ? "solid" : "warning"} className="absolute right-3 top-3 py-0 text-[10px]">
                  {w.badge}
                </Badge>
              )}
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
                    <CategoryChip key={c.id} cat={c} active={category === c.id} onClick={() => pickCategory(c.id)} />
                  ))}
                </div>
                {otherCategories.length > 0 && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">More categories</summary>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {otherCategories.map((c) => (
                        <CategoryChip key={c.id} cat={c} active={category === c.id} onClick={() => pickCategory(c.id)} />
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </Field>

            <Field label="Medical Specialty">
              <SpecialtySelect value={form.specialty} onChange={(v) => update("specialty", v)} />
            </Field>

            {kind === "festive" ? (
              <>
                <Field label="Occasion / Festival">
                  <Input
                    value={form.festival ?? ""}
                    onChange={(e) => update("festival", e.target.value)}
                    placeholder="e.g. Diwali, World Oral Health Day, Clinic Anniversary"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {festivals.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => update("festival", f)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                          form.festival === f
                            ? "bg-[color:var(--teal)] text-white border-[color:var(--teal)]"
                            : "bg-background border-border hover:bg-accent"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Message angle (Topic / Prompt)">
                  <Input
                    value={form.topic}
                    onChange={(e) => update("topic", e.target.value)}
                    placeholder="e.g. Wish patients good health this season"
                  />
                </Field>
                <Field label="Creative Style">
                  <Select
                    value={form.festiveStyle ?? "Warm & Friendly"}
                    onValueChange={(v) => update("festiveStyle", v as NonNullable<typeof form.festiveStyle>)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Professional","Warm & Friendly","Premium","Luxury Clinic","Traditional","Modern Social Media","Community-Focused"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Additional Instructions (optional)">
                  <Textarea
                    value={form.customInstructions ?? ""}
                    onChange={(e) => update("customInstructions", e.target.value)}
                    rows={3}
                    placeholder="e.g. Mention our new clinic branch."
                  />
                </Field>
              </>
            ) : (
              <Field label="Topic / Prompt">
                <Input
                  value={form.topic}
                  onChange={(e) => update("topic", e.target.value)}
                  placeholder={kind === "campaign" ? "e.g. Heart health awareness month" : "e.g. Root canal myths"}
                />
              </Field>
            )}

            <Field label="Content Language">
              <Select value={form.language ?? "English"} onValueChange={(v) => update("language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground pt-1">
                All the text on the creative (and captions/scripts) is written in this language.
              </p>
            </Field>

            {kind === "carousel" && (
              <Field label={`Slides — ${form.slideCount}`}>
                <input
                  type="range" min={2} max={10} value={form.slideCount}
                  onChange={(e) => update("slideCount", Number(e.target.value))}
                  className="w-full accent-[color:var(--teal)]"
                />
              </Field>
            )}

            <Field label="Tone">
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => {
                  const toneLocked = !isPro && t !== "Standard";
                  return (
                    <button
                      key={t} type="button"
                      onClick={() => {
                        if (toneLocked) {
                          setUpgradePrompt("Professional, Educational, Friendly & Motivational tones are a Growth feature.");
                          return;
                        }
                        update("tone", t);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        form.tone === t ? "bg-[color:var(--teal)] text-white border-[color:var(--teal)]" : "bg-background border-border hover:bg-accent"
                      } ${toneLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              {!isPro && (
                <p className="text-[11px] text-muted-foreground pt-1.5">
                  Starter plan writes in Standard tone only.{" "}
                  {trialEligible ? "Try Growth for ₹1" : "Upgrade to Growth"} for Professional, Educational, Friendly & Motivational tones.
                </p>
              )}
            </Field>

            <Field label="Target Audience">
              <Select value={form.audience} onValueChange={(v) => update("audience", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {audiences.map((a) => {
                    const audienceLocked = !isPro && a !== "General Public";
                    return (
                      <SelectItem
                        key={a} value={a}
                        className={audienceLocked ? "opacity-50" : ""}
                        onSelect={(e) => {
                          if (audienceLocked) {
                            e.preventDefault();
                            setUpgradePrompt("Targeting Patients, Existing Patients, Parents & Healthcare Professionals is a Growth feature.");
                          }
                        }}
                      >
                        {a}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!isPro && (
                <p className="text-[11px] text-muted-foreground pt-1">
                  Starter plan targets General Public only.{" "}
                  {trialEligible ? "Try Growth for ₹1" : "Upgrade to Growth"} to target patients, parents, healthcare professionals & more.
                </p>
              )}
            </Field>

            {kind === "template" && !isPro ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Template Studio is a Growth feature — browse the designs, then{" "}
                  {trialEligible ? "start your ₹1 trial" : "upgrade"} to create with them.
                </p>
                <Button size="lg" className="w-full gap-2" onClick={() => window.location.href = "/subscription"}>
                  <Sparkles className="h-4 w-4" />
                  {growthButtonLabel(trialEligible)}
                </Button>
              </div>
            ) : (
              <Button onClick={run} disabled={loading} size="lg" className="w-full gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating…" : `Generate ${activeWorkflow.title}`}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {loading && <LoadingPanel stage={stage} />}

          {!loading && outOfCredits && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm font-medium">You've run out of AI generations for this period.</p>
                <Button size="sm" variant="destructive" onClick={() => window.location.href = "/subscription"}>
                  {growthButtonLabel(trialEligible)}
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !showResult && !outOfCredits && (
            kind === "template" ? (
              <TemplateGalleryCard value={templateFrame} onChange={setTemplateFrame} />
            ) : (
              <Card className="border-border/60 border-dashed">
                <CardContent className="grid place-items-center text-center py-20 text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[color:var(--teal)]/20 to-primary/20 grid place-items-center mb-4">
                    <Sparkles className="h-6 w-6 text-[color:var(--teal)]" />
                  </div>
                  <p className="font-medium text-foreground">Your {activeWorkflow.title.toLowerCase()} preview will appear here</p>
                  <p className="text-sm mt-1">Fill in the brief and hit Generate.</p>
                </CardContent>
              </Card>
            )
          )}

          {!loading && showResult && result && (
            <>
              <ResultPreview
                result={result} specialty={form.specialty} rowId={rowId} category={resultCategory} topic={form.topic}
                templateFrame={templateFrame} onTemplateFrameChange={setTemplateFrame}
                sessionSeed={sessionSeed}
              />
              <VisualConceptCard visual={result.visual} />
            </>
          )}
        </div>
      </div>

      <Dialog open={!!upgradePrompt} onOpenChange={(open) => !open && setUpgradePrompt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[color:var(--teal)]" />
              {growthHeadline(trialEligible)}
            </DialogTitle>
            <DialogDescription>{upgradePrompt}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-col sm:justify-stretch sm:space-x-0 gap-2">
            <Button onClick={() => window.location.href = "/subscription"} className="w-full">{growthHeadline(trialEligible)}</Button>
            <Button variant="outline" onClick={() => setUpgradePrompt(null)} className="w-full">Maybe later</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function CategoryChip({ cat, active, onClick }: { cat: { id: ContentCategory; title: string; tagline: string; emoji: string }; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick} title={cat.tagline}
      className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5 ${
        active ? "border-[color:var(--teal)] bg-[color:var(--teal)]/10 text-foreground shadow-sm" : "border-border bg-background hover:border-[color:var(--teal)]/50 text-foreground"
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
              <div className="h-full bg-gradient-to-r from-[color:var(--teal)] to-primary transition-all duration-700" style={{ width: `${pct}%` }} />
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

function ResultPreview({ result, specialty, rowId, category, topic, templateFrame, onTemplateFrameChange, sessionSeed }: {
  result: GenerateOutput; specialty: string; rowId: string | null; category: ContentCategory; topic: string;
  templateFrame: TemplateFrameId; onTemplateFrameChange: (id: TemplateFrameId) => void;
  sessionSeed: StudioSessionRow | null;
}) {
  switch (result.kind) {
    case "single":   return <SinglePostPreview post={result} specialty={specialty} rowId={rowId} category={category} topic={topic}
                        initialImageUrl={sessionSeed?.initialImageUrl ?? null}
                        initialCustomization={sessionSeed?.initialCustomization?.kind === "single" ? sessionSeed.initialCustomization : null} />;
    case "carousel": return <CarouselPreview post={result} specialty={specialty} rowId={rowId} category={category} topic={topic}
                        initialSlideImages={sessionSeed?.initialSlideImages ?? null}
                        initialCustomization={sessionSeed?.initialCustomization?.kind === "carousel" ? sessionSeed.initialCustomization : null} />;
    case "story":    return <StoryPreview post={result} specialty={specialty} rowId={rowId}
                        initialImageUrl={sessionSeed?.initialImageUrl ?? null}
                        initialCustomization={sessionSeed?.initialCustomization?.kind === "story" ? sessionSeed.initialCustomization : null} />;
    case "reel":     return <ReelPreview post={result} specialty={specialty} />;
    case "campaign": return <CampaignPreview plan={result} />;
    case "festive":  return <FestivePreview post={result} specialty={specialty} rowId={rowId}
                        initialImageUrl={sessionSeed?.initialImageUrl ?? null}
                        initialCustomization={sessionSeed?.initialCustomization?.kind === "festive" ? sessionSeed.initialCustomization : null} />;
    case "template": return <TemplatePreview post={result} rowId={rowId} frameId={templateFrame} onFrameChange={onTemplateFrameChange}
                        initialImageUrl={sessionSeed?.initialImageUrl ?? null}
                        initialCustomization={sessionSeed?.initialCustomization?.kind === "template" ? sessionSeed.initialCustomization : null} />;
  }
}

function copyText(text: string, label = "Copied") {
  navigator.clipboard.writeText(text);
  toast.success(label);
}

function savePng(dataUrl: string, name: string) {
  const link = document.createElement("a");
  link.download = name;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function PreviewToolbar({ onCopy, title }: { onCopy?: () => void; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {onCopy && (
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 h-8" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5" /> Copy
        </Button>
      )}
    </div>
  );
}

export function CreativeActions({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto grid w-full max-w-md grid-cols-2 gap-2 ${className}`}>
      {children}
    </div>
  );
}

export const CREATIVE_DESIGN_WIDTH = 540;

export function ExactScalePreview({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / CREATIVE_DESIGN_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={hostRef}
      className="relative w-full"
      style={scale === null ? { aspectRatio: "1 / 1" } : { height: CREATIVE_DESIGN_WIDTH * scale }}
    >
      {scale !== null && (
        <div
          className="absolute left-0 top-0"
          style={{ width: CREATIVE_DESIGN_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function useAiImage(contentId?: string | null, initialUrl?: string | null) {
  const call = useServerFn(generateImage);
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [loading, setLoading] = useState(false);
  const run = async (prompt: string, visualStyle?: string) => {
    if (!prompt || !prompt.trim()) { toast.error("No image prompt available — re-generate the content first."); return; }
    setLoading(true);
    try {
      const r = await call({ data: { prompt, visualStyle, contentId: contentId ?? undefined } });
      setUrl(r.dataUrl);
    } catch (e: any) {
      const msg = e?.message ?? e?.data?.message ?? (typeof e === "string" ? e : null) ?? "Image generation failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  return { url, loading, run, setUrl };
}

export function AiImageButton({ loading, hasImage, onClick, size = "sm", label }: { loading: boolean; hasImage: boolean; onClick: () => void; size?: "sm" | "xs"; label?: string }) {
  return (
    <Button
      type="button" onClick={onClick} disabled={loading} size="sm"
      variant={hasImage ? "outline" : "default"}
      className={`gap-1.5 ${size === "xs" ? "h-7 text-[11px] px-2.5" : "h-8"}`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : hasImage ? <RefreshCw className="h-3.5 w-3.5" /> : <Wand className="h-3.5 w-3.5" />}
      {loading ? "Generating…" : label ?? (hasImage ? "Regenerate visual" : "Generate AI visual")}
    </Button>
  );
}

function SinglePostPreview({ post, specialty, rowId, category, topic, initialImageUrl, initialCustomization }: {
  post: SinglePost; specialty: string; rowId?: string | null; category: ContentCategory; topic: string;
  initialImageUrl?: string | null; initialCustomization?: SingleCustomization | null;
}) {
  const [brand] = useBrandKit();
  const ai = useAiImage(rowId, initialImageUrl);
  const savedTheme = initialCustomization?.theme;
  const [themeId, setThemeId] = useState<string>(() => savedTheme?.themeId ?? suggestThemeId(specialty));
  const [layout, setLayout] = useState<SlideLayout>(() => initialCustomization?.strategy.layout ?? "hero-card");
  const [autoLayout, setAutoLayout] = useState(() => initialCustomization?.autoLayout ?? true);
  const [fontFamily, setFontFamily] = useState<string>(() => savedTheme?.fontFamily ?? carouselThemes[0].fontFamily);
  const [fontScale, setFontScale] = useState<number>(() => savedTheme?.fontScale ?? 1);
  const [headingColor, setHeadingColor] = useState<string | null>(() => savedTheme?.headingColor ?? null);
  const [textColor, setTextColor] = useState<string | null>(() => savedTheme?.textColor ?? null);
  const [accentColor, setAccentColor] = useState<string | null>(() => savedTheme?.accentColor ?? null);
  const [useBrandColors, setUseBrandColors] = useState<boolean>(() => savedTheme?.useBrandColors ?? true);
  const [showIcons, setShowIcons] = useState<boolean>(() => savedTheme?.showIcons ?? true);
  const [downloading, setDownloading] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const theme = resolveTheme(
    { themeId, useBrandColors, headingColor, textColor, accentColor, fontFamily, fontScale, showIcons },
    brand,
  );

  const strategy = resolveSinglePostStrategy({ headline: post.headline, content: post.content }, category);
  const effectiveLayout: SlideLayout = autoLayout ? strategy.archetype : layout;

  const canvasProps: Omit<SlideCanvasProps, "imageUrl" | "imageLoading"> = {
    slideTitle: post.headline, slideBody: post.content, slideIndex: 0, totalSlides: 1,
    isCta: true, cta: post.cta, specialty, theme, layout: effectiveLayout,
    fontScale, showIcons, brand,
    topic, category, composition: strategy.composition,
  };

  const customization: SingleCustomization = useMemo(() => ({
    v: 1, engine: "v1", kind: "single",
    theme: { themeId, useBrandColors, headingColor, textColor, accentColor, fontFamily, fontScale, showIcons },
    strategy: { layout: effectiveLayout, composition: strategy.composition },
    autoLayout,
  }), [themeId, useBrandColors, headingColor, textColor, accentColor, fontFamily, fontScale, showIcons, effectiveLayout, strategy.composition, autoLayout]);
  usePersistCustomization(rowId, customization, !!initialCustomization);

  async function captureSinglePostPng(): Promise<string | null> {
    if (!captureRef.current) return null;
    const { toPng } = await import("html-to-image");
    return toPng(captureRef.current, { canvasWidth: 1080, canvasHeight: 1080, pixelRatio: 1, cacheBust: true, filter: isExportableNode });
  }

  async function downloadPost() {
    setDownloading(true);
    try {
      const png = await captureSinglePostPng();
      if (!png) return;
      savePng(png, "medipost-post.png");
      toast.success("Post downloaded");
    } catch (e) {
      console.error("[SinglePostPreview] download failed:", e);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title="Post Preview" />

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <div className="mx-auto w-full max-w-md">
              <ExactScalePreview>
                <SlideCanvas {...canvasProps} imageUrl={ai.url} imageLoading={ai.loading} />
              </ExactScalePreview>
            </div>
            <CreativeActions className="mt-3">
              <AiImageButton
                loading={ai.loading}
                hasImage={!!ai.url}
                onClick={() => ai.run(post.visual.imagePrompt || post.visual.concept, post.visual.visualStyle)}
              />
              <Button
                type="button" size="sm" variant="outline" className="gap-1.5 h-8"
                onClick={downloadPost} disabled={downloading || ai.loading}
              >
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />}
                Download post
              </Button>
            </CreativeActions>
            <RemoveWatermarkRow className="mt-2" />
            <div aria-hidden className="fixed pointer-events-none" style={{ left: -10000, top: 0, width: 540 }}>
              <div ref={captureRef}>
                <SlideCanvas {...canvasProps} imageUrl={ai.url} />
              </div>
            </div>
          </div>

          <StudioControls
            themeId={themeId}
            setThemeId={(id) => {
              setThemeId(id); setFontFamily(getTheme(id).fontFamily);
              setUseBrandColors(false); setHeadingColor(null); setTextColor(null); setAccentColor(null);
            }}
            layout={effectiveLayout}
            setLayout={(v) => { setAutoLayout(false); setLayout(v); }}
            autoLayout={autoLayout}
            setAutoLayout={setAutoLayout}
            recommendedLayout={strategy.archetype}
            fontFamily={fontFamily} setFontFamily={setFontFamily}
            fontScale={fontScale} setFontScale={setFontScale}
            headingColor={headingColor ?? theme.heading} setHeadingColor={setHeadingColor}
            textColor={textColor ?? theme.text} setTextColor={setTextColor}
            accentColor={accentColor ?? theme.accent} setAccentColor={setAccentColor}
            useBrandColors={useBrandColors} setUseBrandColors={setUseBrandColors}
            showIcons={showIcons} setShowIcons={setShowIcons}
          />
        </div>

        <SectionBlock title="Headline" body={post.headline} />
        <SectionBlock title="Main Content" body={post.content} />
        <SectionBlock title="Caption" body={post.caption} />
        <SectionBlock title="Call To Action" body={post.cta} />
        <SectionBlock title="Hashtags" body={post.hashtags.join(" ")} />
        <div className="pt-3 border-t border-border/60">
          <ShareButtons
            text={[post.caption, post.cta, post.hashtags.join(" ")].filter(Boolean).join("\n\n")}
            imageUrl={ai.url}
            captureImage={captureSinglePostPng}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CarouselPreview({ post, specialty, rowId, category, topic, initialSlideImages, initialCustomization }: {
  post: CarouselPost; specialty: string; rowId?: string | null; category: ContentCategory; topic: string;
  initialSlideImages?: (string | null)[] | null; initialCustomization?: CarouselCustomization | null;
}) {
  const [brand] = useBrandKit();
  const callImage = useServerFn(generateImage);
  const savedTheme = initialCustomization?.theme;
  const [idx, setIdx] = useState(0);
  const [themeId, setThemeId] = useState<string>(() => savedTheme?.themeId ?? suggestThemeId(specialty));
  // per-slide manual layout pin — null means "follow the AI recommendation for this
  // slide"; picking a layout only pins the slide you're currently viewing, not the
  // whole carousel. Seeded from persisted state by diffing each slide's saved layout
  // against what the strategy resolver would recommend fresh: if they match, treat it
  // as still-auto (no separate "was this auto" flag is persisted per slide).
  const [layoutOverrides, setLayoutOverrides] = useState<(SlideLayout | null)[]>(() => {
    if (!initialCustomization) return post.slides.map(() => null);
    const total0 = post.slides.length;
    return post.slides.map((s, i) => {
      const saved = initialCustomization.slides[i]?.layout;
      if (!saved) return null;
      const st = resolveVisualStrategy(s, category, { slideIndex: i, totalSlides: total0, isCta: i === total0 - 1 });
      return saved === st.archetype ? null : saved;
    });
  });
  const [fontFamily, setFontFamily] = useState<string>(() => savedTheme?.fontFamily ?? carouselThemes[0].fontFamily);
  const [fontScale, setFontScale] = useState<number>(() => savedTheme?.fontScale ?? 1);
  const [headingColor, setHeadingColor] = useState<string | null>(() => savedTheme?.headingColor ?? null);
  const [textColor, setTextColor] = useState<string | null>(() => savedTheme?.textColor ?? null);
  const [accentColor, setAccentColor] = useState<string | null>(() => savedTheme?.accentColor ?? null);
  const [useBrandColors, setUseBrandColors] = useState<boolean>(() => savedTheme?.useBrandColors ?? true);
  const [showIcons, setShowIcons] = useState<boolean>(() => savedTheme?.showIcons ?? true);
  const [slideImages, setSlideImages] = useState<(string | null)[]>(() => {
    if (initialSlideImages && initialSlideImages.length === post.slides.length) return initialSlideImages;
    return post.slides.map(() => null);
  });
  const [loadingSlide, setLoadingSlide] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const thumbCaptureRefs = useRef<(HTMLDivElement | null)[]>([]);

  if (slideImages.length !== post.slides.length) setSlideImages(post.slides.map(() => null));
  if (layoutOverrides.length !== post.slides.length) setLayoutOverrides(post.slides.map(() => null));

  async function captureSlidePng(i: number): Promise<string | null> {
    const node = thumbCaptureRefs.current[i];
    if (!node) return null;
    const { toPng } = await import("html-to-image");
    return toPng(node, { canvasWidth: 1080, canvasHeight: 1080, pixelRatio: 1, cacheBust: true, filter: isExportableNode });
  }

  async function downloadSlides(indices: number[]) {
    setDownloading(true);
    try {
      for (const i of indices) {
        const png = await captureSlidePng(i);
        if (!png) { toast.error(`Slide ${i + 1} could not be captured`); continue; }
        savePng(png, `medipost-slide-${i + 1}-of-${post.slides.length}.png`);
      }
      toast.success(indices.length === 1 ? "Slide downloaded" : `${indices.length} slides downloaded`);
    } catch (e) {
      console.error("[CarouselPreview] slide download failed:", e);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function genSlideImage(i: number) {
    const s = post.slides[i];
    const prompt = s?.imagePrompt || `${post.visual.imagePrompt || post.visual.concept}. Scene focus: ${s?.title}. ${s?.content}`;
    if (!prompt.trim()) { toast.error("No image prompt available for this slide"); return; }
    setLoadingSlide(i);
    try {
      const r = await callImage({ data: {
        prompt, visualStyle: post.visual.visualStyle,
        contentId: rowId ?? undefined, slideIndex: i, slideCount: post.slides.length,
      } });
      setSlideImages((arr) => { const next = [...arr]; next[i] = r.dataUrl; return next; });
    } catch (e: any) {
      const msg = e?.message ?? e?.data?.message ?? (typeof e === "string" ? e : null) ?? "Image generation failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoadingSlide(null);
    }
  }

  async function genAll() {
    setBulkLoading(true);
    try {
      for (let i = 0; i < post.slides.length; i++) {
        if (slideImages[i]) continue;
        await genSlideImage(i);
      }
      toast.success("All slide visuals ready");
    } finally {
      setBulkLoading(false);
    }
  }

  const theme = resolveTheme(
    { themeId, useBrandColors, headingColor, textColor, accentColor, fontFamily, fontScale, showIcons },
    brand,
  );

  const total = post.slides.length;
  const slide = post.slides[idx];

  const slidesStrategy = useMemo(() => post.slides.map((s, i) => {
    const st = resolveVisualStrategy(s, category, { slideIndex: i, totalSlides: total, isCta: i === total - 1 });
    return { layout: (layoutOverrides[i] ?? st.archetype) as SlideLayout, composition: st.composition };
  }), [post.slides, category, total, layoutOverrides]);

  const customization: CarouselCustomization = useMemo(() => ({
    v: 1, engine: "v1", kind: "carousel",
    theme: { themeId, useBrandColors, headingColor, textColor, accentColor, fontFamily, fontScale, showIcons },
    autoLayout: layoutOverrides.every((v) => v == null), slides: slidesStrategy,
  }), [themeId, useBrandColors, headingColor, textColor, accentColor, fontFamily, fontScale, showIcons, layoutOverrides, slidesStrategy]);
  usePersistCustomization(rowId, customization, !!initialCustomization);

  if (!slide) return null;

  const strategy = resolveVisualStrategy(slide, category, { slideIndex: idx, totalSlides: total, isCta: idx === total - 1 });
  const currentOverride = layoutOverrides[idx] ?? null;
  const effectiveLayout: SlideLayout = currentOverride ?? strategy.archetype;

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title={post.title || "Carousel Preview"} />

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <div className="relative mx-auto w-full max-w-md">
              <ExactScalePreview>
                <SlideCanvas
                  slideTitle={slide.title} slideBody={slide.content} slideIndex={idx} totalSlides={total}
                  isCta={idx === total - 1} cta={post.cta} specialty={specialty} theme={theme} layout={effectiveLayout}
                  fontScale={fontScale} showIcons={showIcons} brand={brand}
                  imageUrl={slideImages[idx]} imageLoading={loadingSlide === idx}
                  topic={topic} category={category} composition={strategy.composition}
                />
              </ExactScalePreview>
              <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-background border border-border shadow disabled:opacity-40">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setIdx((i) => Math.min(total - 1, i + 1))} disabled={idx === total - 1}
                className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-background border border-border shadow disabled:opacity-40">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <CreativeActions className="mt-3">
              <AiImageButton
                loading={loadingSlide === idx} hasImage={!!slideImages[idx]} onClick={() => genSlideImage(idx)}
                label={slideImages[idx] ? "Regenerate visual" : "Generate visual"}
              />
              <Button type="button" size="sm" variant="secondary" className="gap-1.5 h-8"
                disabled={bulkLoading || loadingSlide !== null} onClick={genAll}>
                {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand className="h-3.5 w-3.5" />}
                {bulkLoading ? "Generating…" : "Generate all"}
              </Button>
              <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8"
                disabled={downloading} onClick={() => downloadSlides([idx])}>
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />}
                Download slide
              </Button>
              <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8"
                disabled={downloading} onClick={() => downloadSlides(post.slides.map((_, i) => i))}>
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />}
                Download all
              </Button>
            </CreativeActions>
            <RemoveWatermarkRow className="mt-2" />

            <div aria-hidden className="fixed pointer-events-none" style={{ left: -10000, top: 0, width: 540 }}>
              {post.slides.map((s, i) => {
                const st = resolveVisualStrategy(s, category, { slideIndex: i, totalSlides: total, isCta: i === total - 1 });
                const captureLayout: SlideLayout = layoutOverrides[i] ?? st.archetype;
                return (
                  <div key={i} ref={(el) => { thumbCaptureRefs.current[i] = el; }}>
                    <SlideCanvas
                      slideTitle={s.title} slideBody={s.content} slideIndex={i} totalSlides={total}
                      isCta={i === total - 1} cta={post.cta} specialty={specialty} theme={theme} layout={captureLayout}
                      fontScale={fontScale} showIcons={showIcons} brand={brand}
                      imageUrl={slideImages[i]}
                      topic={topic} category={category} composition={st.composition}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <StudioControls
            themeId={themeId}
            setThemeId={(id) => {
              setThemeId(id); setFontFamily(getTheme(id).fontFamily);
              setUseBrandColors(false); setHeadingColor(null); setTextColor(null); setAccentColor(null);
            }}
            layout={effectiveLayout}
            setLayout={(v) => setLayoutOverrides((arr) => { const next = [...arr]; next[idx] = v; return next; })}
            autoLayout={currentOverride == null}
            setAutoLayout={(v) => { if (v) setLayoutOverrides((arr) => { const next = [...arr]; next[idx] = null; return next; }); }}
            recommendedLayout={strategy.archetype}
            fontFamily={fontFamily} setFontFamily={setFontFamily}
            fontScale={fontScale} setFontScale={setFontScale}
            headingColor={headingColor ?? theme.heading} setHeadingColor={setHeadingColor}
            textColor={textColor ?? theme.text} setTextColor={setTextColor}
            accentColor={accentColor ?? theme.accent} setAccentColor={setAccentColor}
            useBrandColors={useBrandColors} setUseBrandColors={setUseBrandColors}
            showIcons={showIcons} setShowIcons={setShowIcons}
          />
        </div>

        <SectionBlock title="Hashtags" body={post.hashtags.join(" ")} />
        <div className="pt-3 border-t border-border/60">
          <ShareButtons text={post.hashtags.join(" ")} imageUrl={slideImages[idx]} captureImage={() => captureSlidePng(idx)} />
        </div>
      </CardContent>
    </Card>
  );
}

const LEGACY_PHOTO_LAYOUTS = new Set<SlideLayout>(["centered", "image-left", "full-image", "split", "modern-card"]);

export function SlideCanvas(p: SlideCanvasProps) {
  const PrimaryIcon = primaryIconFor(p.specialty);
  const titleSize = 22 * p.fontScale;
  const bodySize = 14 * p.fontScale;
  const baseStyle: React.CSSProperties = { background: p.theme.bg, color: p.theme.text, fontFamily: p.theme.fontFamily };

  return (
    <div className="relative aspect-square rounded-2xl border border-border overflow-hidden shadow-md" style={baseStyle}>
      {p.imageUrl && (
        <>
          <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        </>
      )}
      {p.imageLoading && <ImageLoadingOverlay />}
      {p.showIcons && !p.imageUrl && (
        <ContextualBackground specialty={p.specialty} opacity={p.theme.iconOpacity} color={p.theme.heading} />
      )}
      {p.imageUrl && LEGACY_PHOTO_LAYOUTS.has(p.layout) ? <FullImageOverlayLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "centered" ? <CenteredLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "image-left" ? <ImageLeftLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "full-image" ? <FullImageLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "split" ? <SplitLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "modern-card" ? <ModernCardLayout {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "hero-card" ? <HeroCard {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "icon-grid" ? <IconGrid {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "statistic-hero" ? <StatisticHero {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "comparison-split" ? <ComparisonSplit {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "process-flow" ? <ProcessFlow {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "callout-diagram" ? <CalloutDiagram {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "timeline" ? <Timeline {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "faq-card" ? <FaqCards {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : p.layout === "checklist" ? <Checklist {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />
        : <RadialDiagram {...p} titleSize={titleSize} bodySize={bodySize} PrimaryIcon={PrimaryIcon} />}
      {p.totalSlides > 1 && (
        <>
          <div className="absolute top-3 right-4 z-20 text-[10px] font-medium opacity-80" style={{ color: p.theme.heading }}>
            {p.slideIndex + 1} / {p.totalSlides}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
            {Array.from({ length: p.totalSlides }).map((_, i) => (
              <span key={i} className="h-1 rounded-full transition-all"
                style={{ width: i === p.slideIndex ? 18 : 6, background: i === p.slideIndex ? p.theme.heading : `${p.theme.heading}55` }} />
            ))}
          </div>
        </>
      )}
      <Watermark />
    </div>
  );
}

function StudioControls(props: {
  themeId: string; setThemeId: (v: string) => void; layout: SlideLayout; setLayout: (v: SlideLayout) => void;
  autoLayout: boolean; setAutoLayout: (v: boolean) => void; recommendedLayout: SlideLayout;
  fontFamily: string; setFontFamily: (v: string) => void; fontScale: number; setFontScale: (v: number) => void;
  headingColor: string; setHeadingColor: (v: string | null) => void; textColor: string; setTextColor: (v: string | null) => void;
  accentColor: string; setAccentColor: (v: string | null) => void; useBrandColors: boolean; setUseBrandColors: (v: boolean) => void;
  showIcons: boolean; setShowIcons: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 text-sm h-fit">
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Theme</Label>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {carouselThemes.map((t) => {
            const active = t.id === props.themeId;
            return (
              <button key={t.id} type="button" onClick={() => props.setThemeId(t.id)}
                className={`rounded-md border overflow-hidden text-left ${active ? "ring-2 ring-[color:var(--teal)] border-[color:var(--teal)]" : "border-border"}`}
                title={t.tagline}>
                <div className="h-8" style={{ background: t.bg }} />
                <div className="px-1.5 py-1"><p className="text-[10px] font-semibold leading-tight">{t.name}</p></div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Layout</Label>
          {props.autoLayout && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[color:var(--teal)]/15 text-[color:var(--teal)]">
              Recommended
            </span>
          )}
        </div>
        <Select value={props.layout} onValueChange={(v) => props.setLayout(v as SlideLayout)}>
          <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{slideLayouts.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
        </Select>
        {!props.autoLayout && (
          <button type="button" onClick={() => props.setAutoLayout(true)}
            className="mt-1.5 text-[11px] text-[color:var(--teal)] hover:underline">
            Reset to recommended ({slideLayouts.find((l) => l.id === props.recommendedLayout)?.name})
          </button>
        )}
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Font</Label>
        <Select value={props.fontFamily} onValueChange={props.setFontFamily}>
          <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{fontFamilies.map((f) => <SelectItem key={f.id} value={f.id}><span style={{ fontFamily: f.id }}>{f.name}</span></SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Font size</Label>
          <span className="text-xs font-mono">{Math.round(props.fontScale * 100)}%</span>
        </div>
        <input type="range" min={0.8} max={1.4} step={0.05} value={props.fontScale}
          onChange={(e) => props.setFontScale(Number(e.target.value))} className="w-full accent-[color:var(--teal)] mt-1.5" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MiniColor label="Heading" value={props.headingColor} onChange={props.setHeadingColor} />
        <MiniColor label="Body" value={props.textColor} onChange={props.setTextColor} />
        <MiniColor label="Accent" value={props.accentColor} onChange={props.setAccentColor} />
      </div>
      <div className="space-y-2 pt-1">
        <label className="flex items-center justify-between gap-2 text-xs cursor-pointer">
          <span>Use clinic brand colors</span>
          <input type="checkbox" checked={props.useBrandColors} onChange={(e) => props.setUseBrandColors(e.target.checked)} className="accent-[color:var(--teal)]" />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs cursor-pointer">
          <span>Show contextual icons</span>
          <input type="checkbox" checked={props.showIcons} onChange={(e) => props.setShowIcons(e.target.checked)} className="accent-[color:var(--teal)]" />
        </label>
      </div>
    </div>
  );
}

function MiniColor({ label, value, onChange }: { label: string; value: string; onChange: (v: string | null) => void }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-8 w-full rounded border border-border cursor-pointer bg-transparent" />
    </div>
  );
}

/** Reposition/zoom the generated or uploaded photo within the frame's photo window — for
 *  when the subject lands off-center or gets cropped by a frame's fixed shape. Sliders drive
 *  the same objectPosition/transform the preview already renders with, so the effect is
 *  visible live and identical to what downloads. */
function PhotoAdjustPanel({
  offsetX, offsetY, zoom, onOffsetXChange, onOffsetYChange, onZoomChange, hasCustom, onReset,
}: {
  offsetX: number; offsetY: number; zoom: number;
  onOffsetXChange: (v: number) => void; onOffsetYChange: (v: number) => void; onZoomChange: (v: number) => void;
  hasCustom: boolean; onReset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Adjust photo</Label>
        {hasCustom && (
          <button type="button" onClick={onReset} className="text-[11px] text-[color:var(--teal)] hover:underline">
            Reset
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Horizontal position</span><span>{Math.round(offsetX)}%</span>
        </div>
        <Slider value={[offsetX]} min={0} max={100} step={1} onValueChange={([v]) => onOffsetXChange(v)} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Vertical position</span><span>{Math.round(offsetY)}%</span>
        </div>
        <Slider value={[offsetY]} min={0} max={100} step={1} onValueChange={([v]) => onOffsetYChange(v)} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Zoom</span><span>{zoom.toFixed(2)}x</span>
        </div>
        <Slider value={[zoom]} min={1} max={2.5} step={0.05} onValueChange={([v]) => onZoomChange(v)} />
      </div>
    </div>
  );
}

function StoryPreview({ post, specialty, rowId, initialImageUrl, initialCustomization }: {
  post: StoryPost; specialty: string; rowId?: string | null;
  initialImageUrl?: string | null; initialCustomization?: StoryCustomization | null;
}) {
  const [brand] = useBrandKit();
  const ai = useAiImage(rowId, initialImageUrl);
  const storyRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const [useBrandColors, setUseBrandColors] = useState(() => initialCustomization?.useBrandColors ?? true);
  const [primaryColor, setPrimaryColor] = useState<string | null>(() => initialCustomization?.primaryColor ?? null);
  const [secondaryColor, setSecondaryColor] = useState<string | null>(() => initialCustomization?.secondaryColor ?? null);
  const [tertiaryColor, setTertiaryColor] = useState<string | null>(() => initialCustomization?.tertiaryColor ?? null);
  const palette = post.visual.colors;
  const cardColors = resolveStoryColors({ useBrandColors, primaryColor, secondaryColor, tertiaryColor }, brand, palette);
  const hasManualColors = primaryColor !== null || secondaryColor !== null || tertiaryColor !== null;
  const resetManualColors = () => { setPrimaryColor(null); setSecondaryColor(null); setTertiaryColor(null); };

  const customization: StoryCustomization = useMemo(() => ({
    v: 1, engine: "v1", kind: "story",
    useBrandColors, primaryColor, secondaryColor, tertiaryColor,
  }), [useBrandColors, primaryColor, secondaryColor, tertiaryColor]);
  usePersistCustomization(rowId, customization, !!initialCustomization);

  async function captureStoryPng(): Promise<string | null> {
    if (!storyRef.current) return null;
    const { toPng } = await import("html-to-image");
    return toPng(storyRef.current, { canvasWidth: 1080, canvasHeight: 1920, pixelRatio: 1, cacheBust: true, filter: isExportableNode });
  }

  async function downloadStory() {
    setDownloading(true);
    try {
      const png = await captureStoryPng();
      if (!png) return;
      const link = document.createElement("a");
      link.download = `medipost-story-${Date.now()}.png`;
      link.href = png;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Story downloaded (1080×1920)");
    } catch (e) {
      console.error("[StoryPreview] download failed:", e);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title="Story (9:16) Preview" />
        <StoryCard
          ref={storyRef}
          headline={post.headline}
          message={post.message}
          cta={post.cta}
          colors={post.visual.colors}
          brand={brand}
          specialty={specialty}
          imageUrl={ai.url}
          imageLoading={ai.loading}
          loadingOverlay={<ImageLoadingOverlay />}
          colorOverrides={cardColors}
        />
        <div className="space-y-2">
          <div className="flex flex-wrap justify-center gap-2">
            <AiImageButton loading={ai.loading} hasImage={!!ai.url}
              onClick={() => ai.run(post.visual.imagePrompt || post.visual.concept, post.visual.visualStyle)} />
            <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8" disabled={downloading || ai.loading} onClick={downloadStory}>
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />}
              Download story
            </Button>
          </div>
          <RemoveWatermarkRow />
        </div>

        <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Card colors</Label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <span>Use clinic brand colors</span>
              <input type="checkbox" checked={useBrandColors} className="accent-[color:var(--teal)]"
                onChange={(e) => { setUseBrandColors(e.target.checked); resetManualColors(); }} />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniColor label="Top" value={cardColors.primary} onChange={setPrimaryColor} />
            <MiniColor label="Middle" value={cardColors.secondary} onChange={setSecondaryColor} />
            <MiniColor label="Bottom" value={cardColors.tertiary} onChange={setTertiaryColor} />
          </div>
          {hasManualColors && (
            <button type="button" onClick={resetManualColors} className="text-[11px] text-[color:var(--teal)] hover:underline">
              Reset to suggested colors
            </button>
          )}
        </div>

        <SectionBlock title="Headline" body={post.headline} />
        <SectionBlock title="Short Message" body={post.message} />
        <SectionBlock title="CTA" body={post.cta} />
        <div className="pt-3 border-t border-border/60">
          <ShareButtons
            text={[post.headline, post.message, post.cta].filter(Boolean).join("\n\n")}
            imageUrl={ai.url}
            captureImage={captureStoryPng}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ReelPreview({ post, specialty }: { post: ReelScript; specialty: string }) {
  const fullText = `HOOK (0-3s)\n${post.hook}\n\nMAIN TALKING POINTS\n` +
    post.talkingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n") + `\n\nCTA\n${post.cta}`;
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
              <p className="text-xs font-semibold tracking-wide text-muted-foreground mb-2">MAIN TALKING POINTS</p>
              <ol className="space-y-2">
                {post.talkingPoints.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="h-5 w-5 shrink-0 grid place-items-center rounded-full bg-[color:var(--teal)]/15 text-[color:var(--teal)] text-[11px] font-semibold">{i + 1}</span>
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
            <ScriptRow label="CTA" time="End" text={post.cta} />
          </div>
        </div>
        <div className="pt-3 border-t border-border/60">
          <ShareButtons text={fullText} />
        </div>
      </CardContent>
    </Card>
  );
}

function ScriptRow({ label, time, text, accent }: { label: string; time: string; text: string; accent?: boolean }) {
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

function CampaignPreview({ plan }: { plan: Campaign }) {
  const fullText = `Theme: ${plan.theme}\nObjective: ${plan.objective}\n\nPost ideas:\n` +
    plan.postIdeas.map((p, i) => `${i + 1}. ${p}`).join("\n") + `\n\nWeekly schedule:\n` +
    plan.weeklySchedule.map((d) => `${d.day} · ${d.format} — ${d.idea}`).join("\n") + `\n\nCTAs:\n` +
    plan.ctaSuggestions.map((c) => `⬢ ${c}`).join("\n");
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
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Post Ideas</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {plan.postIdeas.map((p, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3 text-sm flex gap-3">
                <span className="h-5 w-5 shrink-0 grid place-items-center rounded-full bg-[color:var(--teal)]/15 text-[color:var(--teal)] text-[11px] font-semibold">{i + 1}</span>
                <span className="leading-relaxed">{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Suggested Weekly Schedule</p>
          <div className="grid gap-2">
            {plan.weeklySchedule.map((d, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[color:var(--teal)]/10 text-[color:var(--teal)] grid place-items-center font-semibold text-sm">{d.day.slice(0, 3)}</div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{d.format}</p>
                  <p className="text-sm mt-0.5">{d.idea}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">CTA Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {plan.ctaSuggestions.map((c, i) => <Badge key={i} variant="secondary" className="text-xs py-1.5 px-3">{c}</Badge>)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FestivePreview({ post, specialty, rowId, initialImageUrl, initialCustomization }: {
  post: FestivePost; specialty: string; rowId?: string | null;
  initialImageUrl?: string | null; initialCustomization?: FestiveCustomization | null;
}) {
  const [brand] = useBrandKit();
  const ai = useAiImage(rowId, initialImageUrl);
  const { cardRef, download, captureDataUrl } = useDownloadPost(brand.doctorName || brand.clinicName || "medipost");

  const [useBrandColors, setUseBrandColors] = useState(() => initialCustomization?.useBrandColors ?? true);
  const [frameColor, setFrameColor] = useState<string | null>(() => initialCustomization?.frameColor ?? null);
  const [glowColor, setGlowColor] = useState<string | null>(() => initialCustomization?.glowColor ?? null);
  const [accentColor, setAccentColor] = useState<string | null>(() => initialCustomization?.accentColor ?? null);
  const [contactBgColor, setContactBgColor] = useState<string | null>(() => initialCustomization?.contactBgColor ?? null);
  const palette = post.visual.colors;
  const cardColors = resolveFestiveColors({ useBrandColors, frameColor, glowColor, accentColor, contactBgColor }, brand, palette);
  const hasManualColors = frameColor !== null || glowColor !== null || accentColor !== null || contactBgColor !== null;
  const resetManualColors = () => { setFrameColor(null); setGlowColor(null); setAccentColor(null); setContactBgColor(null); };

  const customization: FestiveCustomization = useMemo(() => ({
    v: 1, engine: "v1", kind: "festive",
    useBrandColors, frameColor, glowColor, accentColor, contactBgColor,
  }), [useBrandColors, frameColor, glowColor, accentColor, contactBgColor]);
  usePersistCustomization(rowId, customization, !!initialCustomization);

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title={`${post.festival} Greeting`} />

        <div className="flex justify-center">
          <FestiveCard
            ref={cardRef}
            festival={post.festival}
            greeting={post.greeting}
            colors={post.visual.colors}
            brand={brand}
            specialty={specialty}
            imageUrl={ai.url}
            imageLoading={ai.loading}
            loadingOverlay={<ImageLoadingOverlay />}
            colorOverrides={cardColors}
          />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap justify-center gap-2">
            <AiImageButton loading={ai.loading} hasImage={!!ai.url} label={ai.url ? "Regenerate visual" : "Generate festive visual"}
              onClick={() => ai.run(post.visual.imagePrompt || post.visual.concept, post.visual.visualStyle)} />
            <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8" onClick={download} disabled={ai.loading}>
              <ImageDown className="h-3.5 w-3.5" /> Download post
            </Button>
          </div>
          <RemoveWatermarkRow />
        </div>

        <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Card colors</Label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <span>Use clinic brand colors</span>
              <input type="checkbox" checked={useBrandColors} className="accent-[color:var(--teal)]"
                onChange={(e) => { setUseBrandColors(e.target.checked); resetManualColors(); }} />
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MiniColor label="Frame" value={cardColors.frame} onChange={setFrameColor} />
            <MiniColor label="Glow" value={cardColors.glow} onChange={setGlowColor} />
            <MiniColor label="Text accent" value={cardColors.accent} onChange={setAccentColor} />
            <MiniColor label="Contact bar" value={cardColors.contactBg} onChange={setContactBgColor} />
          </div>
          {hasManualColors && (
            <button type="button" onClick={resetManualColors} className="text-[11px] text-[color:var(--teal)] hover:underline">
              Reset to suggested colors
            </button>
          )}
        </div>

        <SectionBlock title="Greeting Message" body={post.greeting} />
        <SectionBlock title="Social Caption" body={post.caption} />
        <SectionBlock title="Hashtags" body={post.hashtags.join(" ")} />
        <div className="pt-3 border-t border-border/60">
          <ShareButtons
            text={[post.caption, post.hashtags.join(" ")].filter(Boolean).join("\n\n")}
            imageUrl={ai.url}
            captureImage={captureDataUrl}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FramePicker({ value, onChange, frameProps }: {
  value: TemplateFrameId;
  onChange: (id: TemplateFrameId) => void;
  frameProps: Omit<Parameters<(typeof templateFrames)[number]["Frame"]>[0], "headline" | "subline" | "cta">;
}) {
  return (
    <div className="grid gap-3 grid-cols-2">
      {templateFrames.map((f) => {
        const active = f.id === value;
        return (
          <button
            key={f.id} type="button" onClick={() => onChange(f.id)}
            className={`min-w-0 rounded-xl border p-2 text-left transition-all ${
              active
                ? "border-[color:var(--teal)] ring-2 ring-[color:var(--teal)] shadow-sm"
                : "border-border hover:border-[color:var(--teal)]/50"
            }`}
          >
            <ExactScalePreview>
              <f.Frame {...TEMPLATE_SAMPLES[f.id]} {...frameProps} />
            </ExactScalePreview>
            <p className="mt-1.5 text-xs font-semibold">{f.name}</p>
            <p className="text-[10px] text-muted-foreground">{f.tagline}</p>
          </button>
        );
      })}
    </div>
  );
}

function TemplateGalleryCard({ value, onChange }: { value: TemplateFrameId; onChange: (id: TemplateFrameId) => void }) {
  const [brand] = useBrandKit();
  const frameProps = {
    logo: brand.logo,
    businessName: brand.clinicName,
    phone: brand.phone,
    colors: { primary: brand.primaryColor, secondary: brand.secondaryColor },
    placeholders: true,
  };
  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-4">
        <PreviewToolbar title="Pick a Template Design" />
        <p className="text-sm text-muted-foreground">
          Ready-made promo designs. Your logo, business name and mobile number fill in from your Brand Kit —
          hit Generate to write the text in your language and create a photo for the image window.
        </p>
        <FramePicker value={value} onChange={onChange} frameProps={frameProps} />
      </CardContent>
    </Card>
  );
}

function TemplatePreview({ post, rowId, frameId, onFrameChange, initialImageUrl, initialCustomization }: {
  post: TemplatePost; rowId?: string | null;
  frameId: TemplateFrameId; onFrameChange: (id: TemplateFrameId) => void;
  initialImageUrl?: string | null; initialCustomization?: TemplateCustomization | null;
}) {
  const [brand] = useBrandKit();
  const ai = useAiImage(rowId, initialImageUrl);
  const [downloading, setDownloading] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [useBrandColors, setUseBrandColors] = useState(() => initialCustomization?.useBrandColors ?? true);
  const [primaryPick, setPrimaryPick] = useState<string | null>(() => initialCustomization?.primaryColor ?? null);
  const [secondaryPick, setSecondaryPick] = useState<string | null>(() => initialCustomization?.secondaryColor ?? null);
  const palette = post.visual.colors;
  const colors = resolveTemplateColors({ useBrandColors, primaryColor: primaryPick, secondaryColor: secondaryPick }, brand, palette);
  const hasManualColors = primaryPick !== null || secondaryPick !== null;
  const resetManualColors = () => { setPrimaryPick(null); setSecondaryPick(null); };

  const [imageOffsetX, setImageOffsetX] = useState(() => initialCustomization?.imageOffsetX ?? DEFAULT_TEMPLATE_IMAGE_OFFSET.x);
  const [imageOffsetY, setImageOffsetY] = useState(() => initialCustomization?.imageOffsetY ?? DEFAULT_TEMPLATE_IMAGE_OFFSET.y);
  const [imageZoom, setImageZoom] = useState(() => initialCustomization?.imageZoom ?? DEFAULT_TEMPLATE_IMAGE_OFFSET.zoom);
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
  usePersistCustomization(rowId, customization, !!initialCustomization);

  const entry = getTemplateFrame(frameId);
  const Frame = entry.Frame;
  const frameProps = {
    headline: post.headline,
    subline: post.subline,
    cta: post.cta,
    logo: brand.logo,
    businessName: brand.clinicName,
    phone: brand.phone,
    colors,
    imageUrl: ai.url,
    imageOffsetX, imageOffsetY, imageZoom,
  };

  async function captureTemplatePng(): Promise<string | null> {
    if (!captureRef.current) return null;
    const { toPng } = await import("html-to-image");
    return toPng(captureRef.current, { canvasWidth: 1080, canvasHeight: 1080, pixelRatio: 1, cacheBust: true, filter: isExportableNode });
  }

  async function downloadPost() {
    setDownloading(true);
    try {
      const png = await captureTemplatePng();
      if (!png) return;
      savePng(png, "medipost-template-post.png");
      toast.success("Post downloaded (1080×1080)");
    } catch (e) {
      console.error("[TemplatePreview] download failed:", e);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-5">
        <PreviewToolbar title={`Template Post — ${entry.name}`} />

        <div className="mx-auto w-full max-w-md">
          <ExactScalePreview>
            <Frame {...frameProps} imageLoading={ai.loading} loadingOverlay={<ImageLoadingOverlay />} />
          </ExactScalePreview>
          <CreativeActions className="mt-3">
            <AiImageButton
              loading={ai.loading} hasImage={!!ai.url}
              label={ai.url ? "Regenerate photo" : "Generate photo"}
              onClick={() => ai.run(post.visual.imagePrompt || post.visual.concept, post.visual.visualStyle)}
            />
            <Button
              type="button" size="sm" variant="outline" className="gap-1.5 h-8"
              onClick={() => fileInputRef.current?.click()} disabled={ai.loading}
            >
              <Upload className="h-3.5 w-3.5" /> Upload photo
            </Button>
            <Button
              type="button" size="sm" variant="outline" className="gap-1.5 h-8 col-span-2"
              onClick={downloadPost} disabled={downloading || ai.loading}
            >
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />}
              Download post
            </Button>
          </CreativeActions>
          <RemoveWatermarkRow className="mt-2" />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUploadPhoto} />
        </div>
        <div aria-hidden className="fixed pointer-events-none" style={{ left: -10000, top: 0, width: CREATIVE_DESIGN_WIDTH }}>
          <div ref={captureRef}>
            <Frame {...frameProps} />
          </div>
        </div>

        {ai.url && (
          <PhotoAdjustPanel
            offsetX={imageOffsetX} offsetY={imageOffsetY} zoom={imageZoom}
            onOffsetXChange={setImageOffsetX} onOffsetYChange={setImageOffsetY} onZoomChange={setImageZoom}
            hasCustom={hasCustomPhotoAdjust} onReset={resetPhotoAdjust}
          />
        )}

        <div className="mx-auto w-full max-w-md space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Design</Label>
          <FramePicker value={frameId} onChange={onFrameChange} frameProps={frameProps} />
        </div>

        <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-3 space-y-2">
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

        <SectionBlock title="Headline" body={post.headline} />
        <SectionBlock title="Supporting Line" body={post.subline} />
        <SectionBlock title="Call To Action" body={post.cta} />
        <SectionBlock title="Caption" body={post.caption} />
        <SectionBlock title="Hashtags" body={post.hashtags.join(" ")} />
        <div className="pt-3 border-t border-border/60">
          <ShareButtons
            text={[post.caption, post.cta, post.hashtags.join(" ")].filter(Boolean).join("\n\n")}
            imageUrl={ai.url}
            captureImage={captureTemplatePng}
          />
        </div>
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
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--teal)]">{title}</p>
        <button type="button" onClick={() => copyText(body, `${title} copied`)}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{body}</p>
    </div>
  );
}

function VisualCanvas({ visual, headline, brand, specialty, imageUrl, imageLoading }: {
  visual: Visual; headline: string; brand?: ReturnType<typeof useBrandKit>[0];
  specialty?: string; imageUrl?: string | null; imageLoading?: boolean;
}) {
  const c1 = visual.colors[0] || brand?.primaryColor || "#0E7C7B";
  const c2 = visual.colors[1] || brand?.secondaryColor || "#1f4e79";
  const photo = brand?.coverPhoto || brand?.clinicPhoto || brand?.doctorPhoto;
  const PrimaryIcon = specialty ? primaryIconFor(specialty) : ImageIcon;

  if (imageUrl) {
    return (
      <div className="relative aspect-square w-full overflow-hidden text-white">
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/0" />
        <div className="absolute inset-x-0 bottom-0 p-4 z-10">
          <p className="text-xl font-bold leading-tight drop-shadow-md">{headline}</p>
          {(brand?.clinicName || brand?.phone) && (
            <div className="mt-3 pt-2.5 border-t border-white/30 flex items-center gap-3 flex-wrap">
              {brand?.logo && <img src={brand.logo} alt="" className="h-6 w-6 rounded-md object-cover bg-white/80 shrink-0" />}
              {brand?.clinicName && <span className="text-[11px] font-semibold tracking-wide truncate">{brand.clinicName}</span>}
              {brand?.phone && <span className="ml-auto text-[11px] opacity-90 whitespace-nowrap flex items-center gap-1"><Phone className="h-3 w-3" /> {brand.phone}</span>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
      {imageLoading && <ImageLoadingOverlay />}
      {photo && (
        <>
          <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c1}cc 0%, ${c2}e6 100%)`, mixBlendMode: "multiply" }} />
        </>
      )}
      {specialty && <ContextualBackground specialty={specialty} opacity={0.08} color="#ffffff" />}
      <div className="absolute inset-0 flex flex-col p-5 pb-0">
        <div className="flex-1 grid place-items-center text-center">
          <div className="relative z-10">
            <div className="h-12 w-12 rounded-full mx-auto mb-4 grid place-items-center backdrop-blur" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
              <PrimaryIcon className="h-5 w-5" />
            </div>
            <p className="text-xl font-bold leading-tight">{headline}</p>
            <p className="text-[11px] mt-3 opacity-80 italic line-clamp-2">{visual.concept}</p>
          </div>
        </div>
      </div>
      {(brand?.clinicName || brand?.phone) && (
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          {brand?.logo && <img src={brand.logo} alt="" className="h-6 w-6 rounded-md object-cover bg-white/80 shrink-0" />}
          {brand?.clinicName && <span className="text-[11px] font-semibold tracking-wide truncate flex-1">{brand.clinicName}</span>}
          {brand?.phone && <span className="text-[11px] opacity-90 whitespace-nowrap flex items-center gap-1 shrink-0"><Phone className="h-3 w-3" /> {brand.phone}</span>}
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Suggested Color Palette</p>
            <div className="flex flex-wrap gap-2">
              {visual.colors.map((c) => (
                <div key={c} className="flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-3 py-1">
                  <span className="h-5 w-5 rounded-full border border-border" style={{ background: c }} />
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
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
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