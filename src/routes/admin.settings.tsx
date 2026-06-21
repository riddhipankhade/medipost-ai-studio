import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Platform Settings — Admin" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <AdminShell>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Platform Settings</h1>
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Platform name</Label><Input defaultValue="Medipost AI" /></div>
            <div className="space-y-2"><Label>Support email</Label><Input defaultValue="support@medipost.ai" /></div>
            <div className="space-y-2"><Label>Default trial length (days)</Label><Input type="number" defaultValue={14} /></div>
            <Button>Save changes</Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}