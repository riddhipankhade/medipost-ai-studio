-- Migration 007: add contact fields to brand_kits
-- Adds phone, website, address columns that were missing from the initial schema.

ALTER TABLE public.brand_kits
  ADD COLUMN IF NOT EXISTS phone   text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS address text;

COMMENT ON COLUMN public.brand_kits.phone   IS 'Clinic contact number';
COMMENT ON COLUMN public.brand_kits.website IS 'Clinic website (no protocol required)';
COMMENT ON COLUMN public.brand_kits.address IS 'Clinic street address';
