-- Migration 012: Growth plan trial tracking
-- Lets a user redeem the ₹1 / 7-day Growth trial exactly once, ever.

ALTER TABLE public.subscriptions
  ADD COLUMN trial_used_at timestamptz;

COMMENT ON COLUMN public.subscriptions.trial_used_at IS
  'Set once when the user redeems the ₹1 / 7-day Growth trial. Null = trial still available. Never cleared once set — enforces one-trial-per-user.';
