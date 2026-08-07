import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { PAID_PLANS } from "@/lib/constants";

export type SubscriptionWithPlan = {
  plan: string;
  plan_expires_at: string | null;
  generations_used: number;
  status: "active" | "trialing" | "canceled" | "past_due";
  current_period_end: string;
  billing_cycle: "monthly" | "yearly";
  trial_used_at: string | null;
  auto_renew: boolean;
  next_billing_date: string | null;
  canceled_at: string | null;
  plans: {
    name: string;
    display_name: string;
    price_monthly: number;
    price_yearly: number;
    ai_generations_limit: number; // -1 = unlimited
  };
};

export function useSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ["subscription", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<SubscriptionWithPlan> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          plan,
          plan_expires_at,
          generations_used,
          status,
          current_period_end,
          billing_cycle,
          trial_used_at,
          auto_renew,
          next_billing_date,
          canceled_at,
          plans (
            name,
            display_name,
            price_monthly,
            price_yearly,
            ai_generations_limit
          )
        `)
        .eq("user_id", userId!)
        .single();

      if (error) throw error;
      return data as unknown as SubscriptionWithPlan;
    },
  });
}

/** Returns true if the user currently has an active paid subscription */
export function useIsPro(userId: string | undefined): boolean {
  const { data } = useSubscription(userId);
  if (!data) return false;
  return (
    (PAID_PLANS as readonly string[]).includes(data.plan) &&
    !!data.plan_expires_at &&
    new Date(data.plan_expires_at) > new Date()
  );
}

/** Returns true when creatives should carry the Medipost watermark — free/Starter
 *  plan, expired plan, or no subscription row at all. Defaults to "show watermark"
 *  while the subscription query is loading so a paid check never briefly renders
 *  clean (the safe direction to be wrong in). */
export function useShowWatermark(userId: string | undefined): boolean {
  return !useIsPro(userId);
}

/** Returns true when the user is still eligible for the ₹1 / 7-day Growth trial —
 *  i.e. they've never redeemed it (subscriptions.trial_used_at is null). Defaults
 *  to false while loading or logged out, so trial-only CTAs never flash on for a
 *  user who might already have used it (mirrors useShowWatermark's default-safe
 *  pattern). This only reflects eligibility for copy/CTA purposes — the actual
 *  once-per-user gate is re-enforced server-side in payment.functions.ts. */
export function useGrowthTrialEligible(userId: string | undefined): boolean {
  const { data, isLoading } = useSubscription(userId);
  if (!userId || isLoading) return false;
  return !data?.trial_used_at;
}