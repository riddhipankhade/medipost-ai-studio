import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import {
  listVouchers,
  createVoucher,
  toggleVoucher,
  deleteVoucher,
} from "@/lib/api/voucher.functions";

export const Route = createFileRoute("/admin/vouchers")({
  component: AdminVouchersPage,
});

const PLAN_OPTIONS = ["starter", "pro", "clinic"] as const;

type Voucher = {
  id: string;
  code: string;
  discount_percentage: number;
  applicable_plans: string[];
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

function AdminVouchersPage() {
  const navigate = useNavigate();

  const [vouchers, setVouchers]   = useState<Voucher[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isAdmin, setIsAdmin]     = useState(false);

  // Create form
  const [code,       setCode]      = useState("");
  const [discount,   setDiscount]  = useState("");
  const [plans,      setPlans]     = useState<string[]>(["starter", "pro", "clinic"]);
  const [maxUses,    setMaxUses]   = useState("");
  const [expiresAt,  setExpiresAt] = useState("");
  const [creating,   setCreating]  = useState(false);

  // Gate: redirect if not admin
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user?.user_metadata?.is_admin) {
        navigate({ to: "/" });
        return;
      }
      setIsAdmin(true);
      loadVouchers();
    });
  }, []);

  async function loadVouchers() {
    setLoading(true);
    try {
      const data = await listVouchers();
      setVouchers(data as Voucher[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load vouchers.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (plans.length === 0) { toast.error("Select at least one plan."); return; }
    setCreating(true);
    try {
      await createVoucher({
        data: {
          code,
          discountPercentage: Number(discount),
          applicablePlans: plans as ("starter" | "pro" | "clinic")[],
          maxUses:   maxUses   ? Number(maxUses)  : null,
          expiresAt: expiresAt ? expiresAt        : null,
        },
      });
      toast.success(`Voucher "${code.toUpperCase()}" created!`);
      setCode(""); setDiscount(""); setMaxUses(""); setExpiresAt("");
      setPlans(["starter", "pro", "clinic"]);
      loadVouchers();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create voucher.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(v: Voucher) {
    try {
      await toggleVoucher({ data: { id: v.id, isActive: !v.is_active } });
      toast.success(v.is_active ? "Voucher disabled." : "Voucher enabled.");
      loadVouchers();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update voucher.");
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete voucher "${code}"? This cannot be undone.`)) return;
    try {
      await deleteVoucher({ data: { id } });
      toast.success("Voucher deleted.");
      loadVouchers();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete voucher.");
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Tag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Voucher Management</h1>
      </div>

      {/* Create form */}
      <div className="rounded-xl border bg-card p-6 mb-8">
        <h2 className="text-base font-semibold mb-4">Create New Voucher</h2>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="code">Voucher Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder="SUMMER20"
              maxLength={20}
              required
            />
          </div>

          {/* Discount */}
          <div className="space-y-1.5">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              id="discount"
              type="number"
              min={1}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="20"
              required
            />
          </div>

          {/* Max uses */}
          <div className="space-y-1.5">
            <Label htmlFor="maxUses">Max Uses <span className="text-muted-foreground text-xs">(blank = unlimited)</span></Label>
            <Input
              id="maxUses"
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="100"
            />
          </div>

          {/* Expiry */}
          <div className="space-y-1.5">
            <Label htmlFor="expiresAt">Expires At <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {/* Applicable plans */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Applicable Plans</Label>
            <div className="flex gap-4">
              {PLAN_OPTIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plans.includes(p)}
                    onChange={(e) =>
                      setPlans(e.target.checked
                        ? [...plans, p]
                        : plans.filter((x) => x !== p))
                    }
                    className="rounded"
                  />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={creating} className="gap-2">
              {creating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                : <><Plus className="h-4 w-4" /> Create Voucher</>}
            </Button>
          </div>
        </form>
      </div>

      {/* Vouchers list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="font-semibold text-sm">All Vouchers</h2>
          <span className="text-xs text-muted-foreground">{vouchers.length} total</span>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No vouchers yet. Create one above.
          </div>
        ) : (
          <div className="divide-y">
            {vouchers.map((v) => (
              <div key={v.id} className="px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono font-bold text-sm">{v.code}</span>
                    <Badge
                      className={v.is_active
                        ? "bg-green-100 text-green-700 text-xs"
                        : "bg-muted text-muted-foreground text-xs"}
                    >
                      {v.is_active ? "Active" : "Disabled"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {v.discount_percentage}% off
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Plans: {v.applicable_plans.join(", ")}
                    {" · "}
                    Uses: {v.used_count} / {v.max_uses ?? "∞"}
                    {v.expires_at && (
                      <> · Expires {new Date(v.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Toggle active */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToggle(v)}
                    title={v.is_active ? "Disable voucher" : "Enable voucher"}
                  >
                    {v.is_active
                      ? <ToggleRight className="h-5 w-5 text-primary" />
                      : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(v.id, v.code)}
                    title="Delete voucher"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}