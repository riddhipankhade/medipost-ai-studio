import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type SubscriptionWithPlan = {
  generations_used: number;
  status: "active" | "trialing" | "canceled" | "past_due";
  current_period_end: string;
  billing_cycle: "monthly" | "yearly";
  plans: {
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
          generations_used,
          status,
          current_period_end,
          billing_cycle,
          plans (
            display_name,
            price_monthly,
            price_yearly,
            ai_generations_limit
          )
        `)
        .eq("user_id", userId!)
        .single();

      if (error) throw error;
      return data as SubscriptionWithPlan;
    },
  });
}
