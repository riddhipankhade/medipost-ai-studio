import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, History, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  const [name,    setName]    = useState<string>("");
  const [credits, setCredits] = useState<Credits | null>(null);
  const [sub,     setSub]     = useState<SubRow | null>(null);
  const [recent,  setRecent]  = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

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
          .select("status, billing_cycle, current_period_end, plan:plan_id(display_name, price_monthly)")
          .eq("user_id", user.id)
          .eq("status", "active")
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
      setName(profile?.full_name || user.email?.split("@")[0] || "Doctor");

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

  const planName  = sub?.plan?.display_name ?? "—";
  const price     = sub?.plan?.price_monthly;
  const renewDate = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  const greeting = name ? `Dr. ${name}` : "Doctor";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {loading ? "…" : `${greeting} 👋`}
          </h1>
          <p className="text-muted-foreground mt-1">
            Let's create something your patients will love today.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link to="/generate">
            <Sparkles className="h-4 w-4" /> New Generation
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Plan */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold">{planName}</span>
                  <Badge className="bg-[color:var(--teal)] text-white hover:bg-[color:var(--teal)] capitalize">
                    {sub?.status ?? "—"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {renewDate ? `Renews ${renewDate}` : "—"}
                  {price ? ` · ₹${price.toLocaleString("en-IN")}/mo` : ""}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Credits */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Generations Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{remaining}</span>
                  <span className="text-sm text-muted-foreground">/ {total}</span>
                </div>
                <Progress
                  value={total > 0 ? ((remaining / total) * 100) : 0}
                  className="mt-3"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Content this month */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Content this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{used}</span>
                  <span className="text-sm text-[color:var(--teal)]">generations used</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {total - remaining === 0
                    ? "No content generated yet"
                    : `${usedPct}% of your monthly limit used`}
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
          <QuickAction
            to="/generate"
            icon={Sparkles}
            title="Generate Instagram post"
            desc="Engaging post in under 30 seconds"
          />
          <QuickAction
            to="/generate"
            icon={FileText}
            title="Patient education sheet"
            desc="Clear, friendly handout for your clinic"
          />
          <QuickAction
            to="/history"
            icon={History}
            title="Browse past content"
            desc="Reuse and repurpose anytime"
          />
        </div>
      </section>

      {/* Recent content */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent content</h2>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link to="/history">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading recent content…</span>
          </div>
        )}

        {!loading && recent.length === 0 && (
          <Card className="border-border/60 border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No content yet — hit{" "}
              <Link to="/generate" className="text-[color:var(--teal)] font-medium">
                New Generation
              </Link>{" "}
              to get started.
            </CardContent>
          </Card>
        )}

        {!loading && recent.length > 0 && (
          <div className="grid gap-3">
            {recent.map((c) => (
              <Card key={c.id} className="border-border/60 hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {c.workflow_kind}
                      </Badge>
                      {c.specialty && (
                        <span className="text-xs text-muted-foreground">{c.specialty}</span>
                      )}
                    </div>
                    <p className="font-medium truncate">{c.topic}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {bodySnippet(c.generated_text)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bodySnippet(raw: string | null): string {
  if (!raw) return "—";
  try {
    const parsed = JSON.parse(raw);
    const text =
      parsed?.content   ||
      parsed?.greeting  ||
      parsed?.message   ||
      parsed?.hook      ||
      parsed?.objective ||
      raw;
    return String(text).split("\n")[0].slice(0, 120);
  } catch {
    return raw.split("\n")[0].slice(0, 120);
  }
}

function QuickAction({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-card p-5 hover:border-[color:var(--teal)] transition-colors block"
    >
      <div className="h-10 w-10 grid place-items-center rounded-lg bg-accent text-accent-foreground mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}