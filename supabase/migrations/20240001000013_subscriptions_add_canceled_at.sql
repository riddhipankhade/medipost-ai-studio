-- Migration 013: self-service subscription cancellation
-- Set when a user cancels auto-renewal via the Subscription page. Cancellation
-- is deferred, not immediate: auto_renew flips false right away (which alone
-- stops the renewal cron from ever billing them again), but plan/plan_expires_at
-- are left untouched so Growth access continues through the current period —
-- the daily cron downgrades the row to the free plan once plan_expires_at passes.

ALTER TABLE public.subscriptions
  ADD COLUMN canceled_at timestamptz;

COMMENT ON COLUMN public.subscriptions.canceled_at IS
  'Set when the user requests cancellation. Access continues until plan_expires_at — this stops future billing, it does not revoke current-period access.';
