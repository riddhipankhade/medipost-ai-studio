-- Migration 004: brand_kits
-- One brand kit per user (UNIQUE on user_id).

CREATE TABLE public.brand_kits (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  clinic_name       text,
  doctor_name       text,
  specialty         text,
  tagline           text,
  tone              text        NOT NULL DEFAULT 'professional'
                                CHECK (tone IN ('professional', 'friendly', 'educational')),
  target_audience   text,
  logo_url          text,
  doctor_photo_url  text,
  clinic_photo_url  text,
  brand_colors      jsonb       NOT NULL DEFAULT '{"primary": "#0EA5E9", "secondary": "#64748B", "accent": "#F97316"}',
  social_handles    jsonb       NOT NULL DEFAULT '{"instagram": null, "facebook": null, "linkedin": null}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_brand_kits_user_id ON public.brand_kits (user_id);

-- RLS
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_kits_owner_all"
  ON public.brand_kits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "brand_kits_admin_read"
  ON public.brand_kits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE public.brand_kits IS 'Clinic/doctor brand identity used to personalize AI generation prompts.';
COMMENT ON COLUMN public.brand_kits.logo_url IS 'Supabase Storage path (not full URL). Use storage.createSignedUrl() at read time.';
COMMENT ON COLUMN public.brand_kits.doctor_photo_url IS 'Supabase Storage path. Same bucket: brand-assets/doctor-photos/{user_id}/';
COMMENT ON COLUMN public.brand_kits.clinic_photo_url IS 'Supabase Storage path. Same bucket: brand-assets/clinic-photos/{user_id}/';
COMMENT ON COLUMN public.brand_kits.brand_colors IS 'JSON: { primary: hex, secondary: hex, accent: hex }';
COMMENT ON COLUMN public.brand_kits.social_handles IS 'JSON: { instagram: string|null, facebook: string|null, linkedin: string|null }';
