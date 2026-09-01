-- Seed: Post catalog rows for the "revised remaining Post set" (7 templates),
-- continuing after 005_shape_library_poc.sql's polaroid-stack assignment.
--
-- Rows 16-18 were still unbuilt Phase-A placeholders (render_key = NULL,
-- category-bound names like "Warning Signs Alert") -- reused here via UPDATE,
-- same idempotent-by-fixed-id pattern as 004/005, now with name/description/
-- category refreshed to match the actual shape-first design shipped (these
-- are no longer category-bound, same as polaroid-stack). Rows 36-39 are new
-- inserts, continuing the fixed-UUID convention after Poster's last id (35).
--
-- category = 'clinic-promo' for all 7, matching the same reasoning
-- 002/006/007 already used for Poster: these are generic, specialty-neutral
-- compositions, not tied to one content category. specialty_tags = '{}'.
-- premium = true, matching the existing kind === "template" && !isPro gate.

UPDATE public.templates SET
  render_key = 'editorial-column', name = 'Editorial Column',
  description = 'Fixed text column + hard-edged photo strip',
  category = 'clinic-promo', specialty_tags = '{}', sort_order = 15, updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000016';

UPDATE public.templates SET
  render_key = 'blueprint-grid', name = 'Blueprint Grid',
  description = 'Technical dot-grid with leader-line annotations',
  category = 'clinic-promo', specialty_tags = '{}', sort_order = 16, updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000017';

UPDATE public.templates SET
  render_key = 'torn-ticket', name = 'Torn Ticket',
  description = 'Admission-ticket silhouette with a stub CTA',
  category = 'clinic-promo', specialty_tags = '{}', sort_order = 17, updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000018';

INSERT INTO public.templates
  (id, render_key, name, description, category, specialty_tags, format, archetype, premium, status, sort_order)
VALUES
  ('00000000-0000-4000-8000-000000000036', 'certified-seal', 'Certified Seal',  'Certificate border + credential badge', 'clinic-promo', '{}', 'single', 'document-seal', true, 'published', 18),
  ('00000000-0000-4000-8000-000000000037', 'dossier-tab',    'Dossier Tab',     'Clinical file tab + ink-stamp CTA',      'clinic-promo', '{}', 'single', 'paperwork-tab', true, 'published', 19),
  ('00000000-0000-4000-8000-000000000038', 'layered-frame',  'Layered Frame',   'Three offset planes, color + photo + text', 'clinic-promo', '{}', 'single', 'depth-stack',  true, 'published', 20),
  ('00000000-0000-4000-8000-000000000039', 'swiss-grid-bold','Swiss Grid Bold', 'Bold rule, extreme type scale, no photo', 'clinic-promo', '{}', 'single', 'typographic',   true, 'published', 21)
ON CONFLICT (id) DO UPDATE SET
  render_key     = EXCLUDED.render_key,
  name           = EXCLUDED.name,
  description    = EXCLUDED.description,
  category       = EXCLUDED.category,
  specialty_tags = EXCLUDED.specialty_tags,
  format         = EXCLUDED.format,
  archetype      = EXCLUDED.archetype,
  premium        = EXCLUDED.premium,
  status         = EXCLUDED.status,
  sort_order     = EXCLUDED.sort_order,
  updated_at     = now();
