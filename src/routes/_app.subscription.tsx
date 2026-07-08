import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Zap, Crown, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPayUHash, verifyPayUPayment } from "@/lib/api/payment.functions";
import { useSubscription } from "@/lib/use-subscription";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/subscription")({
  component: SubscriptionPage,
});

declare global {
  interface Window {
    bolt?: {
      launch: (
        params: Record<string, string>,
        handlers: {
          responseHandler: (bolt: { response: Record<string, string> }) => void;
          catchExceptionHandler: (bolt: { message: string }) => void;
        }
      ) => void;
    };
  }
}

function loadBoltScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.bolt) { resolve(); return; }
    const existing = document.querySelector('script[src*="bolt.min.js"]');
    if (existing) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://sandboxsecure.payu.in/bolt/bolt.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayU Bolt SDK"));
    document.body.appendChild(script);
  });
}

const PLANS = [
  {
    key:         "starter",
    name:        "Starter",
    price:       "₹499",
    period:      "/month",
    description: "Perfect for solo practitioners getting started.",
    icon:        Zap,
    popular:     false,
    features: [
      "50 posts per month",
      "All post types (Single, Carousel, Story, Reel, Campaign)",
      "Hashtag generation",
      "Brand kit",
      "Content history",
    ],
  },
  {
    key:         "pro",
    name:        "Pro",
    price:       "₹1,999",
    period:      "/month",
    description: "For busy clinics who post consistently.",
    icon:        Crown,
    popular:     true,
    features: [
      "300 posts per month",
      "All post types",
      "AI Visual generation (Flux)",
      "Hashtag generation",
      "Brand kit",
      "Content history",
      "Priority generation",
    ],
  },
  {
    key:         "clinic",
    name:        "Clinic",
    price:       "₹6,999",
    period:      "/month",
    description: "For multi-doctor practices and hospitals.",
    icon:        Building2,
    popular:     false,
    features: [
      "Unlimited posts per month",
      "All post types",
      "AI Visual generation (Flux)",
      "Hashtag generation",
      "Brand kit",
      "Content history",
      "Priority generation",
      "Dedicated support",
    ],
  },
];

function SubscriptionPage() {
  const queryClient             = useQueryClient();
  const [payingPlan, setPaying] = useState<string | null>(null);
  const [userId, setUserId]     = useState<string | undefined>(undefined);

  useState(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  });

  const { data: sub, isLoading } = useSubscription(userId);

  const isPro = sub?.plan === "pro"
    && !!sub?.plan_expires_at
    && new Date(sub.plan_expires_at) > new Date();

  const currentPlanName = isPro ? (sub?.plans as any)?.name : "free";

  async function handleUpgrade(planKey: string) {
    setPaying(planKey);
    try {
      const params = await createPayUHash({ data: { planKey } });
      await loadBoltScript();
      if (!window.bolt) throw new Error("PayU Bolt SDK not available. Please try again.");

      window.bolt.launch(
        {
          key:         params.key,
          txnid:       params.txnid,
          amount:      params.amount,
          productinfo: params.productinfo,
          firstname:   params.firstname,
          email:       params.email,
          phone:       params.phone,
          hash:        params.hash,
          surl:        `${window.location.origin}/subscription`,
          furl:        `${window.location.origin}/subscription`,
          udf1: "", udf2: "", udf3: "", udf4: "", udf5: "",
        },
        {
          responseHandler: async (bolt) => {
            const r = bolt.response;
            if (r.status === "success") {
              try {
                await verifyPayUPayment({
                  data: {
                    planKey,
                    txnid:       r.txnid,
                    status:      r.status,
                    amount:      r.amount,
                    productinfo: r.productinfo,
                    firstname:   r.firstname,
                    email:       r.email,
                    mihpayid:    r.mihpayid ?? "",
                    hash:        r.hash,
                  },
                });
                toast.success(
                  "Plan activated! Welcome to " +
                  planKey.charAt(0).toUpperCase() + planKey.slice(1) + "."
                );
                queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
              } catch (e: any) {
                toast.error(e?.message ?? "Verification failed. Contact support.");
              }
            } else if (r.status === "failure") {
              toast.error("Payment failed. Please try again.");
            } else {
              toast.info("Payment cancelled.");
            }
            setPaying(null);
          },
          catchExceptionHandler: (bolt) => {
            toast.error(bolt.message ?? "Payment error. Please try again.");
            setPaying(null);
          },
        }
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Could not initiate payment. Please try again.");
      setPaying(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="text-muted-foreground mt-1">
          Choose the plan that works for your practice.
        </p>
      </div>

      {!isLoading && sub && (
        <div className={`mb-8 rounded-xl border p-4 flex items-center justify-between ${
          isPro ? "bg-primary/5 border-primary/30" : "bg-muted/40 border-border"
        }`}>
          <div>
            <p className="font-semibold text-sm">
              {isPro
                ? `You're on ${(sub?.plans as any)?.display_name ?? "Pro"}`
                : "You're on the Free plan"}
            </p>
            {isPro && sub?.plan_expires_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Active until {new Date(sub.plan_expires_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            )}
            {!isPro && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {sub?.generations_used ?? 0} / 10 posts used this month
              </p>
            )}
          </div>
          {isPro && <Badge className="bg-primary text-primary-foreground">Active</Badge>}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon      = plan.icon;
          const isCurrent = currentPlanName === plan.key;
          const isPaying  = payingPlan === plan.key;

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 bg-card p-6 flex flex-col ${
                plan.popular ? "border-primary shadow-lg" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                  <h2 className="text-lg font-bold">{plan.name}</h2>
                  {isCurrent && <Badge variant="secondary">Current</Badge>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      plan.popular ? "text-primary" : "text-muted-foreground"
                    }`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className={`w-full gap-2 ${
                    plan.popular ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={!!payingPlan || isLoading}
                >
                  {isPaying
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    : `Upgrade to ${plan.name} — ${plan.price}`}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        All plans include a <strong>free tier</strong> with 10 posts/month.
        Paid plans activate immediately after payment.
      </p>
    </div>
  );
}