import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SpecialtySelect } from "@/components/specialty-select";
import { Brand } from "@/components/brand";
import { AuthShowcasePanel, FanShowcase } from "@/components/auth-showcase-panel";
import { FadeIn } from "@/components/motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Medipost AI" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Redirect already-authenticated users away from the register page
  useEffect(() => {
    if (!authLoading && session) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [authLoading, session, navigate]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          specialty,
        },
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is disabled in Supabase, session is set immediately.
    // If enabled, session is null and the user must confirm via email first.
    if (data.session) {
      navigate({ to: "/dashboard", replace: true });
    } else {
      setEmailSent(true);
    }
  }

  if (authLoading) return null;

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <FadeIn className="w-full max-w-md space-y-4 text-center">
          <div className="flex justify-center"><Brand to="/" /></div>
          <h1 className="text-2xl font-semibold tracking-tight mt-6">Check your email</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{email}</span>.
            Click it to activate your account.
          </p>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 lg:h-screen lg:overflow-hidden bg-background">
      <AuthShowcasePanel
        headline={<>Every format your<br />clinic will ever need.</>}
        subtext="Posts, carousels & festive greetings — on-brand in seconds. Generate your first 10 posts on us."
        showcase={<FanShowcase />}
      />
      <div className="flex items-center justify-center p-6 lg:overflow-y-auto">
        <FadeIn className="w-full max-w-md space-y-7">
          <div className="lg:hidden"><Brand to="/" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Built for doctors, dentists &amp; clinics.</p>
          </div>
          <Card className="shadow-md">
            <CardContent className="p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <SpecialtySelect value={specialty} onChange={setSpecialty} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? "Creating account…" : "Create account"}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-medium">Sign in</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
