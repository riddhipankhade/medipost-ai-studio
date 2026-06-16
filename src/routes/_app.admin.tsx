import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, Sparkles, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — Medipost AI" }] }),
  component: Admin,
});

const stats = [
  { label: "Total Users", value: "1,284", delta: "+128 this month", icon: Users },
  { label: "Active Subscriptions", value: "742", delta: "57% conversion", icon: CreditCard },
  { label: "Total Generations", value: "48,310", delta: "+6,420 this week", icon: Sparkles },
  { label: "Revenue Estimate", value: "₹9,84,500", delta: "MRR · ₹11.8L ARR", icon: IndianRupee },
];

const recent = [
  { name: "Dr. Aisha Khan", email: "aisha@smileclinic.in", plan: "Pro", gens: 142, date: "16 Jun" },
  { name: "Dr. Karan Mehta", email: "karan@cardiocare.in", plan: "Clinic", gens: 318, date: "16 Jun" },
  { name: "Dr. Neha Sharma", email: "neha@dermaplus.in", plan: "Starter", gens: 21, date: "15 Jun" },
  { name: "Dr. Vivaan Rao", email: "vivaan@gpcare.in", plan: "Pro", gens: 87, date: "15 Jun" },
  { name: "Dr. Priya Iyer", email: "priya@dentalhub.in", plan: "Pro", gens: 64, date: "14 Jun" },
];

function Admin() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
        <Badge variant="secondary">Sample data</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
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
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="grid grid-cols-12 px-5 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <div className="col-span-5">Doctor</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-3">Generations</div>
              <div className="col-span-2 text-right">Last active</div>
            </div>
            {recent.map((r) => (
              <div key={r.email} className="grid grid-cols-12 items-center px-5 py-3 text-sm">
                <div className="col-span-5 min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                </div>
                <div className="col-span-2">
                  <Badge variant={r.plan === "Clinic" ? "default" : "secondary"}>{r.plan}</Badge>
                </div>
                <div className="col-span-3 text-muted-foreground">{r.gens}</div>
                <div className="col-span-2 text-right text-muted-foreground">{r.date}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}