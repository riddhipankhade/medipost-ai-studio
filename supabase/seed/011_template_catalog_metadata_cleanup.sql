-- Seed: Template catalog metadata cleanup -- archetype + sort_order only.
--
-- Idempotent UPDATE-by-fixed-id, same convention as 004/005/008/009/010.
-- Touches ONLY the `archetype` and `sort_order` columns -- never render_key,
-- name, description, category, specialty_tags, premium, or status. No
-- column overlap with 010_story_batch2.sql (which sets render_key only on
-- rows 27-30), so run order relative to that file does not affect the
-- outcome; numbered 011 to run after it per this project's sequential
-- seed-file convention.
--
-- PART 1 -- stale `archetype` backfill (11 rows)
-- ------------------------------------------------
-- 004/005/008/009 renamed these rows' render_key/name/description/category
-- to an entirely new shape-first design but never updated `archetype`, so it
-- still describes each row's PRE-redesign identity (e.g. row 19 is "Magazine
-- Spread" but still carries archetype='comparison-split', a leftover from
-- when it was "Myth vs Fact Carousel"). `archetype` is catalog-display
-- metadata only, never a lookup key (migration 20240001000014's comment on
-- public.templates), so this has zero functional effect -- it only corrects
-- what the DB says about rows whose design already changed. Set to each
-- row's own render_key, matching the self-descriptive slug style already
-- used by every row inserted fresh after the redesign (e.g. …036-…039).
--
-- Rows 11-14 (Phase-A Post, never redesigned), row 26 (split-duotone), and
-- rows 36-39 (fresh shape-first inserts) already have correct archetype
-- values and are intentionally NOT touched. Rows 27-30 already correctly
-- carry the shared 'story-card' constant per 003's own documented
-- convention for Story format and are also NOT touched here.

UPDATE public.templates SET archetype = 'polaroid-stack',     updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000015';
UPDATE public.templates SET archetype = 'editorial-column',   updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000016';
UPDATE public.templates SET archetype = 'blueprint-grid',     updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000017';
UPDATE public.templates SET archetype = 'torn-ticket',        updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000018';
UPDATE public.templates SET archetype = 'magazine-spread',    updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000019';
UPDATE public.templates SET archetype = 'blueprint-deck',     updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000020';
UPDATE public.templates SET archetype = 'chart-deck',         updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000021';
UPDATE public.templates SET archetype = 'frame-stack',        updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000022';
UPDATE public.templates SET archetype = 'swiss-grid-deck',    updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000023';
UPDATE public.templates SET archetype = 'timeline-deck',      updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000024';
UPDATE public.templates SET archetype = 'split-screen-deck',  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000025';

-- PART 2 -- deterministic global sort_order (39 rows, no duplicates)
-- ------------------------------------------------------------------
-- Replaces the current per-batch-local numbering (each later batch
-- restarted its own counter, producing 9 duplicate sort_order values shared
-- between a Poster/Post or Post/Carousel row -- see this task's audit
-- report) with one deterministic global ordering:
--   Poster   1-15   (15 rows)
--   Post     16-27  (12 rows)
--   Carousel 28-34  (7 rows)
--   Story    35-39  (5 rows)
-- Relative order within each format is preserved exactly as it stands
-- today (current sort_order ascending) -- this only renumbers, it never
-- reorders.

-- Poster (1-15)
UPDATE public.templates SET sort_order = 1,  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000001';
UPDATE public.templates SET sort_order = 2,  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000002';
UPDATE public.templates SET sort_order = 3,  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000003';
UPDATE public.templates SET sort_order = 4,  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000004';
UPDATE public.templates SET sort_order = 5,  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000005';
UPDATE public.templates SET sort_order = 6,  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000006';
UPDATE public.templates SET sort_order = 7,  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000007';
UPDATE public.templates SET sort_order = 8,  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000008';
UPDATE public.templates SET sort_order = 9,  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000009';
UPDATE public.templates SET sort_order = 10, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000010';
UPDATE public.templates SET sort_order = 11, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000031';
UPDATE public.templates SET sort_order = 12, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000032';
UPDATE public.templates SET sort_order = 13, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000033';
UPDATE public.templates SET sort_order = 14, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000034';
UPDATE public.templates SET sort_order = 15, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000035';

-- Post (16-27)
UPDATE public.templates SET sort_order = 16, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000011';
UPDATE public.templates SET sort_order = 17, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000012';
UPDATE public.templates SET sort_order = 18, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000013';
UPDATE public.templates SET sort_order = 19, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000014';
UPDATE public.templates SET sort_order = 20, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000015';
UPDATE public.templates SET sort_order = 21, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000016';
UPDATE public.templates SET sort_order = 22, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000017';
UPDATE public.templates SET sort_order = 23, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000018';
UPDATE public.templates SET sort_order = 24, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000036';
UPDATE public.templates SET sort_order = 25, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000037';
UPDATE public.templates SET sort_order = 26, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000038';
UPDATE public.templates SET sort_order = 27, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000039';

-- Carousel (28-34)
UPDATE public.templates SET sort_order = 28, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000019';
UPDATE public.templates SET sort_order = 29, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000020';
UPDATE public.templates SET sort_order = 30, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000021';
UPDATE public.templates SET sort_order = 31, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000022';
UPDATE public.templates SET sort_order = 32, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000023';
UPDATE public.templates SET sort_order = 33, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000024';
UPDATE public.templates SET sort_order = 34, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000025';

-- Story (35-39)
UPDATE public.templates SET sort_order = 35, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000026';
UPDATE public.templates SET sort_order = 36, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000027';
UPDATE public.templates SET sort_order = 37, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000028';
UPDATE public.templates SET sort_order = 38, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000029';
UPDATE public.templates SET sort_order = 39, updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000030';
