-- Seed: 11th Poster catalog row for the new Benefit Grid frame
-- (src/components/template-frames.tsx). Safe to re-run — ON CONFLICT (id) DO
-- UPDATE, same idempotent pattern as 002_template_catalog.sql, which this
-- extends rather than edits (keeping 002 an untouched historical record of
-- the original 10). category/specialty_tags/premium follow 002's own
-- reasoning exactly: 'clinic-promo' because it's the same poster-style local
-- ad workflow, '{}' because the layout is generic across every specialty
-- (only its AI-generated feature labels vary), premium = true to match the
-- existing kind === "template" && !isPro generation gate.
INSERT INTO public.templates
  (id, render_key, name, description, category, specialty_tags, format, archetype, premium, status, sort_order)
VALUES
  ('00000000-0000-4000-8000-000000000031', 'benefit-grid', 'Benefit Grid', 'Photo circle + icon benefit row', 'clinic-promo', '{}', 'template', 'feature-grid', true, 'published', 10)
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
