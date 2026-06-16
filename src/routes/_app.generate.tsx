import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { specialties, contentTypes, tones, generateMockContent } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/generate")({
  head: () => ({ meta: [{ title: "AI Generator — Medipost AI" }] }),
  component: Generate,
});

function Generate() {
  const [specialty, setSpecialty] = useState("Dentist");
  const [type, setType] = useState<string>("Instagram Post");
  const [topic, setTopic] = useState("Daily oral hygiene habits");
  const [tone, setTone] = useState("Friendly");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const generate = () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    setLoading(true);
    setOutput(null);
    setSaved(false);
    setTimeout(() => {
      setOutput(generateMockContent({ specialty, type, topic, tone }));
      setLoading(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">AI Content Generator</h1>
        <p className="text-muted-foreground mt-1">Create patient-ready content in seconds.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Managing diabetes during festivals" />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <div className="flex gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      tone === t
                        ? "bg-[color:var(--teal)] text-white border-[color:var(--teal)]"
                        : "bg-background border-border hover:bg-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={generate} disabled={loading} size="lg" className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              {loading ? "Generating…" : "Generate Content"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/60 min-h-[420px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Generated Content</CardTitle>
            {output && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied to clipboard"); }}>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => { setSaved(true); toast.success("Saved to your library"); }}>
                  {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-4/5" />
              </div>
            )}
            {!loading && output && (
              <div className="rounded-lg border border-border bg-accent/30 p-5">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{output}</pre>
              </div>
            )}
            {!loading && !output && (
              <div className="grid place-items-center text-center py-16 text-muted-foreground">
                <Sparkles className="h-8 w-8 mb-3 text-[color:var(--teal)]" />
                <p className="font-medium text-foreground">Your generated content will appear here</p>
                <p className="text-sm mt-1">Fill in the brief and hit Generate.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}