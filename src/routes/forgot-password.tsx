import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/brand";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Brand to="/" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">Check your email</h1>
              <p className="text-sm text-muted-foreground mb-6">
                We sent a password reset link to <strong>{email}</strong>.
                Check your inbox and click the link to reset your password.
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Didn't receive it? Check your spam folder or try again in a few minutes.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Try a different email
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Forgot password?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@clinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading || !email}
                >
                  {loading ? (
                    "Sending…"
                  ) : (
                    <><Mail className="h-4 w-4" /> Send reset link</>
                  )}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}