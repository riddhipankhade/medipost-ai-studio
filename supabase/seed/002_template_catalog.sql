-- Seed: Template catalog (Step 2 — Template Studio foundation)
-- Safe to re-run — ON CONFLICT (id) DO UPDATE overwrites every mutable column.
-- Must run after migration 20240001000014_create_template_catalog.sql.
--
-- Seeds catalog rows for the 10 existing, production template-frame
-- components in src/components/template-frames.tsx. render_key maps each
-- row to its frame via the code-owned getTemplateFrame() lookup — see that
-- file's `templateFrames` array, which is the source of truth this seed is
-- transcribed from (id, name, tagline, and array order all match it exactly).
--
-- name/description are taken directly from each frame's existing `name`/
-- `tagline` fields, not invented copy. category is 'clinic-promo' for all
-- ten because that's what they actually are — poster-style service/condition
-- promos (see TEMPLATE_VISUAL_BLOCK in generate.functions.ts, which frames
-- this workflow kind explicitly as "poster-style local healthcare ads").
-- specialty_tags is '{}' (relevant to all specialties) for all ten: each
-- frame is a generic layout usable by any specialty — the sample copy shown
-- in the gallery (e.g. "Hernia Treatment Center") is illustrative only, not
-- a hard specialty binding, and the existing FramePicker already shows all
-- ten frames to every user regardless of their specialty. premium = true for
-- all ten, matching the existing kind === "template" && !isPro generation
-- gate (src/routes/_app.generate.tsx).
--
-- Fixed, hand-assigned UUIDs (not gen_random_uuid()) so this seed is
-- idempotent via ON CONFLICT (id) -- there is no other natural unique key on
-- `templates`: render_key is deliberately NOT unique, since the whole point
-- of the catalog is that multiple future rows may reuse one render_key with
-- different content/theme (see migration 014's comments).

INSERT INTO public.templates
  (id, render_key, name, description, category, specialty_tags, format, archetype, premium, status, sort_order)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'clinic-classic',  'Classic Promo',   'Photo left, bold service ribbon',           'clinic-promo', '{}', 'template', 'split-hero',    true, 'published', 0),
  ('00000000-0000-4000-8000-000000000002', 'photo-panel',     'Angled Panel',    'Full photo with angled text panel',          'clinic-promo', '{}', 'template', 'split-hero',    true, 'published', 1),
  ('00000000-0000-4000-8000-000000000003', 'hex-accent',      'Hex Badge',       'Colour card with hexagon photo',             'clinic-promo', '{}', 'template', 'shaped-frame',  true, 'published', 2),
  ('00000000-0000-4000-8000-000000000004', 'curve-card',      'Curve Card',      'Rounded panel + photo window',               'clinic-promo', '{}', 'template', 'shaped-frame',  true, 'published', 3),
  ('00000000-0000-4000-8000-000000000005', 'bold-ask',        'Bold Question',   'Big question headline beside photo',         'clinic-promo', '{}', 'template', 'bold-statement',true, 'published', 4),
  ('00000000-0000-4000-8000-000000000006', 'full-photo',      'Full Photo',      'Edge-to-edge photo, overlay text',           'clinic-promo', '{}', 'template', 'hero-photo',    true, 'published', 5),
  ('00000000-0000-4000-8000-000000000007', 'top-banner',      'Banner Header',   'Headline on top, photo below',               'clinic-promo', '{}', 'template', 'banner',        true, 'published', 6),
  ('00000000-0000-4000-8000-000000000008', 'tilt-card',       'Tilted Card',     'Angled photo card on colour wedge',          'clinic-promo', '{}', 'template', 'shaped-frame',  true, 'published', 7),
  ('00000000-0000-4000-8000-000000000009', 'arch-window',     'Arch Window',     'Centered heading + arch photo',              'clinic-promo', '{}', 'template', 'shaped-frame',  true, 'published', 8),
  ('00000000-0000-4000-8000-000000000010', 'ribbon-banner',   'Photo Banner',    'Photo top, message band below',              'clinic-promo', '{}', 'template', 'banner',        true, 'published', 9)

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
