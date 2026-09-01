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

function computeIsPro(data: SubscriptionWithPlan | undefined): boolean {
  if (!data) return false;
  return (
    (PAID_PLANS as readonly string[]).includes(data.plan) &&
    !!data.plan_expires_at &&
    new Date(data.plan_expires_at) > new Date()
  );
}

/** Returns true if the user currently has an active paid subscription */
export function useIsPro(userId: string | undefined): boolean {
  const { data } = useSubscription(userId);
  return computeIsPro(data);
}

/**
 * Same entitlement check as useIsPro(), but also exposes whether the
 * subscription is still loading -- useIsPro() alone can't be told apart from
 * "confirmed not entitled" while the query is in flight (it returns `false`
 * either way), which is exactly wrong for UI that gates on entitlement: a
 * real Growth user would flash an "upgrade" prompt for a moment on every
 * fresh page load, even though they never actually lack entitlement. Callers
 * that show a premium-gated CTA (e.g. Template Studio's Growth upgrade
 * prompt) should hold off rendering either the CTA or the gated action until
 * `isLoading` is false, rather than default to treating "unknown" as "not
 * entitled."
 */
export function useIsProState(userId: string | undefined): { isPro: boolean; isLoading: boolean } {
  const { data, isLoading } = useSubscription(userId);
  return { isPro: computeIsPro(data), isLoading: !!userId && isLoading };
}
export function useShowWatermark(userId: string | undefined): boolean {
  return !useIsPro(userId);
}

export function useGrowthTrialEligible(userId: string | undefined): boolean {
  const { data, isLoading } = useSubscription(userId);
  if (!userId || isLoading) return false;
  return !data?.trial_used_at;
}