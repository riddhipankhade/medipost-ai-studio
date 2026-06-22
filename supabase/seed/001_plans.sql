-- Seed: Subscription plans
-- Safe to re-run — ON CONFLICT DO UPDATE overwrites every mutable column.
-- Must run after all migrations (public.plans must exist).

INSERT INTO public.plans
  (name, display_name, price_monthly, price_yearly, ai_generations_limit, features, is_active, sort_order)
VALUES
  -- ----------------------------------------------------------------
  -- FREE
  -- 10 generations/month. Single posts and stories only.
  -- No custom branding. History limited to 7 days.
  -- ----------------------------------------------------------------
  (
    'free',
    'Free',
    0.00,
    0.00,
    10,
    '{
      "workflow_kinds":           ["single", "story"],
      "content_categories_limit": 4,
      "custom_branding":          false,
      "priority_support":         false,
      "content_history_days":     7
    }'::jsonb,
    true,
    1
  ),

  -- ----------------------------------------------------------------
  -- STARTER
  -- 100 generations/month. All formats except campaign planner.
  -- Custom branding enabled. 90-day history.
  -- ----------------------------------------------------------------
  (
    'starter',
    'Starter',
    29.00,
    290.00,
    100,
    '{
      "workflow_kinds":           ["single", "carousel", "story", "reel", "festive"],
      "content_categories_limit": -1,
      "custom_branding":          true,
      "priority_support":         false,
      "content_history_days":     90
    }'::jsonb,
    true,
    2
  ),

  -- ----------------------------------------------------------------
  -- PRO
  -- Unlimited generations. All formats including campaign planner.
  -- Custom branding + priority support. Unlimited history.
  -- ----------------------------------------------------------------
  (
    'pro',
    'Pro',
    79.00,
    790.00,
    -1,
    '{
      "workflow_kinds":           ["single", "carousel", "story", "reel", "campaign", "festive"],
      "content_categories_limit": -1,
      "custom_branding":          true,
      "priority_support":         true,
      "content_history_days":     -1
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

-- ----------------------------------------------------------------
-- Admin account setup (run manually after first signup)
-- ----------------------------------------------------------------
-- 1. Register via the normal signup flow.
-- 2. Then run this in the Supabase SQL editor:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@yourdomain.com';
