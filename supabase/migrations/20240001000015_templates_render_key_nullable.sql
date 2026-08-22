-- Migration 015: templates.render_key becomes nullable
--
-- render_key is a real, code-owned lookup key ONLY for Poster rows
-- (format = 'template'), where it resolves to a static frame component via
-- getTemplateFrame() (src/components/template-frames.tsx). Step 3A's catalog
-- expansion adds Post (format = 'single'), Carousel (format = 'carousel'),
-- and Story (format = 'story') rows, none of which use render_key at all:
--
--   Poster:   template -> render_key -> getTemplateFrame() -> renderer
--   Post:     template -> category   -> resolveSinglePostStrategy() (existing
--                                        engine, src/lib/visual-strategy.ts)
--   Carousel: template -> category   -> carouselStructureFor() prompt shape +
--                                        resolveVisualStrategy() per slide
--   Story:    template -> format='story' -> StoryCard (the only Story
--                                        component -- format alone is a
--                                        sufficient key, nothing to look up)
--
-- Forcing render_key to hold a value for these rows would invite a future
-- reader to treat it as a real lookup key when nothing in the render path
-- ever consumes it for them. NULL for those rows is the honest state.
--
-- Loosening an existing NOT NULL constraint -- no backfill, no data rewrite.
-- Every existing (Poster) row keeps its real, non-null render_key unchanged.

ALTER TABLE public.templates ALTER COLUMN render_key DROP NOT NULL;

COMMENT ON COLUMN public.templates.render_key IS 'Real, code-owned lookup key ONLY for Poster rows (format = ''template''): resolves to a frame component via a static allowlist (getTemplateFrame() in src/components/template-frames.tsx), never a dynamic import or executable value. NULL for every other format -- Post/Carousel rows (format = ''single''/''carousel'') resolve their renderer dynamically from category + generated content via src/lib/visual-strategy.ts; Story rows (format = ''story'') resolve via format alone, since there is exactly one Story component. Never read render_key for a non-Poster row.';
