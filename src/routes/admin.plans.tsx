import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getRequestHeader } from "@tanstack/react-start/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin/plans")({
  head: () => ({ meta: [{ title: "Subscription Plans — Admin" }] }),
  component: AdminPlans,
});

// ── Server helpers ─────────────────────────────────────────────────────────────

function getSupabase() {
  const cookieHeader = getRequestHeader("cookie") ?? "";
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(cookieHeader)
            .filter((c) => c.value !== undefined)
            .map((c) => ({ name: c.name, value: c.value as string }));
        },
        setAll() {},
      },
    }
  );
}

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function assertAdmin(supabase: ReturnType<typeof getSupabase>, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role !== "admin") throw new Error("Admin access required.");
}

// ── Server functions ───────────────────────────────────────────────────────────

type Plan = {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  ai_generations_limit: number;
  is_active: boolean;
  userCount: number;
};

export const getPlans = createServerFn({ method: "GET" }).handler(async (): Promise<Plan[]> => {
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  await assertAdmin(supabase, user.id);

  const admin = getSupabaseAdmin();

  const { data: plans } = await admin
    .from("plans")
    .select("id, name, display_name, price_monthly, price_yearly, ai_generations_limit, is_active")
    .order("price_monthly", { ascending: true });

  const result = await Promise.all(
    (plans ?? []).map(async (p) => {
      const { count } = await admin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("plan_id", p.id)
        .eq("status", "active");
      return { ...p, userCount: count ?? 0 };
    })
  );

  return result;
});

export const deletePlan = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { id: string })
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized");
    await assertAdmin(supabase, user.id);

    const admin = getSupabaseAdmin();
    const { error: err } = await admin.from("plans").delete().eq("id", data.id);
    if (err) throw new Error(err.message);
    return { success: true };
  });

export const upsertPlan = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as {
    id?: string;
    name: string;
    display_name: string;
    price_monthly: number;
    price_yearly: number;
    ai_generations_limit: number;
  })
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized");
    await assertAdmin(supabase, user.id);

    const admin = getSupabaseAdmin();

    if (data.id) {
      const { error: err } = await admin
        .from("plans")
        .update({
          name:                 data.name.toLowerCase().trim(),
          display_name:         data.display_name.trim(),
          price_monthly:        data.price_monthly,
          price_yearly:         data.price_yearly,
          ai_generations_limit: data.ai_generations_limit,
        })
        .eq("id", data.id);
      if (err) throw new Error(err.message);
    } else {
      const { error: err } = await admin
        .from("plans")
        .insert({
          name:                 data.name.toLowerCase().trim(),
          display_name:         data.display_name.trim(),
          price_monthly:        data.price_monthly,
          price_yearly:         data.price_yearly,
          ai_generations_limit: data.ai_generations_limit,
        });
      if (err) throw new Error(err.message);
    }

    return { success: true };
  });

// ── Types ──────────────────────────────────────────────────────────────────────

type FormState = {
  id?: string;
  name: string;
  display_name: string;
  price_monthly: string;
  price_yearly: string;
  ai_generations_limit: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  display_name: "",
  price_monthly: "",
  price_yearly: "",
  ai_generations_limit: "",
};

// ── Component ──────────────────────────────────────────────────────────────────

function AdminPlans() {
  const [plans,     setPlans]     = useState<Plan[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [open,      setOpen]      = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form,      setForm]      = useState<FormState>(EMPTY_FORM);

  async function load() {
    setLoading(true);
    try {
      const data = await getPlans();
      setPlans(data);
    } catch {
      setError("Failed to load plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  }

  function openEdit(p: Plan) {
    setForm({
      id:                   p.id,
      name:                 p.name,
      display_name:         p.display_name,
      price_monthly:        String(p.price_monthly),
      price_yearly:         String(p.price_yearly),
      ai_generations_limit: String(p.ai_generations_limit),
    });
    setError(null);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deletePlan({ data: { id } });
      setConfirmId(null);
      await load();
    } catch (e: any) {
      setError(e.message ?? "Delete failed.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSave() {
    if (!form.display_name.trim() || !form.name.trim()) {
      setError("Name and display name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertPlan({
        data: {
          id:                   form.id,
          name:                 form.name,
          display_name:         form.display_name,
          price_monthly:        Number(form.price_monthly) || 0,
          price_yearly:         Number(form.price_yearly)  || 0,
          ai_generations_limit: Number(form.ai_generations_limit) || 10,
        },
      });
      setOpen(false);
      await load();
    } catch (e: any) {
      setError(e.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Subscription Plans</h1>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> New plan
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <Card key={p.id} className="border-border/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.display_name}</CardTitle>
                    <Badge variant="secondary">{p.userCount} users</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-semibold">
                    {p.price_monthly === 0 ? "Free" : `₹${p.price_monthly.toLocaleString("en-IN")} / mo`}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>· {p.ai_generations_limit} generations / mo</li>
                    {p.price_yearly > 0 && (
                      <li>· ₹{p.price_yearly.toLocaleString("en-IN")} / yr</li>
                    )}
                  </ul>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(p)}
                    >
                      Edit plan
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmId(p.id)}
                      disabled={deleting === p.id}
                    >
                      {deleting === p.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete plan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the plan. Users already on this plan won't be affected, but no new signups can use it.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => confirmId && handleDelete(confirmId)}
              disabled={!!deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / New plan dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit plan" : "New plan"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Internal name</Label>
                <Input
                  placeholder="pro"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Display name</Label>
                <Input
                  placeholder="Pro"
                  value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Monthly price (₹)</Label>
                <Input
                  type="number"
                  placeholder="1999"
                  value={form.price_monthly}
                  onChange={(e) => setForm((f) => ({ ...f, price_monthly: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Yearly price (₹)</Label>
                <Input
                  type="number"
                  placeholder="19990"
                  value={form.price_yearly}
                  onChange={(e) => setForm((f) => ({ ...f, price_yearly: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Generations / month</Label>
              <Input
                type="number"
                placeholder="100"
                value={form.ai_generations_limit}
                onChange={(e) => setForm((f) => ({ ...f, ai_generations_limit: e.target.value }))}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}