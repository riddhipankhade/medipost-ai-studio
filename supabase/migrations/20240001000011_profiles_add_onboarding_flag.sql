-- Migration 011: add onboarding flag to profiles
-- Tracks whether a user has completed (or skipped) the first-run product tour.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether the user has completed or skipped the first-run dashboard tour';
