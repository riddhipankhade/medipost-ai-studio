-- Seed: Carousel catalog rows for the 6 remaining Carousel templates,
-- continuing after 005_shape_library_poc.sql's magazine-spread assignment.
--
-- Rows 20-25 were still unbuilt placeholders (render_key = NULL,
-- category-bound names from the pre-Template-Studio catalog draft) --
-- reused here via UPDATE, same idempotent-by-fixed-id pattern as
-- 004/005/008, with name/description/category refreshed to match the
-- actual shape-first design shipped (these are no longer category-bound,
-- same treatment already given to the Post batch in 008). Row 19
-- (magazine-spread) is untouched, as instructed.
--
-- category = 'clinic-promo' for all 6, matching the same reasoning already
-- used for the Poster and Post batches: these are generic, specialty-
-- neutral compositions, not tied to one content category. specialty_tags
-- = '{}'. premium = true, matching the existing kind === "template" &&
-- !isPro gate.

UPDATE public.templates SET
  render_key = 'blueprint-deck', name = 'Blueprint Deck',
  description = 'Technical drafting sheets with a coordinate strip and title block',
  category = 'clinic-promo', specialty_tags = '{}', sort_order = 19, updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000020';

UPDATE public.templates SET
  render_key = 'chart-deck', name = 'Chart Deck',
  description = 'Vitals-report deck with a real bar chart on every slide',
  category = 'clinic-promo', specialty_tags = '{}', sort_order = 20, updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000021';

UPDATE public.templates SET
  render_key = 'frame-stack', name = 'Frame Stack',
  description = 'Museum-frame deck with a gallery placard on every slide',
  category = 'clinic-promo', specialty_tags = '{}', sort_order = 21, updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000022';

UPDATE public.templates SET
  render_key = 'swiss-grid-deck', name = 'Swiss Grid Deck',
  description = 'Numbered-section typographic deck, no rounded pills',
  category = 'clinic-promo', specialty_tags = '{}', sort_order = 22, updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000023';

UPDATE public.templates SET
  render_key = 'timeline-deck', name = 'Timeline Deck',
  description = 'One journey step per slide with a persistent step-rail',
  category = 'clinic-promo', specialty_tags = '{}', sort_order = 23, updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000024';

UPDATE public.templates SET
  render_key = 'split-screen-deck', name = 'Split Screen Deck',
  description = 'Diagonal concern/approach split on every slide',
  category = 'clinic-promo', specialty_tags = '{}', sort_order = 24, updated_at = now()
  WHERE id = '00000000-0000-4000-8000-000000000025';
