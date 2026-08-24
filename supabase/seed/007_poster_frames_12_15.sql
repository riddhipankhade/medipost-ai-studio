-- Seed: Poster catalog rows for the next 4 frames (12-15), continuing after
-- 006_benefit_grid_frame.sql. Same idempotent ON CONFLICT (id) pattern and
-- same reasoning as 002/006: category='clinic-promo' (poster-style local
-- healthcare ad), specialty_tags='{}' (generic layout, any specialty),
-- premium=true (matches the existing kind === "template" && !isPro gate).
INSERT INTO public.templates
  (id, render_key, name, description, category, specialty_tags, format, archetype, premium, status, sort_order)
VALUES
  ('00000000-0000-4000-8000-000000000032', 'before-after-focus', 'Before / After Focus', 'Problem panel + photo solution panel', 'clinic-promo', '{}', 'template', 'split-contrast', true, 'published', 11),
  ('00000000-0000-4000-8000-000000000033', 'treatment-journey',  'Treatment Journey',     'Full photo + diagonal care waypoints', 'clinic-promo', '{}', 'template', 'photo-journey', true, 'published', 12),
  ('00000000-0000-4000-8000-000000000034', 'anatomy-callout',    'Anatomy Callout',       'Photo medallion + leader-line callouts', 'clinic-promo', '{}', 'template', 'callout-medallion', true, 'published', 13),
  ('00000000-0000-4000-8000-000000000035', 'doctor-authority',   'Doctor Authority',      'Clinician photo + credential badge', 'clinic-promo', '{}', 'template', 'portrait-authority', true, 'published', 14)
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
