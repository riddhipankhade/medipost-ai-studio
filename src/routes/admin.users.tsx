import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

const users = [
  { name: "Dr. Aisha Khan", email: "aisha@smileclinic.in", plan: "Pro", status: "Active", joined: "12 Mar 2026" },
  { name: "Dr. Karan Mehta", email: "karan@cardiocare.in", plan: "Clinic", status: "Active", joined: "02 Apr 2026" },
  { name: "Dr. Neha Sharma", email: "neha@dermaplus.in", plan: "Starter", status: "Trial", joined: "18 May 2026" },
  { name: "Dr. Vivaan Rao", email: "vivaan@gpcare.in", plan: "Pro", status: "Active", joined: "08 Jun 2026" },
  { name: "Dr. Priya Iyer", email: "priya@dentalhub.in", plan: "Pro", status: "Active", joined: "01 Jun 2026" },
  { name: "Dr. Rohan Das", email: "rohan@orthoplus.in", plan: "Starter", status: "Paused", joined: "10 May 2026" },
];

function AdminUsers() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
          <Input placeholder="Search users…" className="max-w-xs" />
        </div>
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">All clinics & doctors</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="grid grid-cols-12 px-5 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div className="col-span-5">User</div>
                <div className="col-span-2">Plan</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3 text-right">Joined</div>
              </div>
              {users.map((u) => (
                <div key={u.email} className="grid grid-cols-12 items-center px-5 py-3 text-sm">
                  <div className="col-span-5 min-w-0">
                    <p className="font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="col-span-2"><Badge variant="secondary">{u.plan}</Badge></div>
                  <div className="col-span-2">
                    <span className={`text-xs ${u.status === "Active" ? "text-emerald-600" : u.status === "Trial" ? "text-amber-600" : "text-muted-foreground"}`}>
                      {u.status}
                    </span>
                  </div>
                  <div className="col-span-3 text-right text-muted-foreground">{u.joined}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}