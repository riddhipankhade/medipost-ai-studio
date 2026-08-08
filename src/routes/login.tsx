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

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

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

  async function handleGoogleSignIn() {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
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
              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 gap-2"
                size="lg"
                onClick={handleGoogleSignIn}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

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