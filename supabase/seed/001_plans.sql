-- Seed: Default subscription plans
-- Run after all migrations. Safe to re-run (ON CONFLICT DO UPDATE).

INSERT INTO public.plans
  (name, display_name, price_monthly, price_yearly, ai_generations_limit, features, is_active, sort_order)
VALUES
  (
    'free',
    'Free',
    0.00,
    0.00,
    10,
    '{
      "platforms": ["instagram", "facebook"],
      "custom_branding": false,
      "priority_support": false,
      "content_history_days": 7
    }'::jsonb,
    true,
    1
  ),
  (
    'starter',
    'Starter',
    29.00,
    290.00,
    100,
    '{
      "platforms": ["instagram", "facebook", "linkedin", "twitter"],
      "custom_branding": true,
      "priority_support": false,
      "content_history_days": 90
    }'::jsonb,
    true,
    2
  ),
  (
    'pro',
    'Pro',
    79.00,
    790.00,
    -1,
    '{
      "platforms": ["instagram", "facebook", "linkedin", "twitter"],
      "custom_branding": true,
      "priority_support": true,
      "content_history_days": -1
    }'::jsonb,
    true,
    3
  )
ON CONFLICT (name) DO UPDATE SET
  display_name             = EXCLUDED.display_name,
  price_monthly            = EXCLUDED.price_monthly,
  price_yearly             = EXCLUDED.price_yearly,
  ai_generations_limit     = EXCLUDED.ai_generations_limit,
  features                 = EXCLUDED.features,
  is_active                = EXCLUDED.is_active,
  sort_order               = EXCLUDED.sort_order,
  updated_at               = now();

-- Seed: First admin user (replace email before running in production)
-- This creates the profile row directly; assumes auth.users row already exists.
-- To create the admin account:
--   1. Register via normal signup flow first
--   2. Then run this UPDATE to elevate the role
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@yourdomain.com';
