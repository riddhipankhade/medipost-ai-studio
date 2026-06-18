import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Trash2, Building2, User, Image as ImageIcon, Save, Palette, X } from "lucide-react";
import { useBrandKit, fileToDataUrl, defaultBrandKit, type BrandKit } from "@/lib/brand-kit";
import { specialties } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/brand")({
  head: () => ({ meta: [{ title: "Clinic Brand Kit — Medipost AI" }] }),
  component: BrandKitPage,
});

function BrandKitPage() {
  const [kit, save] = useBrandKit();
  const [draft, setDraft] = useState<BrandKit>(kit);

  // keep draft in sync if storage changes underneath
  if (kit !== draft && draft.clinicName === defaultBrandKit.clinicName && kit.clinicName !== defaultBrandKit.clinicName) {
    setDraft(kit);
  }

  const update = <K extends keyof BrandKit>(k: K, v: BrandKit[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  function onSave() {
    save(draft);
    toast.success("Brand kit saved. It will be applied to all generated content.");
  }

  function reset() {
    setDraft(defaultBrandKit);
    save(defaultBrandKit);
    toast.message("Brand kit reset to defaults");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clinic Brand Kit</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Upload your logo, photos, and brand colors once — Medipost will apply them
            automatically to every generated post, carousel, story and greeting.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} className="gap-2">
            <Trash2 className="h-4 w-4" /> Reset
          </Button>
          <Button onClick={onSave} className="gap-2">
            <Save className="h-4 w-4" /> Save Brand Kit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[color:var(--teal)]" /> Clinic Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Field label="Clinic Name">
                <Input value={draft.clinicName} onChange={(e) => update("clinicName", e.target.value)} />
              </Field>
              <Field label="Doctor Name">
                <Input value={draft.doctorName} onChange={(e) => update("doctorName", e.target.value)} />
              </Field>
              <Field label="Specialty">
                <Select value={draft.specialty} onValueChange={(v) => update("specialty", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Contact Number">
                <Input value={draft.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
              <Field label="Website">
                <Input value={draft.website} onChange={(e) => update("website", e.target.value)} placeholder="example.clinic" />
              </Field>
              <Field label="Address">
                <Textarea
                  rows={2}
                  value={draft.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-[color:var(--teal)]" /> Brand Colors
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <ColorField
                label="Primary Color"
                value={draft.primaryColor}
                onChange={(v) => update("primaryColor", v)}
              />
              <ColorField
                label="Secondary Color"
                value={draft.secondaryColor}
                onChange={(v) => update("secondaryColor", v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[color:var(--teal)]" /> Brand Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <UploadField
                label="Clinic Logo"
                value={draft.logo}
                onChange={(v) => update("logo", v)}
                aspect="square"
              />
              <UploadField
                label="Doctor Profile Photo"
                value={draft.doctorPhoto}
                onChange={(v) => update("doctorPhoto", v)}
                aspect="square"
              />
              <UploadField
                label="Clinic Photo"
                value={draft.clinicPhoto}
                onChange={(v) => update("clinicPhoto", v)}
                aspect="video"
              />
              <UploadField
                label="Cover Image"
                value={draft.coverPhoto}
                onChange={(v) => update("coverPhoto", v)}
                aspect="video"
              />
              <UploadField
                label="Team Photo"
                value={draft.teamPhoto}
                onChange={(v) => update("teamPhoto", v)}
                aspect="video"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: live preview */}
        <div className="space-y-4">
          <Card className="lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-[color:var(--teal)]" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl overflow-hidden border border-border shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${draft.primaryColor}, ${draft.secondaryColor})`,
                }}
              >
                <div className="p-5 text-white">
                  <div className="flex items-center gap-3">
                    {draft.logo ? (
                      <img src={draft.logo} alt="Logo" className="h-12 w-12 rounded-lg object-cover bg-white" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-white/20 grid place-items-center text-xs font-semibold">
                        LOGO
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{draft.clinicName || "Your Clinic"}</p>
                      <p className="text-xs opacity-80 truncate">{draft.doctorName} · {draft.specialty}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-md bg-white/15 px-2 py-1.5 truncate">📞 {draft.phone || "—"}</div>
                    <div className="rounded-md bg-white/15 px-2 py-1.5 truncate">🌐 {draft.website || "—"}</div>
                  </div>
                </div>
                {draft.clinicPhoto || draft.coverPhoto ? (
                  <img
                    src={draft.clinicPhoto || draft.coverPhoto}
                    alt="Clinic"
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="h-32 bg-black/20 grid place-items-center text-white/70 text-xs">
                    Clinic photo will appear here
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                These details + colors are auto-applied to all generated content (header, footer, accents).
              </p>
            </CardContent>
          </Card>
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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 rounded border border-border cursor-pointer bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </div>
  );
}

function UploadField({
  label,
  value,
  onChange,
  aspect,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  aspect: "square" | "video";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Image too large (max 2MB for the prototype)");
      return;
    }
    const url = await fileToDataUrl(f);
    onChange(url);
  }
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className={`relative rounded-lg border border-dashed border-border bg-accent/30 overflow-hidden ${
          aspect === "square" ? "aspect-square max-w-[180px]" : "aspect-video"
        }`}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="absolute top-1.5 right-1.5 h-7 w-7 grid place-items-center rounded-full bg-background/90 hover:bg-background border border-border shadow"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 grid place-items-center text-muted-foreground hover:text-foreground"
          >
            <div className="flex flex-col items-center gap-1.5">
              <Upload className="h-5 w-5" />
              <span className="text-xs">Click to upload</span>
            </div>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
    </div>
  );
}