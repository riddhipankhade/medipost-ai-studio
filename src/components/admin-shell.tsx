import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, CreditCard, BarChart3, Settings, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { isAdmin, clearRole } from "@/lib/auth-mock";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/plans", label: "Subscription Plans", icon: CreditCard },
  { to: "/admin/analytics", label: "Content Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Platform Settings", icon: Settings },
] as const;

export function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(isAdmin());
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.985_0.01_220)] p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Unauthorized Access</h1>
          <p className="text-muted-foreground text-sm">
            You don't have permission to view the Admin Portal. Please sign in with an administrator account.
          </p>
          <Button onClick={() => navigate({ to: "/admin/login" })}>Go to Admin Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[oklch(0.985_0.01_220)]">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Medipost</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Admin Portal</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-foreground text-background">AD</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Admin</p>
              <p className="text-xs text-muted-foreground truncate">Platform owner</p>
            </div>
            <button
              onClick={() => { clearRole(); navigate({ to: "/admin/login" }); }}
              className="ml-auto text-muted-foreground hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}