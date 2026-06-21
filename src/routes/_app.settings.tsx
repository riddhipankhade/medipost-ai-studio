import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Medipost AI" }] }),
  component: Settings,
});

function Settings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Full name</Label><Input defaultValue="Dr. Rhea Patel" /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue="dr.rhea@medipost.ai" /></div>
          <div className="space-y-2"><Label>Clinic</Label><Input defaultValue="Patel Dental Studio" /></div>
          <Button>Save changes</Button>
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          Email me when new content templates are added, weekly engagement reports, and platform updates.
        </CardContent>
      </Card>
    </div>
  );
}