import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, Sparkles, Activity, Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { getDashboardStats } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Medipost AI" }] }),
  component: AdminDashboard,
});

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;

function AdminDashboard() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      delta: `+${stats.newThisMonth} this month`,
      icon: Users,
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubscriptions.toLocaleString(),
      delta: stats.totalUsers
        ? `${Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)}% conversion`
        : "—",
      icon: CreditCard,
    },
    {
      label: "Total Content Generated",
      value: stats.totalGenerated.toLocaleString(),
      delta: `+${stats.activity24h} today`,
      icon: Sparkles,
    },
    {
      label: "Recent Activity (24h)",
      value: stats.activity24h.toLocaleString(),
      delta: "posts generated",
      icon: Activity,
    },
  ] : [];

  return (
    <AdminShell>
      <div className="space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label} className="border-border/60">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{s.label}</p>
                        <Icon className="h-4 w-4 text-[color:var(--teal)]" />
                      </div>
                      <p className="text-2xl font-semibold mt-2">{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.delta}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Recent signups</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 px-5 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <div className="col-span-5">Doctor</div>
                    <div className="col-span-2">Plan</div>
                    <div className="col-span-3">Generations</div>
                    <div className="col-span-2 text-right">Joined</div>
                  </div>
                  {(stats?.recentActivity ?? []).map((r) => (
                    <div key={r.email} className="grid grid-cols-12 items-center px-5 py-3 text-sm">
                      <div className="col-span-5 min-w-0">
                        <p className="font-medium truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                      </div>
                      <div className="col-span-2">
                        <Badge variant={r.plan === "Pro" ? "default" : "secondary"}>{r.plan}</Badge>
                      </div>
                      <div className="col-span-3 text-muted-foreground">{r.gens}</div>
                      <div className="col-span-2 text-right text-muted-foreground text-xs">
                        {new Date(r.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  ))}
                  {(stats?.recentActivity ?? []).length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">No users yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminShell>
  );
}