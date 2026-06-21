import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { setRole } from "@/lib/auth-mock";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — Medipost AI" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-foreground/[0.02] p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Admin Portal</h1>
          <p className="text-sm text-muted-foreground">Restricted access. Authorized personnel only.</p>
        </div>
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Admin email</Label>
              <Input type="email" defaultValue="admin@medipost.ai" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" defaultValue="admin1234" />
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => { setRole("admin"); navigate({ to: "/admin" }); }}
            >
              Sign in to Admin Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}