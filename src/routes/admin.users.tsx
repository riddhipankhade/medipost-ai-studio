import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { getAllUsers, deleteUser } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

type User = Awaited<ReturnType<typeof getAllUsers>>[number];

function AdminUsers() {
  const [users,     setUsers]     = useState<User[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function load() {
    setLoading(true);
    getAllUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteUser({ data: { userId: confirmId } });
      setConfirmId(null);
      await load();
    } catch (e: any) {
      setError(e.message ?? "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const confirmUser = users.find((u) => u.id === confirmId);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
            {!loading && (
              <p className="text-sm text-muted-foreground mt-1">{users.length} total users</p>
            )}
          </div>
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">All clinics & doctors</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                <div className="grid grid-cols-12 px-5 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <div className="col-span-4">User</div>
                  <div className="col-span-2">Plan</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Generations</div>
                  <div className="col-span-1 text-right">Joined</div>
                  <div className="col-span-1"></div>
                </div>
                {filtered.map((u) => (
                  <div key={u.id} className="grid grid-cols-12 items-center px-5 py-3 text-sm">
                    <div className="col-span-4 min-w-0">
                      <p className="font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="col-span-2">
                      <Badge variant={u.plan === "Pro" ? "default" : "secondary"}>{u.plan}</Badge>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-xs font-medium ${
                        u.status === "Active" ? "text-emerald-600" :
                        u.status === "Trial"  ? "text-amber-600"   :
                        "text-muted-foreground"
                      }`}>
                        {u.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-muted-foreground">{u.gens}</div>
                    <div className="col-span-1 text-right text-muted-foreground text-xs">
                      {new Date(u.joined).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short",
                      })}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => { setError(null); setConfirmId(u.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    {search ? "No users match your search." : "No users yet."}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmId} onOpenChange={(o) => { if (!o) setConfirmId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete{" "}
            <span className="font-medium text-foreground">{confirmUser?.email}</span>{" "}
            and all their content and subscription data. This cannot be undone.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}