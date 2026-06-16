import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/subscription")({
  head: () => ({ meta: [{ title: "Subscription — Medipost AI" }] }),
  component: Subscription,
});

const plans = [
  {
    name: "Starter",
    price: "₹499",
    gens: "50 generations / month",
    features: ["All content types", "Copy & save", "Email support"],
    current: false,
  },
  {
    name: "Pro",
    price: "₹1,999",
    gens: "300 generations / month",
    features: ["Everything in Starter", "Priority generation", "Content history & search", "Brand tone presets"],
    current: true,
    highlight: true,
  },
  {
    name: "Clinic",
    price: "₹6,999",
    gens: "Unlimited generations",
    features: ["Everything in Pro", "Up to 10 doctor seats", "Team library", "Dedicated success manager"],
    current: false,
  },
];

function Subscription() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-1">Choose the plan that fits your practice.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={`relative border-border/60 ${p.highlight ? "ring-2 ring-[color:var(--teal)]" : ""}`}>
            {p.highlight && (
              <Badge className="absolute -top-3 left-5 bg-[color:var(--teal)] text-white hover:bg-[color:var(--teal)]">Most popular</Badge>
            )}
            <CardContent className="p-6 space-y-5">
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
                  <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-[color:var(--teal)] mt-0.5" />{f}</li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={p.current ? "outline" : "default"}
                disabled={p.current}
                onClick={() => toast.success(`Upgraded to ${p.name} (demo)`) }
              >
                {p.current ? "Current plan" : `Upgrade to ${p.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}