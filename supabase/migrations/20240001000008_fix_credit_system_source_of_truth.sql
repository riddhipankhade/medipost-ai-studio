-- Migration 008: fix credit system source of truth
--
-- Bug: get_credits() read subscriptions.generations_used, while deduct_credit()
-- independently counted rows in content_generations. The two disagreed whenever
-- a generation didn't produce exactly one content_generations row (failed saves,
-- multi-credit actions, refunds), so the dashboard could show credits remaining
-- after the generation flow had already started rejecting requests as exhausted.
--
-- Fix: subscriptions.generations_used becomes the single source of truth.
-- deduct_credit() now increments it directly (instead of counting rows), and
-- refund_credit() decrements it on downstream failure. get_credits() is
-- unchanged — it already read generations_used — and is (re)created here
-- because it previously only existed live in the database, untracked.
--
-- Backfilled from the live database on 2026-07-21: this migration was applied
-- directly to production and never committed to this repo, so `supabase
-- migration list` showed it as remote-only drift. This file reconstructs it
-- verbatim (via `supabase db query --linked` against
-- supabase_migrations.schema_migrations) so local migration history matches
-- remote and future `db push` runs stop refusing to proceed. It is not being
-- re-applied — the functions already exist live; this only restores repo
-- parity.

CREATE OR REPLACE FUNCTION public.get_credits(p_user_id uuid)
RETURNS TABLE (
  generations_used     integer,
  ai_generations_limit integer,
  credits_remaining    integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.generations_used,
    p.ai_generations_limit,
    CASE
      WHEN p.ai_generations_limit = -1 THEN -1
      ELSE GREATEST(p.ai_generations_limit - s.generations_used, 0)
    END AS credits_remaining
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = p_user_id;
END;
$$;

-- Increments subscriptions.generations_used, the single source of truth for
-- consumption. Row is locked FOR UPDATE so concurrent requests from the same
-- user serialize instead of racing past the limit check.
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_generations_used integer;
  v_limit            integer;
BEGIN
  SELECT s.generations_used, p.ai_generations_limit
    INTO v_generations_used, v_limit
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = p_user_id
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF v_limit <> -1 AND v_generations_used >= v_limit THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  UPDATE public.subscriptions
     SET generations_used = generations_used + 1
   WHERE user_id = p_user_id;
END;
$$;

-- Decrements subscriptions.generations_used. Called when a deducted credit's
-- downstream AI call fails, so the user isn't charged for a generation that
-- never produced output. Floored at 0 (matches the generations_used >= 0
-- check constraint) and locks the row for the same reason as deduct_credit.
CREATE OR REPLACE FUNCTION public.refund_credit(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
     SET generations_used = GREATEST(generations_used - 1, 0)
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_credits(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credit(uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credit(uuid)  TO authenticated;

COMMENT ON FUNCTION public.get_credits(uuid)   IS 'Reads subscriptions.generations_used vs plans.ai_generations_limit. Single source of truth for remaining credits.';
COMMENT ON FUNCTION public.deduct_credit(uuid) IS 'Increments subscriptions.generations_used. Raises INSUFFICIENT_CREDITS or SUBSCRIPTION_NOT_FOUND.';
COMMENT ON FUNCTION public.refund_credit(uuid) IS 'Decrements subscriptions.generations_used (floored at 0). Called on downstream generation failure to undo a deduct_credit.';
