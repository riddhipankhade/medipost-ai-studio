-- Migration 009: content_generations.customization
-- Frozen Studio customization knobs (theme/color/layout/frame choices), so
-- Content History can reproduce exactly what the user finalized instead of
-- recomputing defaults at view time. See src/lib/post-customization.ts for
-- the validated shape (PostCustomizationSchema).

ALTER TABLE public.content_generations
  ADD COLUMN IF NOT EXISTS customization jsonb;

COMMENT ON COLUMN public.content_generations.customization IS
  'Studio customization knobs (theme/color/layout/frame choices), validated against PostCustomizationSchema in src/lib/post-customization.ts. Null on older rows -> caller falls back to computed defaults. Brand-kit fields (contact info, logo, photos) are deliberately NOT included here; those stay live from brand_kits.';
