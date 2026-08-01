// Single source of truth for Growth-plan trial vs. full-price copy, so every CTA,
// banner, and dialog across the app stays in sync. Eligibility itself comes from
// useGrowthTrialEligible() (src/lib/use-subscription.ts) — this module only maps
// that boolean to approved wording.

export const GROWTH_TRIAL_HEADLINE_ELIGIBLE   = "Start 7-Day Growth Trial – ₹1";
export const GROWTH_TRIAL_HEADLINE_INELIGIBLE = "Upgrade to Growth – ₹499/month";

export const GROWTH_TRIAL_SUPPORTING_TEXT =
  "Get full Growth access for 7 days. Auto-renews at ₹499/month. Cancel anytime before renewal.";

export const GROWTH_TRIAL_BUTTON_ELIGIBLE   = "Start ₹1 Trial";
export const GROWTH_TRIAL_BUTTON_INELIGIBLE = "Upgrade to Growth";

export function growthHeadline(eligible: boolean): string {
  return eligible ? GROWTH_TRIAL_HEADLINE_ELIGIBLE : GROWTH_TRIAL_HEADLINE_INELIGIBLE;
}

export function growthButtonLabel(eligible: boolean): string {
  return eligible ? GROWTH_TRIAL_BUTTON_ELIGIBLE : GROWTH_TRIAL_BUTTON_INELIGIBLE;
}
