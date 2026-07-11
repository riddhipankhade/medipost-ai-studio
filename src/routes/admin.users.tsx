import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { getAllUsers } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

type User = Awaited<ReturnType<typeof getAllUsers>>[number];

function AdminUsers() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    getAllUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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
                  <div className="col-span-2 text-right">Joined</div>
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
                    <div className="col-span-2 text-right text-muted-foreground text-xs">
                      {new Date(u.joined).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
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
    </AdminShell>
  );
}