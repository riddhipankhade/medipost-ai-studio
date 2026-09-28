import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RotateCcw, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Medipost AI" }] }),
  component: Settings,
});

function Settings() {
  const { resetOnboarding } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [clinic, setClinic]     = useState("");
  const [origEmail, setOrigEmail] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting]                 = useState(false);

  // ── Load current user data on mount ────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

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

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: name.trim() })
        .eq("id", user.id);
      if (profileError) throw profileError;

      const { error: brandError } = await supabase
        .from("brand_kits")
        .upsert({ user_id: user.id, clinic_name: clinic.trim() }, { onConflict: "user_id" });
      if (brandError) throw brandError;

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
      const msg = (err as any)?.message ?? (err as any)?.error_description ?? JSON.stringify(err) ?? "Save failed";
      toast.error("Could not save", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  // ── Delete account handler ──────────────────────────────────────────────────
  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      await supabase.auth.signOut();
      navigate({ to: "/", replace: true });
    } catch (err: any) {
      toast.error("Could not delete account", {
        description: err?.message ?? "Please contact support.",
      });
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  async function handleReplayTour() {
    await resetOnboarding();
    navigate({ to: "/dashboard" });
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

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Help &amp; documentation</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex gap-1.5 shrink-0"
            onClick={handleReplayTour}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Replay tour
          </Button>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is">
              <AccordionTrigger>What is Medipost AI?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Medipost AI is a content studio built for clinicians and clinics. It turns a topic
                and a few clicks into patient-ready social posts, education handouts, and
                articles — written in your specialty's voice and using your Brand Kit.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="content-studio">
              <AccordionTrigger>What can I generate in Content Studio?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-1.5">
                <p><strong>Single Post</strong> — one scroll-stopping Instagram post.</p>
                <p><strong>Carousel Post</strong> — a 2–10 slide swipeable post.</p>
                <p><strong>Story</strong> — a 9:16 vertical story graphic.</p>
                <p><strong>Reel Script</strong> — a hook, key points, and a call to action.</p>
                <p><strong>Awareness Campaign</strong> — a full week's content plan at once.</p>
                <p><strong>Festive Wishes</strong> — greetings for any occasion.</p>
                <p><strong>Template Post</strong> — ready-made promo designs (Growth plan and above).</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="brand-kit">
              <AccordionTrigger>How does Brand Kit work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Set your clinic name, logo, colors, and contact details once in{" "}
                <strong>Brand Kit</strong> — every generation afterwards applies them
                automatically, so you don't re-enter clinic details each time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="credits">
              <AccordionTrigger>How do credits and plans work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Each generation uses one credit from your monthly allowance, shown on the
                Dashboard and reset on your billing cycle. You can see your plan, usage, and
                renewal date under <strong>Subscription</strong>, and upgrade anytime for a
                higher monthly limit or extra features. If you haven't already, Growth offers
                a 7-day trial for ₹1 — it auto-renews at ₹499/month. Use the{" "}
                <strong>Cancel Subscription</strong> button on the Subscription page anytime
                before your next billing date to stop auto-renewal — you'll keep access until
                the current period ends, then move to the Free plan automatically.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="history">
              <AccordionTrigger>Where do my past generations go?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Every completed generation is saved under <strong>Content History</strong>,
                where you can revisit, reuse, or repurpose it at any time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="support">
              <AccordionTrigger>Still stuck?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Use <strong>Replay tour</strong> above to walk through the dashboard again, or
                reach out to your account contact for help.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !deleting && setDeleteDialogOpen(open)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">
                This will permanently delete your account, all generated content, brand kit, and subscription data.
              </span>
              <span className="block font-medium text-foreground">This cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-col sm:justify-stretch sm:space-x-0 gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full"
            >
              {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : "Yes, delete my account"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}