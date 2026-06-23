import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, FileText, History, ArrowRight, PenLine } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/use-subscription";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Medipost AI" }] }),
  component: Dashboard,
});

function statusLabel(status: string | undefined) {
  const map: Record<string, string> = {
    active: "Active",
    trialing: "Trial",
    canceled: "Canceled",
    past_due: "Past due",
  };
  return status ? (map[status] ?? status) : "—";
}

function renewalLine(sub: { status: string; current_period_end: string; billing_cycle: string; plans: { price_monthly: number; price_yearly: number; ai_generations_limit: number } } | undefined) {
  if (!sub) return null;
  if (sub.plans.price_monthly === 0) return "Free plan — no billing";
  if (sub.status === "canceled") return "Subscription canceled";

  const date = new Date(sub.current_period_end).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const price = sub.billing_cycle === "yearly"
    ? `$${sub.plans.price_yearly}/yr`
    : `$${sub.plans.price_monthly}/mo`;
  return `Renews on ${date} · ${price}`;
}

function Dashboard() {
  const { user, profile } = useAuth();
  const { data: sub, isLoading } = useSubscription(user?.id);

  const specialty = user?.user_metadata?.specialty as string | undefined;
  const metaName = (user?.user_metadata?.full_name as string | undefined)?.trim();
  const displayName = profile?.full_name?.trim() || metaName || profile?.email || user?.email || "Doctor";

  const used = sub?.generations_used ?? 0;
  const limit = sub?.plans.ai_generations_limit ?? 10;
  const isUnlimited = limit === -1;
  const remaining = isUnlimited ? null : Math.max(0, limit - used);
  const progressValue = isUnlimited ? 100 : limit > 0 ? ((limit - used) / limit) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Welcome back{specialty ? `, ${specialty}` : ""},
          </p>
          {isLoading ? (
            <Skeleton className="h-9 w-48 mt-1" />
          ) : (
            <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
          )}
          <p className="text-muted-foreground mt-1">
            Let's create something your patients will love today.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link to="/generate"><Sparkles className="h-4 w-4" />New Generation</Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Subscription */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold">
                    {sub?.plans.display_name ?? "Free"}
                  </span>
                  <Badge className="bg-(--teal) text-white hover:bg-(--teal)">
                    {statusLabel(sub?.status)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {renewalLine(sub)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quota */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Generations Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">
                    {isUnlimited ? "∞" : remaining}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {isUnlimited ? "Unlimited" : limit}
                  </span>
                </div>
                <Progress value={progressValue} className="mt-3" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Usage */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Content this period</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{used}</span>
                  <span className="text-sm text-muted-foreground">
                    generation{used !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Resets at end of billing period
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Quick actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <QuickAction to="/generate" icon={Sparkles} title="Generate Instagram post" desc="Engaging post in under 30 seconds" />
          <QuickAction to="/generate" icon={FileText} title="Patient education sheet" desc="Clear, friendly handout for your clinic" />
          <QuickAction to="/history" icon={History} title="Browse past content" desc="Reuse and repurpose anytime" />
        </div>
      </section>

      {/* Recent content — placeholder until generation writes to DB */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent content</h2>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link to="/history">View all <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </div>
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="h-10 w-10 grid place-items-center rounded-lg bg-accent text-accent-foreground">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">No content yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate your first post and it will appear here.
              </p>
            </div>
            <Button asChild size="sm" className="mt-1 gap-2">
              <Link to="/generate"><Sparkles className="h-3.5 w-3.5" />Generate now</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: React.ElementType; title: string; desc: string }) {
  return (
    <Link to={to} className="group rounded-xl border border-border bg-card p-5 hover:border-(--teal) transition-colors block">
      <div className="h-10 w-10 grid place-items-center rounded-lg bg-accent text-accent-foreground mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}
