import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SpecialtySelect } from "@/components/specialty-select";
import { toast } from "sonner";
import {
  Upload, Trash2, Building2, User, Image as ImageIcon,
  Save, Palette, X, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/brand")({
  head: () => ({ meta: [{ title: "Clinic Brand Kit — Medipost AI" }] }),
  component: BrandKitPage,
});

// ── Types ────────────────────────────────────────────────────────────────────

type Draft = {
  clinic_name:      string;
  doctor_name:      string;
  specialty:        string;
  phone:            string;
  website:          string;
  address:          string;
  primaryColor:     string;   // maps to brand_colors.primary
  secondaryColor:   string;   // maps to brand_colors.secondary
  logo_url:         string;
  doctor_photo_url: string;
  clinic_photo_url: string;
};

const DEFAULT: Draft = {
  clinic_name:      "",
  doctor_name:      "",
  specialty:        "",
  phone:            "",
  website:          "",
  address:          "",
  primaryColor:     "#0d9488",
  secondaryColor:   "#134e4a",
  logo_url:         "",
  doctor_photo_url: "",
  clinic_photo_url: "",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// ── Component ────────────────────────────────────────────────────────────────

function BrandKitPage() {
  const [draft,   setDraft]   = useState<Draft>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // ── Load from Supabase ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("brand_kits")
        .select(
          "clinic_name, doctor_name, specialty, phone, website, address, " +
          "logo_url, doctor_photo_url, clinic_photo_url, brand_colors"
        )
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no row found (handle_new_user may not have run yet)
        toast.error("Could not load brand kit: " + error.message);
      }

      type BrandKitRow = {
        clinic_name: string | null; doctor_name: string | null; specialty: string | null;
        phone: string | null; website: string | null; address: string | null;
        logo_url: string | null; doctor_photo_url: string | null; clinic_photo_url: string | null;
        brand_colors: Record<string, string> | null;
      };

      if (data) {
        const row = data as unknown as BrandKitRow;
        const colors = (row.brand_colors ?? {}) as Record<string, string>;
        setDraft({
          clinic_name:      row.clinic_name      ?? "",
          doctor_name:      row.doctor_name      ?? "",
          specialty:        row.specialty         ?? "",
          phone:            row.phone             ?? "",
          website:          row.website           ?? "",
          address:          row.address           ?? "",
          primaryColor:     colors.primary         ?? DEFAULT.primaryColor,
          secondaryColor:   colors.secondary       ?? DEFAULT.secondaryColor,
          logo_url:         row.logo_url          ?? "",
          doctor_photo_url: row.doctor_photo_url  ?? "",
          clinic_photo_url: row.clinic_photo_url  ?? "",
        });
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Save to Supabase ──────────────────────────────────────────────────────
  async function onSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not signed in."); return; }

    setSaving(true);

    const { error } = await supabase
      .from("brand_kits")
      .upsert(
        {
          user_id:          user.id,
          clinic_name:      draft.clinic_name,
          doctor_name:      draft.doctor_name,
          specialty:        draft.specialty,
          phone:            draft.phone,
          website:          draft.website,
          address:          draft.address,
          logo_url:         draft.logo_url      || null,
          doctor_photo_url: draft.doctor_photo_url || null,
          clinic_photo_url: draft.clinic_photo_url || null,
          brand_colors: {
            primary:   draft.primaryColor,
            secondary: draft.secondaryColor,
            accent:    draft.secondaryColor,   // mirror secondary until accent picker added
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    setSaving(false);

    if (error) {
      toast.error("Save failed: " + error.message);
    } else {
      toast.success("Brand kit saved — applied to all generated content.");
    }
  }

  async function reset() {
    setDraft(DEFAULT);
    toast.message("Reset to defaults — press Save to persist.");
  }

  const up = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading brand kit…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clinic Brand Kit</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Fill in your clinic details and brand colors once — Medipost applies them
            automatically to every generated post, carousel, story, and greeting.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} className="gap-2">
            <Trash2 className="h-4 w-4" /> Reset
          </Button>
          <Button onClick={onSave} disabled={saving} className="gap-2">
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Save className="h-4 w-4" />}
            Save Brand Kit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: editor */}
        <div className="lg:col-span-2 space-y-6">

          {/* Clinic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[color:var(--teal)]" /> Clinic Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Field label="Clinic Name">
                <Input
                  value={draft.clinic_name}
                  onChange={(e) => up("clinic_name", e.target.value)}
                />
              </Field>
              <Field label="Doctor Name">
                <Input
                  value={draft.doctor_name}
                  onChange={(e) => up("doctor_name", e.target.value)}
                />
              </Field>
              <Field label="Specialty">
                <SpecialtySelect
                  value={draft.specialty}
                  onChange={(v) => up("specialty", v)}
                  placeholder="Select specialty"
                />
              </Field>
              <Field label="Contact Number">
                <Input
                  value={draft.phone}
                  onChange={(e) => up("phone", e.target.value)}
                />
              </Field>
              <Field label="Website">
                <Input
                  value={draft.website}
                  onChange={(e) => up("website", e.target.value)}
                  placeholder="example.clinic"
                />
              </Field>
              <Field label="Address">
                <Textarea
                  rows={2}
                  value={draft.address}
                  onChange={(e) => up("address", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Brand Colors */}
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
                onChange={(v) => up("primaryColor", v)}
              />
              <ColorField
                label="Secondary Color"
                value={draft.secondaryColor}
                onChange={(v) => up("secondaryColor", v)}
              />
            </CardContent>
          </Card>

          {/* Brand Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[color:var(--teal)]" /> Brand Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <UploadField
                label="Clinic Logo"
                value={draft.logo_url}
                onChange={(v) => up("logo_url", v ?? "")}
                aspect="square"
              />
              <UploadField
                label="Doctor Profile Photo"
                value={draft.doctor_photo_url}
                onChange={(v) => up("doctor_photo_url", v ?? "")}
                aspect="square"
              />
              <UploadField
                label="Clinic Photo"
                value={draft.clinic_photo_url}
                onChange={(v) => up("clinic_photo_url", v ?? "")}
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
                    {draft.logo_url ? (
                      <img
                        src={draft.logo_url}
                        alt="Logo"
                        className="h-12 w-12 rounded-lg object-cover bg-white"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-white/20 grid place-items-center text-xs font-semibold">
                        LOGO
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {draft.clinic_name || "Your Clinic"}
                      </p>
                      <p className="text-xs opacity-80 truncate">
                        {draft.doctor_name} · {draft.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-md bg-white/15 px-2 py-1.5 truncate">
                      📞 {draft.phone || "—"}
                    </div>
                    <div className="rounded-md bg-white/15 px-2 py-1.5 truncate">
                      🌐 {draft.website || "—"}
                    </div>
                  </div>
                </div>
                {draft.clinic_photo_url ? (
                  <img
                    src={draft.clinic_photo_url}
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
                Colors and details are auto-applied to all generated content.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
        />
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
  label:    string;
  value?:   string;
  onChange: (v: string | undefined) => void;
  aspect:   "square" | "video";
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Image too large — max 2 MB");
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
            <img
              src={value}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
            />
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPick}
      />
    </div>
  );
}