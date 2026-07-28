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
import { writeBrandKit, readBrandKit, resetHydrationCache } from "@/lib/brand-kit";

export const Route = createFileRoute("/_app/brand")({
  head: () => ({ meta: [{ title: "Clinic Brand Kit — Medipost AI" }] }),
  component: BrandKitPage,
});

// ── Types ──────────────────────────────────────────────────────────────────
type Draft = {
  clinic_name:      string;
  doctor_name:      string;
  specialty:        string;
  countryCode:      string;
  phone:            string;
  website:          string;
  address:          string;
  primaryColor:     string;
  secondaryColor:   string;
  logo_url:         string;
  doctor_photo_url: string;
  clinic_photo_url: string;
};

const DEFAULT: Draft = {
  clinic_name:      "",
  doctor_name:      "",
  specialty:        "",
  countryCode:      "+91",
  phone:            "",
  website:          "",
  address:          "",
  primaryColor:     "#0d9488",
  secondaryColor:   "#134e4a",
  logo_url:         "",
  doctor_photo_url: "",
  clinic_photo_url: "",
};

const COUNTRY_CODES = [
  { code: "+91",  label: "🇮🇳 +91"  },
  { code: "+1",   label: "🇺🇸 +1"   },
  { code: "+44",  label: "🇬🇧 +44"  },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+61",  label: "🇦🇺 +61"  },
  { code: "+65",  label: "🇸🇬 +65"  },
  { code: "+60",  label: "🇲🇾 +60"  },
  { code: "+92",  label: "🇵🇰 +92"  },
];

// Valid digit lengths per country code
const PHONE_LENGTHS: Record<string, number[]> = {
  "+91":  [10],
  "+1":   [10],
  "+44":  [10],
  "+971": [9],
  "+61":  [9],
  "+65":  [8],
  "+60":  [9, 10],
  "+92":  [10],
};

function getMaxLength(countryCode: string): number {
  const lengths = PHONE_LENGTHS[countryCode] ?? [10];
  return Math.max(...lengths);
}

function isValidPhone(countryCode: string, phone: string): boolean {
  if (!phone) return true; // empty is allowed
  const lengths = PHONE_LENGTHS[countryCode] ?? [10];
  return lengths.includes(phone.length);
}

function phoneHint(countryCode: string): string {
  const lengths = PHONE_LENGTHS[countryCode] ?? [10];
  return lengths.join(" or ") + "-digit number";
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function parsePhone(raw: string): { countryCode: string; phone: string } {
  if (!raw) return { countryCode: "+91", phone: "" };
  const match = raw.match(/^(\+\d{1,4})(.*)/);
  if (match) return { countryCode: match[1], phone: match[2].replace(/\D/g, "") };
  return { countryCode: "+91", phone: raw.replace(/\D/g, "") };
}

// ── Component ──────────────────────────────────────────────────────────────
function BrandKitPage() {
  const [draft,   setDraft]   = useState<Draft>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // ── Load from Supabase ──────────────────────────────────────────────────
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
        const { countryCode, phone } = parsePhone(row.phone ?? "");
        setDraft({
          clinic_name:      row.clinic_name      ?? "",
          doctor_name:      row.doctor_name      ?? "",
          specialty:        row.specialty         ?? "",
          countryCode,
          phone,
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

  // ── Save to Supabase ────────────────────────────────────────────────────
  async function onSave() {
    if (draft.phone && !isValidPhone(draft.countryCode, draft.phone)) {
      const hint = phoneHint(draft.countryCode);
      toast.error(`Contact number must be a ${hint} for ${draft.countryCode}.`);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not signed in."); return; }
    setSaving(true);

    const fullPhone = draft.phone ? `${draft.countryCode}${draft.phone}` : "";

    const { error } = await supabase
      .from("brand_kits")
      .upsert(
        {
          user_id:          user.id,
          clinic_name:      draft.clinic_name,
          doctor_name:      draft.doctor_name,
          specialty:        draft.specialty,
          phone:            fullPhone,
          website:          draft.website,
          address:          draft.address,
          logo_url:         draft.logo_url      || null,
          doctor_photo_url: draft.doctor_photo_url || null,
          clinic_photo_url: draft.clinic_photo_url || null,
          brand_colors: {
            primary:   draft.primaryColor,
            secondary: draft.secondaryColor,
            accent:    draft.secondaryColor,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    setSaving(false);
    if (error) {
      toast.error("Save failed: " + error.message);
    } else {
      resetHydrationCache();
      writeBrandKit(user.id, {
        ...readBrandKit(user.id),
        clinicName:     draft.clinic_name,
        doctorName:     draft.doctor_name,
        specialty:      draft.specialty,
        phone:          fullPhone,
        website:        draft.website,
        address:        draft.address,
        primaryColor:   draft.primaryColor,
        secondaryColor: draft.secondaryColor,
        logo:           draft.logo_url         || undefined,
        doctorPhoto:    draft.doctor_photo_url  || undefined,
        clinicPhoto:    draft.clinic_photo_url  || undefined,
      });
      toast.success("Brand kit saved — applied to all generated content.");
    }
  }

  async function reset() {
    setDraft(DEFAULT);
    toast.message("Reset to defaults — press Save to persist.");
  }

  const up = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  // ── Render ──────────────────────────────────────────────────────────────
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
                <Input value={draft.clinic_name} onChange={(e) => up("clinic_name", e.target.value)} />
              </Field>
              <Field label="Doctor Name">
                <Input value={draft.doctor_name} onChange={(e) => up("doctor_name", e.target.value)} />
              </Field>
              <Field label="Specialty">
                <SpecialtySelect value={draft.specialty} onChange={(v) => up("specialty", v)} placeholder="Select specialty" />
              </Field>
              <Field label="Contact Number">
                <div className="flex gap-2">
                  <select
                    value={draft.countryCode}
                    onChange={(e) => up("countryCode", e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm shrink-0"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <Input
                    value={draft.phone}
                    onChange={(e) => {
                      const max = getMaxLength(draft.countryCode);
                      const val = e.target.value.replace(/\D/g, "").slice(0, max);
                      up("phone", val);
                    }}
                    placeholder={phoneHint(draft.countryCode)}
                    inputMode="numeric"
                    maxLength={getMaxLength(draft.countryCode)}
                    className={draft.phone.length > 0 && !isValidPhone(draft.countryCode, draft.phone) ? "border-destructive" : ""}
                  />
                </div>
                {draft.phone.length > 0 && !isValidPhone(draft.countryCode, draft.phone) && (
                  <p className="text-xs text-destructive mt-1">
                    {draft.phone.length}/{phoneHint(draft.countryCode)}
                  </p>
                )}
              </Field>
              <Field label="Website">
                <Input value={draft.website} onChange={(e) => up("website", e.target.value)} placeholder="example.clinic" />
              </Field>
              <Field label="Address">
                <Textarea rows={2} value={draft.address} onChange={(e) => up("address", e.target.value)} />
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
              <ColorField label="Primary Color"   value={draft.primaryColor}   onChange={(v) => up("primaryColor", v)} />
              <ColorField label="Secondary Color" value={draft.secondaryColor} onChange={(v) => up("secondaryColor", v)} />
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
              <UploadField label="Clinic Logo"           value={draft.logo_url}         onChange={(v) => up("logo_url", v ?? "")}         aspect="square" />
              <UploadField label="Doctor Profile Photo"  value={draft.doctor_photo_url} onChange={(v) => up("doctor_photo_url", v ?? "")} aspect="square" />
              <UploadField label="Clinic Photo"          value={draft.clinic_photo_url} onChange={(v) => up("clinic_photo_url", v ?? "")} aspect="video"  />
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
                style={{ background: `linear-gradient(135deg, ${draft.primaryColor}, ${draft.secondaryColor})` }}
              >
                <div className="p-5 text-white">
                  <div className="flex items-center gap-3">
                    {draft.logo_url ? (
                      <img src={draft.logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-cover bg-white" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-white/20 grid place-items-center text-xs font-semibold">LOGO</div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{draft.clinic_name || "Your Clinic"}</p>
                      <p className="text-xs opacity-80 truncate">{draft.doctor_name} · {draft.specialty}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-md bg-white/15 px-2 py-1.5 truncate">
                      📞 {draft.phone ? `${draft.countryCode} ${draft.phone}` : "—"}
                    </div>
                    <div className="rounded-md bg-white/15 px-2 py-1.5 truncate">🌐 {draft.website || "—"}</div>
                  </div>

                  {draft.doctor_photo_url && (
                    <div className="mt-4 flex items-center gap-3">
                      <img
                        src={draft.doctor_photo_url}
                        alt="Doctor"
                        className="h-14 w-14 rounded-full object-cover border-2 border-white/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{draft.doctor_name || "Doctor"}</p>
                        <p className="text-[11px] opacity-70 truncate">{draft.specialty}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Press <strong>Save Brand Kit</strong> to apply to all content.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-14 rounded border border-border cursor-pointer bg-transparent"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}

function UploadField({
  label, value, onChange, aspect,
}: {
  label: string; value: string; onChange: (v: string | null) => void; aspect: "square" | "video";
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    try {
      onChange(await fileToDataUrl(file));
    } catch {
      toast.error("Couldn't read the image file. Please try another.");
    }
  }

  const sz = aspect === "square" ? "h-24 w-24" : "h-20 w-36";

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {value ? (
        <div className="relative group w-fit">
          <img src={value} alt={label} className={`rounded-lg object-cover border border-border ${sz}`} />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 grid place-items-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-[color:var(--teal)] hover:text-foreground transition-colors ${sz}`}
        >
          <Upload className="h-4 w-4" />
          <span className="text-[10px]">Upload</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}