import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/brand";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase embeds the recovery token in the URL hash.
  // Calling getSession() after load picks it up automatically.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => navigate({ to: "/login" }), 3000);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Brand to="/" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">Password updated!</h1>
              <p className="text-sm text-muted-foreground">
                Your password has been changed. Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Set new password</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a strong password for your account.
                </p>
              </div>

              {!sessionReady && !error && (
                <p className="text-sm text-muted-foreground">Verifying reset link…</p>
              )}

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 mb-4">
                  <p className="text-sm text-destructive">{error}</p>
                  {!sessionReady && (
                    <a
                      href="/forgot-password"
                      className="text-sm text-primary underline mt-2 inline-block"
                    >
                      Request a new reset link
                    </a>
                  )}
                </div>
              )}

              {sessionReady && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPw(!showPw)}
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <Input
                      id="confirm"
                      type={showPw ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !password || !confirm}
                  >
                    {loading ? "Updating…" : "Update password"}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}