import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin/plans")({
  head: () => ({ meta: [{ title: "Subscription Plans — Admin" }] }),
  component: AdminPlans,
});

const plans = [
  { name: "Starter", price: "₹0", users: 412, features: ["10 generations / mo", "Basic templates"] },
  { name: "Pro", price: "₹1,499 / mo", users: 587, features: ["Unlimited generations", "Brand kit", "AI visuals"] },
  { name: "Clinic", price: "₹4,999 / mo", users: 155, features: ["5 seats", "Priority support", "Custom branding"] },
];

function AdminPlans() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Subscription Plans</h1>
          <Button>New plan</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.name} className="border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <Badge variant="secondary">{p.users} users</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-semibold">{p.price}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {p.features.map((f) => <li key={f}>· {f}</li>)}
                </ul>
                <Button variant="outline" size="sm" className="w-full">Edit plan</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}