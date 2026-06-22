-- Migration 002: plans
-- No foreign key dependencies. Seeded separately.

CREATE TABLE public.plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL UNIQUE,           -- 'free' | 'starter' | 'pro'
  display_name     text        NOT NULL,
  price_monthly    numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly     numeric(10,2) NOT NULL DEFAULT 0,
  ai_generations_limit integer NOT NULL DEFAULT 10,       -- -1 = unlimited
  features         jsonb       NOT NULL DEFAULT '{}',
  is_active        boolean     NOT NULL DEFAULT true,
  sort_order       integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_plans_is_active ON public.plans (is_active);
CREATE INDEX idx_plans_sort_order ON public.plans (sort_order);

-- RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_public_read"
  ON public.plans FOR SELECT
  USING (true);

-- CREATE POLICY "plans_admin_all"
--   ON public.plans FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   );

COMMENT ON TABLE public.plans IS 'Subscription tier definitions managed by admins.';
COMMENT ON COLUMN public.plans.ai_generations_limit IS '-1 means unlimited.';
COMMENT ON COLUMN public.plans.features IS 'JSON object: { platforms: string[], custom_branding: bool, priority_support: bool }';
