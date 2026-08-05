import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { AuthShowcasePanel } from "@/components/auth-showcase-panel";
import { FadeIn } from "@/components/motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Medipost AI" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, navigate]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (signInError) {
      setError("Invalid email or password.");
      return;
    }

    navigate({ to: "/dashboard", replace: true });
  }

  if (loading) return null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 lg:h-screen lg:overflow-hidden bg-background">
      <AuthShowcasePanel
        headline={<>Content your patients<br />actually read.</>}
        subtext="Medipost AI helps healthcare professionals create educational, on-brand content in seconds."
      />
      <div className="flex items-center justify-center p-6 lg:overflow-y-auto">
        <FadeIn className="w-full max-w-md space-y-7">
          <div className="lg:hidden"><Brand to="/" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Sign in to continue creating.</p>
          </div>
          <Card className="shadow-md">
            <CardContent className="p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  New to Medipost?{" "}
                  <Link to="/register" className="text-primary font-medium">Create an account</Link>
                </p>
              </form>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By signing in, you agree to our{" "}
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>,{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>{" "}
            and{" "}
            <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
          </p>
        </FadeIn>
      </div>
    </div>
  );
}