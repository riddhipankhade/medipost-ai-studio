import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type SubscriptionWithPlan = {
  plan: string;                  // 'free' | 'pro'
  plan_expires_at: string | null;
  generations_used: number;
  status: "active" | "trialing" | "canceled" | "past_due";
  current_period_end: string;
  billing_cycle: "monthly" | "yearly";
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

/** Returns true if the user currently has an active Pro subscription */
export function useIsPro(userId: string | undefined): boolean {
  const { data } = useSubscription(userId);
  if (!data) return false;
  return (
    data.plan === "pro" &&
    !!data.plan_expires_at &&
    new Date(data.plan_expires_at) > new Date()
  );
}