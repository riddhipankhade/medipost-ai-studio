import { useEffect } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Sparkles, History, CreditCard, LogOut, Palette, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/use-subscription";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generate", label: "Content Studio", icon: Sparkles },
  { to: "/brand", label: "Brand Kit", icon: Palette },
  { to: "/history", label: "Content History", icon: History },
  { to: "/subscription", label: "Subscription", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const { session, user, profile, loading, signOut } = useAuth();
  const { data: sub } = useSubscription(user?.id);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/", replace: true });
    }
  }, [loading, session, navigate]);

  if (loading || !session) return null;

  const metaName = (user?.user_metadata?.full_name as string | undefined)?.trim();
  const nameForDisplay = profile?.full_name?.trim() || metaName;
  const initials = nameForDisplay
    ? nameForDisplay.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "DR";
  const displayName = nameForDisplay || profile?.email || user?.email || "Doctor";

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/70 bg-sidebar">
        <div className="px-5 py-5 border-b border-border/70">
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
                className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-sidebar-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary" />
                )}
                <Icon
                  className={`relative h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`}
                  strokeWidth={2}
                />
                <span className={`relative ${active ? "text-sidebar-accent-foreground" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/70">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{sub?.plans.display_name ?? "Free"}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-background/90 backdrop-blur-md px-4 py-3">
          <Brand to="/dashboard" />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </header>
        <div className="p-6 md:p-10 max-w-6xl mx-auto min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
