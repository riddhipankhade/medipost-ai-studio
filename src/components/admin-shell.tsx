import { useEffect } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, CreditCard, BarChart3, Settings, LogOut, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/admin",           label: "Dashboard",          icon: LayoutDashboard, exact: true  as boolean },
  { to: "/admin/users",     label: "Users",              icon: Users,           exact: false as boolean },
  { to: "/admin/plans",     label: "Subscription Plans", icon: CreditCard,      exact: false as boolean },
  { to: "/admin/analytics", label: "Content Analytics",  icon: BarChart3,       exact: false as boolean },
  { to: "/admin/vouchers",  label: "Vouchers",           icon: Tag,             exact: false as boolean },
  { to: "/admin/settings",  label: "Platform Settings",  icon: Settings,        exact: false as boolean },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [loading, session, navigate]);

  if (loading) return null;

  if (session && profile && profile.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-foreground/2 p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Unauthorized Access</h1>
          <p className="text-muted-foreground text-sm">
            Your account does not have admin privileges. Please sign in with an administrator account.
          </p>
          <Button onClick={() => navigate({ to: "/admin/login" })}>Go to Admin Login</Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-foreground/2">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
          <img src="/logo-icon.png" alt="Medipost AI" className="h-8 w-8" />
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
              <p className="text-sm font-medium truncate">{profile.full_name ?? "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-auto text-muted-foreground hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="p-6 md:p-10 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}