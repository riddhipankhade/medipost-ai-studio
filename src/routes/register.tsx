import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brand } from "@/components/brand";
import { FadeIn } from "@/components/motion";
import { specialties } from "@/lib/mock-data";
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <Brand to="/" />
        <div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">Join 1,200+ doctors<br />creating with AI.</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-sm leading-relaxed">Start free. Generate your first 5 posts on us.</p>
        </div>
        <p className="text-sm text-primary-foreground/70">© 2026 Medipost AI</p>
      </div>
      <div className="flex items-center justify-center p-6">
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
                  <Select value={specialty} onValueChange={setSpecialty} required>
                    <SelectTrigger><SelectValue placeholder="Select your specialty" /></SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
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
