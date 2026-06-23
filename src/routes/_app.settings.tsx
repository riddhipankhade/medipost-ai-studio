import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Medipost AI" }] }),
  component: Settings,
});

function Settings() {
  const { user, profile, loading } = useAuth();
  const [name, setName] = useState("");

  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
  }, [profile?.full_name]);

  const email = profile?.email ?? user?.email ?? "";

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input
                type="email"
                value={email}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Email is tied to your account and cannot be changed here.
            </p>
          </div>
          <Button disabled>Save changes</Button>
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
