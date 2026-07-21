-- Migration 010: fix content_generations CHECK constraints to match what the
-- app actually writes.
--
-- Verified against the LIVE remote schema (not just migration 005's original
-- text, which has already drifted from it undocumented):
--   content_generations_status_check on remote is currently
--     status IN ('draft','completed','published','failed','generating')
--     -- already includes 'completed'; does NOT include 'archived'.
--   content_generations_workflow_kind_check on remote is currently
--     workflow_kind IN ('single','carousel','story','reel','campaign','festive')
--     -- exactly matches migration 005's original text; still missing 'template',
--     -- so every Template Post insert has been silently failing the CHECK
--     -- (generate.functions.ts only console.error's saveError, never surfaces
--     -- it) -- confirmed zero workflow_kind='template' rows exist today.
--
-- This migration is additive-only for `status`: it keeps every value the live
-- constraint already permits (including 'failed'/'generating', unused by any
-- code today but not ours to remove without knowing why they're there) and
-- adds 'archived' back since the original migration intended it. `workflow_kind`
-- adds the one genuinely missing value, 'template'.
--
-- DROP+ADD (not ALTER ... VALIDATE) so this fails loudly at apply time if any
-- existing row would violate the new constraint, rather than silently
-- accepting bad data. Checked against live data first: all 215 existing rows
-- have status='completed', so this is a no-op validation-wise.

ALTER TABLE public.content_generations
  DROP CONSTRAINT IF EXISTS content_generations_status_check;
ALTER TABLE public.content_generations
  ADD CONSTRAINT content_generations_status_check
  CHECK (status IN ('draft', 'completed', 'published', 'archived', 'failed', 'generating'));

ALTER TABLE public.content_generations
  DROP CONSTRAINT IF EXISTS content_generations_workflow_kind_check;
ALTER TABLE public.content_generations
  ADD CONSTRAINT content_generations_workflow_kind_check
  CHECK (workflow_kind IN ('single', 'carousel', 'story', 'reel', 'campaign', 'festive', 'template'));
