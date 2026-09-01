-- Shape Library proof-of-concept: assigns the first 3 visual-first render_keys
-- (one per format) approved from the redesigned template matrix. Idempotent
-- UPDATE-by-fixed-ID, matching 004_post_templates_phase_a.sql's pattern —
-- never inserts new rows. Deliberately targets rows that were still NULL
-- rather than touching the four superseded Post rows (11-14), so this POC is
-- non-destructive and reversible pending design review.
UPDATE public.templates SET render_key = 'polaroid-stack',   updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000015';
UPDATE public.templates SET render_key = 'magazine-spread',  updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000019';
UPDATE public.templates SET render_key = 'split-duotone',    updated_at = now() WHERE id = '00000000-0000-4000-8000-000000000026';
