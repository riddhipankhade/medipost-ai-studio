-- Seed: Story catalog rows for the 4 remaining Story templates, continuing
-- after 005_shape_library_poc.sql's split-duotone assignment.
--
-- Rows 27-30 were still unbuilt placeholders (render_key = NULL, seeded by
-- 003_template_catalog_v2.sql) -- reused here via UPDATE, same
-- idempotent-by-fixed-id pattern as 004/005/008/009. name/description/
-- category/specialty_tags/sort_order are left exactly as 003 seeded them --
-- unlike the Post/Carousel "shape-first" batches (008/009), these 4 rows
-- keep their original content-category binding, since each bespoke design
-- (appointment-ticket, awareness-spotlight, screening-reminder,
-- first-visit-guide) was purpose-built to match its row's existing name/
-- category rather than becoming a generic, category-neutral shape. Row 26
-- (split-duotone) is untouched, as it already has its render_key.

UPDATE public.templates SET
  render_key = 'appointment-ticket', updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000027';

UPDATE public.templates SET
  render_key = 'awareness-spotlight', updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000028';

UPDATE public.templates SET
  render_key = 'screening-reminder', updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000029';

UPDATE public.templates SET
  render_key = 'first-visit-guide', updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000030';
