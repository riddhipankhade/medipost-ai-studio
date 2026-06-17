import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Sparkles, History, CreditCard, ShieldCheck, LogOut } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generate", label: "Content Studio", icon: Sparkles },
  { to: "/history", label: "Content History", icon: History },
  { to: "/subscription", label: "Subscription", icon: CreditCard },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen bg-[oklch(0.985_0.01_220)]">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5 border-b border-border">
          <Brand to="/dashboard" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.to === "/admin" && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">demo</Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-[color:var(--teal)] text-white">DR</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Dr. Rhea Patel</p>
              <p className="text-xs text-muted-foreground truncate">Pro plan</p>
            </div>
            <Link to="/" className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <Brand to="/dashboard" />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Exit</Link>
          </Button>
        </header>
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}