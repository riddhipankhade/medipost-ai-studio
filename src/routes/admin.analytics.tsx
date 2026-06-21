import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Content Analytics — Admin" }] }),
  component: AdminAnalytics,
});

const byType = [
  { label: "Carousel posts", value: 18420, pct: 38 },
  { label: "Awareness posts", value: 11250, pct: 23 },
  { label: "Festive wishes", value: 8930, pct: 18 },
  { label: "Reels scripts", value: 6210, pct: 13 },
  { label: "Stories", value: 3500, pct: 8 },
];

function AdminAnalytics() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Content Analytics</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/60"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total generated</p><p className="text-2xl font-semibold mt-2">48,310</p></CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-5"><p className="text-sm text-muted-foreground">This week</p><p className="text-2xl font-semibold mt-2">6,420</p></CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Avg / user</p><p className="text-2xl font-semibold mt-2">37.6</p></CardContent></Card>
        </div>
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">Breakdown by content type</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {byType.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{b.label}</span>
                  <span className="text-muted-foreground">{b.value.toLocaleString()} · {b.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-[color:var(--teal)]" style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}