import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Zap, Crown, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/subscription")({
  head: () => ({ meta: [{ title: "Subscription — Medipost AI" }] }),
  component: Subscription,
});

// ── Types ────────────────────────────────────────────────────────────────────

type PlanRow = {
  name:                string;
  display_name:        string;
  ai_generations_limit:number;
  price_monthly:       number;
};

type SubInfo = {
  status:              string;
  billing_cycle:       string;
  current_period_end:  string | null;
  plan:                PlanRow;
};

type Credits = {
  generations_used:     number;
  ai_generations_limit: number;
  credits_remaining:    number;
};

// ── Static upgrade plan cards ────────────────────────────────────────────────

const UPGRADE_PLANS = [
  {
    key:       "starter",
    name:      "Starter",
    icon:      Zap,
    price:     "₹499",
    gens:      "50 generations / month",
    highlight: false,
    features:  ["All content types", "Copy & save", "Email support"],
  },
  {
    key:       "pro",
    name:      "Pro",
    icon:      Crown,
    price:     "₹1,999",
    gens:      "300 generations / month",
    highlight: true,
    features:  [
      "Everything in Starter",
      "Priority generation",
      "Content history & search",
      "Brand tone presets",
    ],
  },
  {
    key:       "clinic",
    name:      "Clinic",
    icon:      Building2,
    price:     "₹6,999",
    gens:      "Unlimited generations",
    highlight: false,
    features:  [
      "Everything in Pro",
      "Up to 10 doctor seats",
      "Team library",
      "Dedicated success manager",
    ],
  },
] satisfies {
  key: string;
  name: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  price: string;
  gens: string;
  highlight: boolean;
  features: string[];
}[];

// ── Component ────────────────────────────────────────────────────────────────

function Subscription() {
  const [sub,     setSub]     = useState<SubInfo | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not signed in.");
        setLoading(false);
        return;
      }

      // Fetch subscription + plan in one join
      const { data: subData, error: subErr } = await supabase
        .from("subscriptions")
        .select(
          "status, billing_cycle, current_period_end, " +
          "plan:plan_id(name, display_name, ai_generations_limit, price_monthly)"
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Fetch credits via RPC
      const { data: creditData, error: creditErr } = await supabase
        .rpc("get_credits", { p_user_id: user.id })
        .single();

      if (cancelled) return;

      if (subErr) {
        setError("Could not load subscription: " + subErr.message);
      } else {
        setSub(subData as unknown as SubInfo);
      }

      if (!creditErr && creditData) {
        setCredits(creditData as unknown as Credits);
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const usedPct = credits
    ? Math.min(
        Math.round((credits.generations_used / credits.ai_generations_limit) * 100),
        100
      )
    : 0;

  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  // Which upgrade plan key matches the current plan? Mark it as "current".
  const currentPlanKey = sub?.plan?.name?.toLowerCase() ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Your current plan and usage at a glance.
        </p>
      </div>

      {/* ── Current Plan + Credits ───────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your plan…
            </div>
          )}

          {!loading && error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          {!loading && !error && sub && (
            <div className="space-y-5">
              {/* Plan name + status */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[color:var(--teal)]" />
                  <span className="text-xl font-semibold">
                    {sub.plan?.display_name ?? sub.plan?.name ?? "—"}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="capitalize"
                >
                  {sub.status}
                </Badge>
                {sub.billing_cycle && (
                  <Badge variant="outline" className="capitalize">
                    {sub.billing_cycle}
                  </Badge>
                )}
                {periodEnd && (
                  <span className="text-sm text-muted-foreground">
                    Renews {periodEnd}
                  </span>
                )}
              </div>

              {/* Credit usage bar */}
              {credits && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">AI Generations</span>
                    <span className="font-medium">
                      {credits.generations_used} / {credits.ai_generations_limit}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[color:var(--teal)] transition-all"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {credits.credits_remaining} generation
                    {credits.credits_remaining !== 1 ? "s" : ""} remaining this period
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Upgrade Plans ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {UPGRADE_PLANS.map((p) => {
            const isCurrent = currentPlanKey === p.key;
            const Icon = p.icon;
            return (
              <div key={p.key} className="relative">
                {p.highlight && (
                  <div className="absolute -inset-1.5 rounded-[1.5rem] bg-gradient-to-r from-[color:var(--teal)]/50 via-[color:var(--teal)]/20 to-[color:var(--teal)]/50 blur-xl opacity-60 animate-card-glow -z-10" />
                )}
                {p.highlight && (
                  <Badge className="absolute -top-3 left-5 z-10 overflow-hidden bg-[color:var(--teal)] text-white hover:bg-[color:var(--teal)]">
                    Most popular
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    />
                  </Badge>
                )}
                <Card
                  className={cn(
                    "relative border-border/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg",
                    p.highlight && "ring-2 ring-[color:var(--teal)] shadow-lg",
                  )}
                >
                  <CardContent className="p-6 space-y-5">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl grid place-items-center",
                        p.highlight ? "bg-[color:var(--teal)] text-white" : "bg-[color:var(--teal)]/10 text-[color:var(--teal)]",
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{p.name}</p>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-semibold">{p.price}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      <p className="text-sm text-[color:var(--teal)] mt-1">{p.gens}</p>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check className="h-4 w-4 text-[color:var(--teal)] mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={cn(
                        "w-full transition-transform duration-200",
                        p.highlight && !isCurrent && "shadow-[0_10px_30px_-10px_oklch(0.58_0.1_199_/_0.6)] hover:shadow-[0_14px_36px_-8px_oklch(0.58_0.1_199_/_0.7)]",
                      )}
                      variant={isCurrent ? "outline" : "default"}
                      disabled={isCurrent}
                      onClick={() =>
                        toast.info(`Payment coming soon — contact us to upgrade to ${p.name}`)
                      }
                    >
                      {isCurrent ? "Current plan" : `Upgrade to ${p.name}`}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}