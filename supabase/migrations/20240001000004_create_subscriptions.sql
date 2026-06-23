-- Migration 005: subscriptions
-- One subscription per user. Free plan assigned automatically on profile creation.

CREATE TABLE public.subscriptions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id                  uuid        NOT NULL REFERENCES public.plans(id),
  status                   text        NOT NULL DEFAULT 'active'
                                       CHECK (status IN ('active', 'trialing', 'canceled', 'past_due')),
  billing_cycle            text        NOT NULL DEFAULT 'monthly'
                                       CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start     timestamptz NOT NULL DEFAULT now(),
  current_period_end       timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  generations_used         integer     NOT NULL DEFAULT 0 CHECK (generations_used >= 0),
  stripe_customer_id       text,
  stripe_subscription_id   text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_subscriptions_user_id  ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_plan_id  ON public.subscriptions (plan_id);
CREATE INDEX idx_subscriptions_status   ON public.subscriptions (status);
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions (current_period_end);

-- Stripe IDs need fast lookup for webhook processing
CREATE UNIQUE INDEX idx_subscriptions_stripe_customer
  ON public.subscriptions (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX idx_subscriptions_stripe_sub
  ON public.subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_owner_read"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update safe columns (not plan_id, not stripe fields)
-- Plan changes and Stripe sync happen via service_role on the backend.
CREATE POLICY "subscriptions_admin_all"
  ON public.subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Auto-assign free plan when a profile is created
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  SELECT id INTO free_plan_id FROM public.plans WHERE name = 'free' LIMIT 1;

  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id)
    VALUES (NEW.id, free_plan_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_assign_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

COMMENT ON TABLE public.subscriptions IS 'One row per user. Updated in place when plan changes or Stripe webhooks fire.';
COMMENT ON COLUMN public.subscriptions.generations_used IS 'Reset to 0 on period rollover via backend cron or Stripe webhook.';
COMMENT ON COLUMN public.subscriptions.stripe_customer_id IS 'Null for free-tier users who have never entered billing info.';
