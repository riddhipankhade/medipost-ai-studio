-- Migration 007: Supabase Storage buckets and policies
-- Requires Supabase Storage extension (enabled by default).

-- Brand assets: logos, doctor photos, clinic photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  false,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- AI-generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-content',
  'generated-content',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- brand-assets RLS policies
-- Path convention: logos/{user_id}/*, doctor-photos/{user_id}/*, clinic-photos/{user_id}/*
-- ----------------------------------------------------------------

CREATE POLICY "brand_assets_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'brand-assets'
    AND auth.uid()::text = (string_to_array(name, '/'))[2]
  );

CREATE POLICY "brand_assets_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND auth.uid()::text = (string_to_array(name, '/'))[2]
  );

CREATE POLICY "brand_assets_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'brand-assets'
    AND auth.uid()::text = (string_to_array(name, '/'))[2]
  );

CREATE POLICY "brand_assets_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'brand-assets'
    AND auth.uid()::text = (string_to_array(name, '/'))[2]
  );

-- ----------------------------------------------------------------
-- generated-content RLS policies
-- Path convention: {user_id}/{generation_id}.ext
-- ----------------------------------------------------------------

CREATE POLICY "generated_content_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'generated-content'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "generated_content_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-content'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "generated_content_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'generated-content'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Admins can read both buckets for support/moderation
CREATE POLICY "brand_assets_admin_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'brand-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "generated_content_admin_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'generated-content'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- COMMENT ON COLUMN storage.buckets.file_size_limit IS 'Enforced by Supabase Storage middleware before the object reaches the DB.';
