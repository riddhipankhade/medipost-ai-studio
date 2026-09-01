-- Seed: Template catalog v2 (Step 3B-1 — the 20 new Post/Carousel/Story
-- templates approved in Step 3A's revised catalog).
--
-- Safe to re-run — ON CONFLICT (id) DO UPDATE overwrites every mutable
-- column, same pattern as 002_template_catalog.sql. Must run after both
-- migration 20240001000014_create_template_catalog.sql (creates the table)
-- and migration 20240001000015_templates_render_key_nullable.sql (render_key
-- must be nullable before this file's NULLs can insert).
--
-- Deliberately a NEW file rather than an edit to 002_template_catalog.sql —
-- 002 stays an untouched historical record of exactly what Step 2 shipped
-- (the 10 existing Poster rows); nothing in this file touches those rows.
--
-- render_key is NULL for every row here (Post/Carousel/Story) — see
-- migration 015's comment for why. `archetype` is catalog-display metadata
-- only, never a lookup key for these rows: for Post it's the archetype the
-- deterministic single-post engine (SINGLE_POST_ARCHETYPE_BY_CATEGORY in
-- src/lib/visual-strategy.ts) will actually pick from category alone; for
-- Carousel, where the real archetype is chosen per-slide and can genuinely
-- vary within one carousel, it's the dominant/representative archetype for
-- that template's slide pattern; for Story it's the constant 'story-card',
-- naming the one Story component rather than borrowing an unrelated
-- Post/Carousel archetype name Story doesn't actually participate in.
--
-- category/format values are all covered by the existing CHECK constraints
-- from migration 014 — no constraint changes needed. premium follows the
-- approved 14 Free / 16 Growth split (display-only via the existing Growth
-- badge in src/routes/_app.templates.tsx; it does not gate generation for
-- these three formats today — see Step 3B's plan, risk #4).
--
-- Fixed, hand-assigned UUIDs continuing 002's convention (…0001–…0010), so
-- this seed is idempotent via ON CONFLICT (id).

INSERT INTO public.templates
  (id, render_key, name, description, category, specialty_tags, format, archetype, premium, status, sort_order)
VALUES
  -- ── Post (11–18) ──────────────────────────────────────────────────────
  ('00000000-0000-4000-8000-000000000011', NULL, 'Myth vs Fact Spotlight',
    'Names a common misconception, then corrects it with the mechanism in one line.',
    'myth-fact', '{}', 'single', 'comparison-split', false, 'published', 10),
  ('00000000-0000-4000-8000-000000000012', NULL, 'Did You Know / Stat Spotlight',
    'Opens with one striking statistic — always supplied by you, never invented by AI.',
    'did-you-know', '{}', 'single', 'statistic-hero', true, 'published', 11),
  ('00000000-0000-4000-8000-000000000013', NULL, 'Patient FAQ',
    'Answers one real, specific patient question directly.',
    'patient-faq', '{}', 'single', 'faq-card', false, 'published', 12),
  ('00000000-0000-4000-8000-000000000014', NULL, 'Health Tips Checklist',
    '3–6 low-friction, general wellness tips a patient can act on this week.',
    'health-tips', '{}', 'single', 'checklist', false, 'published', 13),
  ('00000000-0000-4000-8000-000000000015', NULL, 'Prevention Focus',
    'Habits that reduce risk of one specific, named condition.',
    'prevention', '{}', 'single', 'checklist', false, 'published', 14),
  ('00000000-0000-4000-8000-000000000016', NULL, 'Warning Signs Alert',
    'Red-flag symptoms that mean "see a clinician now," ending in a clear next step.',
    'warning-signs', '{}', 'single', 'callout-diagram', false, 'published', 15),
  ('00000000-0000-4000-8000-000000000017', NULL, 'Doctor Explains',
    'First-person clinician voice explaining a condition or treatment choice.',
    'doctor-explains', '{}', 'single', 'hero-card', true, 'published', 16),
  ('00000000-0000-4000-8000-000000000018', NULL, 'Skin Concern Spotlight',
    'What a common skin concern might mean and when it''s worth getting checked.',
    'educational', '{Dermatology}', 'single', 'hero-card', false, 'published', 17),

  -- ── Carousel (19–25) ────────────────────────────────────────────────────
  ('00000000-0000-4000-8000-000000000019', NULL, 'Myth vs Fact Carousel',
    'A fuller myth-busting narrative than a single post allows.',
    'myth-fact', '{}', 'carousel', 'comparison-split', false, 'published', 18),
  ('00000000-0000-4000-8000-000000000020', NULL, 'Patient FAQ Carousel',
    'Answers one patient question with more room than a single post allows.',
    'patient-faq', '{}', 'carousel', 'faq-card', false, 'published', 19),
  ('00000000-0000-4000-8000-000000000021', NULL, 'Warning Signs Carousel',
    'One red-flag symptom per slide, ending in a clear next step.',
    'warning-signs', '{}', 'carousel', 'callout-diagram', true, 'published', 20),
  ('00000000-0000-4000-8000-000000000022', NULL, 'Prevention Habits Carousel',
    'One prevention habit per slide for a specific, named condition.',
    'prevention', '{}', 'carousel', 'checklist', false, 'published', 21),
  ('00000000-0000-4000-8000-000000000023', NULL, 'Health Tips Carousel',
    'One save-worthy wellness tip per slide.',
    'health-tips', '{}', 'carousel', 'checklist', false, 'published', 22),
  ('00000000-0000-4000-8000-000000000024', NULL, 'Your Recovery Journey',
    'What to expect during a recovery/rehab timeline, slide by slide.',
    'doctor-explains', '{Physiotherapy}', 'carousel', 'process-flow', true, 'published', 23),
  ('00000000-0000-4000-8000-000000000025', NULL, 'Know Your Heart Risk Factors',
    'One cardiovascular risk factor per slide.',
    'prevention', '{Cardiology}', 'carousel', 'icon-grid', true, 'published', 24),

  -- ── Story (26–30) ───────────────────────────────────────────────────────
  ('00000000-0000-4000-8000-000000000026', NULL, 'Quick Health Reminder',
    'A single, timely nudge — the "reminders" content job.',
    'health-tips', '{}', 'story', 'story-card', false, 'published', 25),
  ('00000000-0000-4000-8000-000000000027', NULL, 'Book Your Appointment',
    'Direct consultation/appointment CTA.',
    'clinic-promo', '{}', 'story', 'story-card', false, 'published', 26),
  ('00000000-0000-4000-8000-000000000028', NULL, 'Awareness Day Spotlight',
    'Seasonal / awareness-day tie-in.',
    'awareness', '{}', 'story', 'story-card', false, 'published', 27),
  ('00000000-0000-4000-8000-000000000029', NULL, 'Women''s Wellness Screening Reminder',
    'Screening reminder — deliberately generic on frequency/eligibility.',
    'prevention', '{Gynecology}', 'story', 'story-card', true, 'published', 28),
  ('00000000-0000-4000-8000-000000000030', NULL, 'Your First Visit: What to Expect',
    'A short, reassuring walkthrough of what a first consultation is like — works across every specialty.',
    'educational', '{}', 'story', 'story-card', false, 'published', 29)

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
