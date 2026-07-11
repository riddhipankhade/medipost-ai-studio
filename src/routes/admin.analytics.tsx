import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { getContentAnalytics } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Content Analytics — Admin" }] }),
  component: AdminAnalytics,
});

type Analytics = Awaited<ReturnType<typeof getContentAnalytics>>;

function AdminAnalytics() {
  const [data,    setData]    = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContentAnalytics().then((d) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Content Analytics</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/60">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Total generated</p>
                  <p className="text-2xl font-semibold mt-2">
                    {data?.totalAllTime.toLocaleString() ?? "0"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">This week</p>
                  <p className="text-2xl font-semibold mt-2">
                    {data?.thisWeek.toLocaleString() ?? "0"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Avg / user</p>
                  <p className="text-2xl font-semibold mt-2">{data?.avgPerUser ?? "0"}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Breakdown by content type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.byType ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No content generated yet.
                  </p>
                ) : (
                  (data?.byType ?? []).map((b) => (
                    <div key={b.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize">{b.label}</span>
                        <span className="text-muted-foreground">
                          {b.value.toLocaleString()} · {b.pct}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-[color:var(--teal)]"
                          style={{ width: `${b.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminShell>
  );
}