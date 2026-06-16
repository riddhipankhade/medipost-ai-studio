import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, RefreshCw, Loader2, Check, Wand2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { specialties, contentTypes, tones, audiences } from "@/lib/mock-data";
import {
  generateContent,
  type GenerateInput,
  type GenerateOutput,
  type Variation,
} from "@/lib/api/generate.functions";

export const Route = createFileRoute("/_app/generate")({
  head: () => ({ meta: [{ title: "AI Generator — Medipost AI" }] }),
  component: Generate,
});

const PROGRESS_STAGES = [
  "Analyzing your brief…",
  "Researching medical context…",
  "Drafting 3 variations…",
  "Polishing for your audience…",
];

function Generate() {
  const callGenerate = useServerFn(generateContent);

  const [form, setForm] = useState<GenerateInput>({
    specialty: "Dentist",
    type: "Instagram Post",
    topic: "Daily oral hygiene habits",
    tone: "Friendly",
    audience: "Patients",
  });

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<GenerateOutput | null>(null);
  const [regenIdx, setRegenIdx] = useState<number | null>(null);

  const update = <K extends keyof GenerateInput>(k: K, v: GenerateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
      const out = await callGenerate({ data: form });
      setResult(out);
      toast.success("3 variations ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      clearInterval(ticker);
      setLoading(false);
    }
  }

  async function regenerateOne(idx: number) {
    setRegenIdx(idx);
    try {
      const out = await callGenerate({ data: form });
      const pick = out.variations[idx] ?? out.variations[0];
      setResult((prev) =>
        prev
          ? {
              ...prev,
              variations: prev.variations.map((v, i) =>
                i === idx ? { ...pick, label: v.label } : v,
              ),
            }
          : out,
      );
      toast.success(`Regenerated ${result?.variations[idx]?.label ?? "variation"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setRegenIdx(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">AI Content Generator</h1>
        <p className="text-muted-foreground mt-1">
          Powered by Gemini. Generate 3 patient-ready variations in seconds.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Brief */}
        <Card className="lg:col-span-2 border-border/60 h-fit lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[color:var(--teal)]" /> Brief
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

            <Field label="Content Type">
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Topic">
              <Input
                value={form.topic}
                onChange={(e) => update("topic", e.target.value)}
                placeholder="e.g. Root canal treatment, Diabetes awareness"
              />
            </Field>

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
              {loading ? "Generating…" : "Generate 3 Variations"}
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
                <p className="font-medium text-foreground">Your 3 AI-generated variations will appear here</p>
                <p className="text-sm mt-1">Fill in the brief and hit Generate.</p>
              </CardContent>
            </Card>
          )}

          {!loading && result && (
            <>
              <div className="grid gap-4">
                {result.variations.map((v, i) => (
                  <VariationCard
                    key={i}
                    variation={v}
                    regenerating={regenIdx === i}
                    onRegenerate={() => regenerateOne(i)}
                  />
                ))}
              </div>
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
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-accent/30 p-4 space-y-2 animate-pulse">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-5/6 bg-muted rounded" />
              <div className="h-3 w-4/6 bg-muted rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VariationCard({
  variation,
  regenerating,
  onRegenerate,
}: {
  variation: Variation;
  regenerating: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyAll() {
    navigator.clipboard.writeText(variation.fullText);
    setCopied(true);
    toast.success(`${variation.label} copied`);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2 bg-gradient-to-r from-[color:var(--teal)]/5 to-primary/5">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--teal)] text-white text-xs font-semibold">
            {variation.label.replace("Option ", "")}
          </span>
          {variation.label}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={copyAll}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {regenerating ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-1/2 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-5/6 bg-muted rounded" />
            <div className="h-3 w-2/3 bg-muted rounded" />
          </div>
        ) : (
          <div className="space-y-4">
            {variation.sections.map((s, i) => (
              <div key={i}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--teal)] mb-1.5">
                  {s.heading}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VisualConceptCard({ visual }: { visual: GenerateOutput["visual"] }) {
  if (!visual?.concept) return null;
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-[color:var(--teal)]" /> Suggested Visual Concept
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Concept
          </p>
          <p className="text-sm leading-relaxed">{visual.concept}</p>
        </div>
        {visual.colors.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Suggested Colors
            </p>
            <div className="flex flex-wrap gap-2">
              {visual.colors.map((c) => (
                <div key={c} className="flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-3 py-1">
                  <span className="h-5 w-5 rounded-full border border-border" style={{ background: c }} />
                  <span className="text-xs font-mono">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {visual.style && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Visual Style
            </p>
            <p className="text-sm leading-relaxed">{visual.style}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}