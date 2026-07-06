import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Zap, Crown, Loader2, Image, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPayUHash, verifyPayUPayment } from "@/lib/api/payment.functions";
import { useSubscription } from "@/lib/use-subscription";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/pricing")({
  component: PricingPage,
});

// ── PayU Bolt type declaration ────────────────────────────────────────────────
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

// ── Load PayU Bolt SDK dynamically ────────────────────────────────────────────
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

// ── Plan feature lists ────────────────────────────────────────────────────────
const FREE_FEATURES = [
  "10 posts per month",
  "All post types (Single, Carousel, Story, Reel, Campaign)",
  "Hashtag generation",
  "Brand kit",
  "Content history",
];

const PRO_FEATURES = [
  "Unlimited posts per month",
  "All post types",
  "AI Visual generation (Flux)",
  "Hashtag generation",
  "Brand kit",
  "Content history",
  "Priority generation",
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

function PricingPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);

  // Get current user + subscription
  const [userId, setUserId] = useState<string | undefined>(undefined);
  useState(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  });

  const { data: sub, isLoading: loadingSub } = useSubscription(userId);

  const isPro = sub?.plan === "pro"
    && !!sub?.plan_expires_at
    && new Date(sub.plan_expires_at) > new Date();

  async function handleUpgrade() {
    setPaying(true);
    try {
      // 1. Get hash from server (amount is enforced server-side — not sent from client)
      const params = await createPayUHash({ data: { planKey: "payu_pro" } });

      // 2. Load Bolt SDK
      await loadBoltScript();

      if (!window.bolt) throw new Error("PayU Bolt SDK not available. Please try again.");

      const SURL = `${window.location.origin}/payment/success`;
      const FURL = `${window.location.origin}/payment/failure`;

      // 3. Launch PayU checkout modal
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
          surl:        SURL,
          furl:        FURL,
          udf1: "", udf2: "", udf3: "", udf4: "", udf5: "",
        },
        {
          responseHandler: async (bolt) => {
            const r = bolt.response;
            if (r.status === "success") {
              try {
                // 4. Verify payment server-side
                await verifyPayUPayment({
                  data: {
                    planKey:     "payu_pro",
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
                toast.success("🎉 Welcome to Pro! Your plan is now active.");
                // Invalidate subscription cache so UI updates immediately
                queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
              } catch (verifyErr: any) {
                toast.error(verifyErr?.message ?? "Verification failed. Contact support.");
              }
            } else if (r.status === "failure") {
              toast.error("Payment failed. Please try again.");
            } else {
              toast.info("Payment cancelled.");
            }
            setPaying(false);
          },
          catchExceptionHandler: (bolt) => {
            toast.error(bolt.message ?? "Payment error. Please try again.");
            setPaying(false);
          },
        }
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Could not initiate payment. Please try again.");
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-lg">
            Start free. Upgrade when you need unlimited posts and AI visuals.
          </p>
        </div>

        {/* Current plan banner */}
        {!loadingSub && sub && (
          <div className={`mb-8 rounded-xl border p-4 flex items-center justify-between ${
            isPro ? "bg-primary/5 border-primary/30" : "bg-muted/40 border-border"
          }`}>
            <div className="flex items-center gap-3">
              {isPro ? <Crown className="h-5 w-5 text-primary" /> : <Zap className="h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="font-semibold text-sm">
                  {isPro ? "You're on Pro" : "You're on Free"}
                </p>
                {isPro && sub?.plan_expires_at && (
                  <p className="text-xs text-muted-foreground">
                    Renews on {new Date(sub.plan_expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {!isPro && (
                  <p className="text-xs text-muted-foreground">
                    {sub?.generations_used ?? 0} / 10 posts used this month
                  </p>
                )}
              </div>
            </div>
            {isPro && (
              <Badge className="bg-primary text-primary-foreground">Active</Badge>
            )}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Free plan */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-bold">Free</h2>
                {!isPro && <Badge variant="secondary">Current</Badge>}
              </div>
              <div className="mt-3">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-muted-foreground ml-1">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Perfect to try Medipost and create your first posts.
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button variant="outline" className="w-full" disabled>
              {!isPro ? "Current plan" : "Downgrade"}
            </Button>
          </div>

          {/* Pro plan */}
          <div className="rounded-2xl border-2 border-primary bg-card p-8 relative overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
              MOST POPULAR
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Pro</h2>
                {isPro && <Badge className="bg-primary text-primary-foreground">Active</Badge>}
              </div>
              <div className="mt-3">
                <span className="text-4xl font-bold">₹499</span>
                <span className="text-muted-foreground ml-1">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                For doctors and clinics who post consistently.
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="font-medium">{f}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <Button className="w-full" variant="outline" disabled>
                <Crown className="h-4 w-4 mr-2" /> Pro Active
              </Button>
            ) : (
              <Button
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleUpgrade}
                disabled={paying || loadingSub}
                size="lg"
              >
                {paying
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                  : <><Crown className="h-4 w-4" /> Upgrade to Pro — ₹499</>}
              </Button>
            )}
          </div>
        </div>

        {/* Feature comparison strip */}
        <div className="mt-12 rounded-2xl border bg-muted/30 p-6">
          <h3 className="font-semibold text-center mb-6">What's included in Pro</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-background border">
              <FileText className="h-6 w-6 text-primary" />
              <p className="font-medium text-sm">Unlimited Posts</p>
              <p className="text-xs text-muted-foreground">Generate as many posts as you need, every month</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-background border">
              <Image className="h-6 w-6 text-primary" />
              <p className="font-medium text-sm">AI Visuals</p>
              <p className="text-xs text-muted-foreground">Generate custom healthcare images with Flux AI</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-background border">
              <Calendar className="h-6 w-6 text-primary" />
              <p className="font-medium text-sm">30-Day Access</p>
              <p className="text-xs text-muted-foreground">One payment = 30 days of full Pro access</p>
            </div>
          </div>
        </div>

        {/* Back to app */}
        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => navigate({ to: "/generate" })}>
            ← Back to Generate
          </Button>
        </div>
      </div>
    </div>
  );
}