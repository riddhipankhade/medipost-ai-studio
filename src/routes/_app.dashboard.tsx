import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, History, ArrowRight } from "lucide-react";
import { sampleContent } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Medipost AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const used = 87;
  const total = 300;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-3xl font-semibold tracking-tight">Dr. Rhea Patel 👋</h1>
          <p className="text-muted-foreground mt-1">Let's create something your patients will love today.</p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link to="/generate"><Sparkles className="h-4 w-4" /> New Generation</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold">Pro</span>
              <Badge className="bg-[color:var(--teal)] text-white hover:bg-[color:var(--teal)]">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Renews on 12 Jul 2026 · ₹1,999/mo</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Generations Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{total - used}</span>
              <span className="text-sm text-muted-foreground">/ {total}</span>
            </div>
            <Progress value={((total - used) / total) * 100} className="mt-3" />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Content this month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{used}</span>
              <span className="text-sm text-[color:var(--teal)]">+12% vs last month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Across Instagram, Education & Blogs</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Quick actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <QuickAction to="/generate" icon={Sparkles} title="Generate Instagram post" desc="Engaging post in under 30 seconds" />
          <QuickAction to="/generate" icon={FileText} title="Patient education sheet" desc="Clear, friendly handout for your clinic" />
          <QuickAction to="/history" icon={History} title="Browse past content" desc="Reuse and repurpose anytime" />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent content</h2>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link to="/history">View all <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </div>
        <div className="grid gap-3">
          {sampleContent.slice(0, 3).map((c) => (
            <Card key={c.id} className="border-border/60 hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px]">{c.type}</Badge>
                    <span className="text-xs text-muted-foreground">{c.specialty}</span>
                  </div>
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{c.body.split("\n")[0]}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) {
  return (
    <Link to={to} className="group rounded-xl border border-border bg-card p-5 hover:border-[color:var(--teal)] transition-colors block">
      <div className="h-10 w-10 grid place-items-center rounded-lg bg-accent text-accent-foreground mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}