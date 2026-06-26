import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Medipost AI" }] }),
  component: Settings,
});

function Settings() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [clinic, setClinic]     = useState("");
  const [origEmail, setOrigEmail] = useState("");

  // ── Load current user data on mount ────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Name from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Clinic from brand_kits table
      const { data: brand } = await supabase
        .from("brand_kits")
        .select("clinic_name")
        .eq("user_id", user.id)
        .single();

      setName((profile as any)?.full_name ?? "");
      setEmail(user.email ?? "");
      setOrigEmail(user.email ?? "");
      setClinic((brand as any)?.clinic_name ?? "");
      setLoading(false);
    }
    load();
  }, []);

  // ── Save handler ────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Update full_name in profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: name.trim() })
        .eq("id", user.id);
      if (profileError) throw profileError;

      // 2. Update clinic_name in brand_kits (upsert in case row doesn't exist yet)
      const { error: brandError } = await supabase
        .from("brand_kits")
        .upsert({ user_id: user.id, clinic_name: clinic.trim() }, { onConflict: "user_id" });
      if (brandError) throw brandError;

      // 3. Update email only if changed — triggers confirmation email
      if (email.trim() !== origEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailError) throw emailError;
        toast.success("Confirmation email sent", {
          description: "Check your new inbox to confirm the email change.",
        });
      } else {
        toast.success("Profile saved");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error("Could not save", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                  <div className="h-9 w-full rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Your Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                />
                {email !== origEmail && (
                  <p className="text-xs text-muted-foreground">
                    A confirmation link will be sent to the new address.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinic">Clinic name</Label>
                <Input
                  id="clinic"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  placeholder="Your Clinic Name"
                />
                <p className="text-xs text-muted-foreground">
                  Also editable in Brand Kit — changes here sync there.
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || (!name.trim() && !email.trim())}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          Email me when new content templates are added, weekly engagement
          reports, and platform updates.
        </CardContent>
      </Card>
    </div>
  );
}