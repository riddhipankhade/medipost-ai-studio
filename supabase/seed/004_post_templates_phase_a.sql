-- Seed update: Phase A render_key backfill (Template Renderer Architecture,
-- Post templates #11-#14 only).
--
-- Idempotent UPDATE, not an insert -- these 4 rows already exist (created by
-- 003_template_catalog_v2.sql with render_key = NULL, back when Post/Carousel/
-- Story deliberately had no meaningful render_key). This backfills exactly
-- the 4 Phase-A rows with their now-built renderer's key
-- (src/components/post-templates.tsx). The remaining 4 Post rows (#15-#18)
-- and all 12 Carousel/Story rows are left untouched -- still NULL -- until
-- their own phases ship, so Template Studio correctly keeps them hidden
-- (see hasPreviewData() in src/routes/_app.templates.tsx) rather than
-- showing them through a generic fallback.

UPDATE public.templates SET render_key = 'myth-fact-editorial', updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000011';
UPDATE public.templates SET render_key = 'stat-editorial', updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000012';
UPDATE public.templates SET render_key = 'doctor-qa', updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000013';
UPDATE public.templates SET render_key = 'checklist-sidebar', updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000014';
