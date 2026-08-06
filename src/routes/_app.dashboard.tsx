import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger, StaggerItem, FadeIn } from "@/components/motion";
import { Sparkles, FileText, History, ArrowRight, CreditCard, Gauge } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useIsPro, useGrowthTrialEligible } from "@/lib/use-subscription";
import { GrowthTrialBanner } from "@/components/growth-trial-banner";
import { ProductTour } from "@/components/onboarding/product-tour";
import { dashboardTourSteps } from "@/lib/onboarding-tour";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Medipost AI" }] }),
  component: Dashboard,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Credits = {
  generations_used:     number;
  ai_generations_limit: number;
  credits_remaining:    number;
};

type SubRow = {
  status:             string;
  billing_cycle:      string;
  current_period_end: string | null;
  plan_expires_at:    string | null;
  canceled_at:        string | null;
  plan: {
    display_name:  string;
    price_monthly: number;
  } | null;
};

type RecentItem = {
  id:           string;
  workflow_kind:string;
  specialty:    string;
  topic:        string;
  generated_text: string | null;
  created_at:   string;
};

// ── Component ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const { user, profile, completeOnboarding } = useAuth();
  const isPro         = useIsPro(user?.id);
  const trialEligible = useGrowthTrialEligible(user?.id);
  const [name,    setName]    = useState<string>("");
  const [credits, setCredits] = useState<Credits | null>(null);
  const [sub,     setSub]     = useState<SubRow | null>(null);
  const [recent,  setRecent]  = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!profile || profile.onboarding_completed) return;
    // Mobile visitors skip the tour entirely (it's sidebar-heavy and built for
    // a desktop layout) rather than showing a partial version — onboarding is
    // marked complete outright so it also won't fire later on a bigger screen.
    if (window.innerWidth < 768) {
      completeOnboarding();
    } else {
      setShowTour(true);
    }
  }, [profile, completeOnboarding]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      const [profileRes, creditsRes, subRes, recentRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single(),

        supabase
          .rpc("get_credits", { p_user_id: user.id })
          .single(),

        supabase
          .from("subscriptions")
          .select("status, billing_cycle, current_period_end, plan_expires_at, canceled_at, plan:plan_id(display_name, price_monthly)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),

        supabase
          .from("content_generations")
          .select("id, workflow_kind, specialty, topic, generated_text, created_at")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      if (cancelled) return;

      const profile = profileRes.data as unknown as { full_name: string } | null;
      setName(profile?.full_name || user.email?.split("@")[0] || "Clinician");

      if (creditsRes.data)
        setCredits(creditsRes.data as unknown as Credits);

      if (subRes.data)
        setSub(subRes.data as unknown as SubRow);

      if (recentRes.data)
        setRecent(recentRes.data as unknown as RecentItem[]);

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const used      = credits?.generations_used     ?? 0;
  const total     = credits?.ai_generations_limit ?? 0;
  const remaining = credits?.credits_remaining    ?? 0;
  const usedPct   = total > 0 ? Math.round((used / total) * 100) : 0;

  // canceled_at survives downgrade (kept for audit/churn history — see
  // downgradeToFreePlan), so it alone isn't enough to mean "currently
  // cancelling." Require a still-future plan_expires_at too, same guard the
  // Subscription page uses via isPaid, or a downgraded Free user would show
  // a stale "Cancelling" badge forever.
  const isCancelling =
    !!sub?.canceled_at && !!sub?.plan_expires_at && new Date(sub.plan_expires_at) > new Date();

  // Same reasoning as app-shell.tsx: the free-tier plan_id resolves to a plans
  // row named "Free Trial" in the live DB, not "Free"/"Starter" — only trust
  // the joined display_name for confirmed paid users.
  const planName  = isPro ? (sub?.plan?.display_name ?? "—") : "Starter";
  const price     = sub?.plan?.price_monthly;
  const renewDate = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;
  const cancelsDate = sub?.plan_expires_at
    ? new Date(sub.plan_expires_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  const greeting = name || "Clinician";

  return (
    <div className="space-y-10">
      {showTour && (
        <ProductTour
          steps={dashboardTourSteps}
          onFinish={() => {
            setShowTour(false);
            completeOnboarding();
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-0.5">
            {loading ? <Skeleton className="h-9 w-56" /> : `${greeting} 👋`}
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Let's create something your patients will love today.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2" data-tour="new-generation">
          <Link to="/generate">
            <Sparkles className="h-4 w-4" /> New Generation
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <Stagger className="grid gap-5 md:grid-cols-3">
        {/* Plan */}
        <StaggerItem>
          <Card className="h-full hover:shadow-md transition-shadow duration-200" data-tour="plan-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <CreditCard className="h-5 w-5" strokeWidth={1.9} />
                </div>
                {!loading && (
                  <Badge variant={isCancelling ? "warning" : "success"} className="capitalize">
                    {isCancelling ? "Cancelling" : sub?.status ?? "—"}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-4">Current subscription</p>
              {loading ? (
                <Skeleton className="h-8 w-28 mt-1.5" />
              ) : (
                <span className="text-2xl font-semibold tracking-tight">{planName}</span>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {isCancelling
                  ? cancelsDate ? `Cancels ${cancelsDate} — no further charges` : "Cancels at period end"
                  : renewDate ? `Renews ${renewDate}` : "—"}
                {!isCancelling && price ? ` · ₹${price.toLocaleString("en-IN")}/mo` : ""}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Credits */}
        <StaggerItem>
          <Card className="h-full hover:shadow-md transition-shadow duration-200" data-tour="credits-card">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Gauge className="h-5 w-5" strokeWidth={1.9} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-4">Generations remaining</p>
              {loading ? (
                <Skeleton className="h-8 w-24 mt-1.5" />
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tracking-tight">{remaining}</span>
                  <span className="text-sm text-muted-foreground">/ {total}</span>
                </div>
              )}
              <Progress
                value={loading ? 0 : total > 0 ? (remaining / total) * 100 : 0}
                className="mt-4"
              />
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Content this month */}
        <StaggerItem>
          <Card className="h-full hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <FileText className="h-5 w-5" strokeWidth={1.9} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-4">Content this month</p>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1.5" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight">{used}</span>
                  <span className="text-sm text-primary">generations used</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {total - remaining === 0
                  ? "No content generated yet"
                  : `${usedPct}% of your monthly limit used`}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </Stagger>

      {!loading && !isPro && <GrowthTrialBanner eligible={trialEligible} />}

      {/* Quick actions */}
      <section data-tour="quick-actions">
        <h2 className="text-lg font-semibold mb-4">Quick actions</h2>
        <Stagger className="grid gap-4 md:grid-cols-3">
          <StaggerItem>
            <QuickAction
              to="/generate"
              icon={Sparkles}
              title="Generate Instagram post"
              desc="Engaging post in under 30 seconds"
            />
          </StaggerItem>
          <StaggerItem>
            <QuickAction
              to="/generate"
              icon={FileText}
              title="Patient education sheet"
              desc="Clear, friendly handout for your clinic"
            />
          </StaggerItem>
          <StaggerItem>
            <QuickAction
              to="/history"
              icon={History}
              title="Browse past content"
              desc="Reuse and repurpose anytime"
            />
          </StaggerItem>
        </Stagger>
      </section>

      {/* Recent content */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent content</h2>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link to="/history">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="grid gap-3">
            <Skeleton className="h-18.5 w-full rounded-2xl" />
            <Skeleton className="h-18.5 w-full rounded-2xl" />
            <Skeleton className="h-18.5 w-full rounded-2xl" />
          </div>
        )}

        {!loading && recent.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No content yet — hit{" "}
              <Link to="/generate" className="text-primary font-medium">
                New Generation
              </Link>{" "}
              to get started.
            </CardContent>
          </Card>
        )}

        {!loading && recent.length > 0 && (
          <FadeIn className="grid grid-cols-1 gap-3 min-w-0">
            {recent.map((c) => (
              <Card key={c.id} className="min-w-0 overflow-hidden hover:shadow-md hover:-translate-y-px transition-all duration-200">
                <CardContent className="flex items-center justify-between gap-4 py-4 min-w-0">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {c.workflow_kind}
                      </Badge>
                      {c.specialty && (
                        <span className="text-xs text-muted-foreground">{c.specialty}</span>
                      )}
                    </div>
                    <p className="font-medium truncate">{c.topic}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {bodySnippet(c.generated_text, c.workflow_kind)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </FadeIn>
        )}
      </section>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bodySnippet(raw: string | null, kind: string): string {
  if (!raw) return "—";
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw.split("\n")[0].slice(0, 120);
  }
  const text =
    kind === "carousel" ? (parsed?.slides?.[0]?.content ?? parsed?.title) :
    kind === "festive"  ? parsed?.greeting :
    kind === "story"    ? parsed?.message :
    kind === "reel"     ? parsed?.hook :
    kind === "campaign" ? parsed?.objective :
    kind === "template" ? (parsed?.subline || parsed?.headline) :
    parsed?.content ?? raw;
  return String(text ?? "—").split("\n")[0].slice(0, 120);
}

function QuickAction({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border/70 bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/25 transition-all duration-200 block h-full"
    >
      <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary mb-3.5 transition-transform duration-200 group-hover:scale-105">
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
    </Link>
  );
}