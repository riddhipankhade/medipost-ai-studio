import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Zap, Crown, Building2, Loader2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { cn } from "@/lib/utils";
import { createPayUHash, verifyPayUPayment } from "@/lib/api/payment.functions";
import { validateVoucher } from "@/lib/api/voucher.functions";
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
          catchException: (bolt: { message: string }) => void;
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
    script.src = "https://jssdk.payu.in/bolt/bolt.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayU Bolt SDK"));
    document.body.appendChild(script);
  });
}

const PAID_PLANS = ["growth", "pro_clinic", "pro"];

const PLANS = [
  {
    key:         "starter",
    name:        "Starter",
    price:       0,
    period:      "/month",
    description: "For doctors exploring AI-powered content creation.",
    icon:        Zap,
    popular:     false,
    free:        true,
    gens:        "10 posts / month",
    features: [
      "AI post generation — every format except Template Studio",
      "10 Indian languages (Hindi, Tamil, Bengali & more)",
      "Standard tone only",
      "General Public audience only",
      "Medipost branding watermark",
    ],
  },
  {
    key:         "growth",
    name:        "Growth",
    price:       499,
    period:      "/month",
    description: "For active doctors building their personal brand.",
    icon:        Crown,
    popular:     true,
    free:        false,
    gens:        "60 posts / month",
    features: [
      "Template Studio unlocked",
      "Platform-specific optimization (LinkedIn, Instagram)",
      "All tones & audience targeting unlocked",
      "10 Indian languages (Hindi, Tamil, Bengali & more)",
      "No watermark",
    ],
  },
  {
    key:         "pro_clinic",
    name:        "Pro Clinic",
    price:       999,
    period:      "/month",
    description: "For multi-doctor clinics and hospital marketing teams.",
    icon:        Building2,
    popular:     false,
    free:        false,
    gens:        "200 posts / month",
    features: [
      "Everything in Growth",
      "Multi-brand / clinic support",
      "Bulk post generation",
      "Priority AI quality (better outputs)",
      "Priority support",
    ],
  },
];

type AppliedVoucher = {
  code: string;
  discountPercentage: number;
  applicablePlans: string[];
};

function formatPrice(amount: number) {
  if (amount === 0) return "Free";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function SubscriptionPage() {
  const queryClient             = useQueryClient();
  const [payingPlan, setPaying] = useState<string | null>(null);
  const [userId, setUserId]     = useState<string | undefined>(undefined);

  const [voucherInput,    setVoucherInput]   = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [appliedVoucher,  setAppliedVoucher]  = useState<AppliedVoucher | null>(null);

  useState(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  });

  const { data: sub, isLoading } = useSubscription(userId);

  const isPaid = sub
    ? PAID_PLANS.includes(sub.plan) &&
      !!sub.plan_expires_at &&
      new Date(sub.plan_expires_at) > new Date()
    : false;

  const currentPlanName = isPaid ? sub?.plan : "starter";

  async function handleApplyVoucher() {
    if (!voucherInput.trim()) return;
    setApplyingVoucher(true);
    try {
      const result = await validateVoucher({ data: { code: voucherInput.trim() } });
      setAppliedVoucher(result);
      toast.success(`Voucher applied! ${result.discountPercentage}% off on ${result.applicablePlans.join(", ")} plan${result.applicablePlans.length > 1 ? "s" : ""}.`);
      setVoucherInput("");
    } catch (e: any) {
      toast.error(e?.message ?? "Invalid voucher code.");
    } finally {
      setApplyingVoucher(false);
    }
  }

  function clearVoucher() {
    setAppliedVoucher(null);
    setVoucherInput("");
  }

  function getDiscountedPrice(plan: typeof PLANS[0]): { original: number; final: number; discounted: boolean } {
    if (!plan.free && appliedVoucher && appliedVoucher.applicablePlans.includes(plan.key)) {
      const discount = plan.price * (appliedVoucher.discountPercentage / 100);
      return { original: plan.price, final: Math.max(1, plan.price - discount), discounted: true };
    }
    return { original: plan.price, final: plan.price, discounted: false };
  }

  async function handleUpgrade(planKey: string) {
    setPaying(planKey);
    try {
      const voucherCode = appliedVoucher?.applicablePlans.includes(planKey)
        ? appliedVoucher.code
        : undefined;

      const params = await createPayUHash({ data: { planKey, voucherCode } });
      await loadBoltScript();
      if (!window.bolt) throw new Error("PayU Bolt SDK not available. Please try again.");

      const onBoltException = (bolt: { message: string }) => {
        toast.error(bolt.message ?? "Payment error. Please try again.");
        setPaying(null);
      };

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
          si:         params.si,
          si_details: params.si_details,
        },
        {
          responseHandler: async (bolt) => {
            try {
              const r = bolt.response ?? {};
              const txnStatus = (r.txnStatus ?? "").toUpperCase();
              if (r.status === "success" && txnStatus !== "CANCEL") {
                try {
                  await verifyPayUPayment({
                    data: {
                      planKey,
                      voucherCode,
                      txnid:       r.txnid,
                      status:      r.status,
                      amount:      r.amount,
                      productinfo: r.productinfo,
                      firstname:   r.firstname,
                      email:       r.email,
                      mihpayid:    r.mihpayid ?? "",
                      hash:        r.hash,
                      subId:       r.sub_id ?? r.subId ?? "",
                    },
                  });
                  toast.success(
                    "Plan activated! Welcome to " +
                    planKey.charAt(0).toUpperCase() + planKey.slice(1).replace("_", " ") + "."
                  );
                  setAppliedVoucher(null);
                  queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
                } catch (e: any) {
                  toast.error(e?.message ?? "Verification failed. Contact support.");
                }
              } else if (txnStatus === "CANCEL") {
                toast.info("Payment cancelled.");
              } else if (r.status === "failure" || txnStatus === "FAILED") {
                toast.error("Payment failed. Please try again.");
              } else {
                toast.info("Payment was not completed.");
              }
            } finally {
              setPaying(null);
            }
          },
          catchException: onBoltException,
          catchExceptionHandler: onBoltException,
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
        <h1 className="text-3xl font-semibold tracking-tight">Simple, doctor-friendly pricing</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Choose the plan that works for your practice. Upgrade when it grows.
        </p>
      </div>

      {/* Current plan banner */}
      {!isLoading && sub && (
        <div className={`mb-6 rounded-xl border p-4 flex items-center justify-between ${
          isPaid ? "bg-primary/5 border-primary/30" : "bg-muted/40 border-border"
        }`}>
          <div>
            <p className="font-semibold text-sm">
              {isPaid
                ? `You're on ${(sub?.plans as any)?.display_name ?? sub?.plan}`
                : "You're on the Free (Starter) plan"}
            </p>
            {isPaid && sub?.plan_expires_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Active until {new Date(sub.plan_expires_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            )}
            {!isPaid && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {sub?.generations_used ?? 0} / 10 posts used this month
              </p>
            )}
          </div>
          {isPaid && <Badge className="bg-primary text-primary-foreground">Active</Badge>}
        </div>
      )}

      {/* Voucher input */}
      <div className="mb-8 rounded-xl border bg-card p-4">
        {appliedVoucher ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                <span className="font-mono">{appliedVoucher.code}</span> applied —{" "}
                {appliedVoucher.discountPercentage}% off on{" "}
                {appliedVoucher.applicablePlans.join(", ")}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearVoucher} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Have a voucher code? Enter here"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleApplyVoucher()}
              className="font-mono"
            />
            <Button
              variant="outline"
              onClick={handleApplyVoucher}
              disabled={applyingVoucher || !voucherInput.trim()}
              className="shrink-0"
            >
              {applyingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-5 items-stretch">
        {PLANS.map((plan) => {
          const Icon      = plan.icon;
          const isCurrent = currentPlanName === plan.key;
          const isPaying  = payingPlan === plan.key;
          const pricing   = getDiscountedPrice(plan);

          return (
            <div key={plan.key} className="relative flex flex-col">
              {plan.popular && !isCurrent && (
                <Badge className="absolute -top-3 left-6 z-10 border-transparent bg-primary text-primary-foreground">
                  Most popular
                </Badge>
              )}
              {isCurrent && (
                <Badge className="absolute -top-3 right-6 z-10 border-transparent bg-success/10 text-success">
                  Current plan
                </Badge>
              )}

              <SpotlightCard
                active={plan.popular}
                className={cn(
                  "p-7 transition-transform duration-200 hover:-translate-y-1.5 flex flex-col h-full",
                  plan.popular && "ring-1 ring-primary/40",
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl grid place-items-center mb-4",
                    plan.popular ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>

                <div className="flex items-baseline gap-2 mt-2">
                  {plan.free ? (
                    <span className="text-3xl font-semibold tracking-tight">Free</span>
                  ) : pricing.discounted ? (
                    <>
                      <span className="text-3xl font-semibold tracking-tight text-primary">
                        {formatPrice(Math.round(pricing.final))}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(pricing.original)}
                      </span>
                      <Badge className="border-transparent bg-success/10 text-success text-xs">
                        {appliedVoucher!.discountPercentage}% off
                      </Badge>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-semibold tracking-tight">{formatPrice(plan.price)}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </>
                  )}
                </div>
                {!plan.free && pricing.discounted && (
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                )}
                <p className="text-sm text-primary mt-1.5 font-medium">{plan.gens}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{plan.description}</p>

                <ul className="space-y-2.5 text-sm mt-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent || plan.free ? (
                  <Button variant="outline" className="w-full mt-7" disabled>
                    {plan.free && !isCurrent ? "Free Plan" : "Current Plan"}
                  </Button>
                ) : (
                  <Button
                    className={cn(
                      "w-full mt-7 gap-2 transition-transform duration-200",
                      plan.popular &&
                        "shadow-[0_10px_30px_-10px_color-mix(in_oklch,var(--color-primary)_60%,transparent)] hover:shadow-[0_14px_36px_-8px_color-mix(in_oklch,var(--color-primary)_70%,transparent)]",
                    )}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={!!payingPlan || isLoading}
                  >
                    {isPaying ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      `Upgrade to ${plan.name} — ${formatPrice(Math.round(pricing.final))}`
                    )}
                  </Button>
                )}
              </SpotlightCard>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        All new accounts start on the free Starter plan with 10 posts/month.
        Paid plans activate immediately after payment.
      </p>
    </div>
  );
}