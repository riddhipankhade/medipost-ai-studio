import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Medipost AI" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 text-white" style={{ background: "var(--brand-gradient)" }}>
        <Brand to="/" />
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Content your patients<br/>actually read.
          </h2>
          <p className="mt-3 text-white/85 max-w-sm">
            Medipost AI helps healthcare professionals create educational, on-brand content in seconds.
          </p>
        </div>
        <p className="text-sm text-white/70">© 2026 Medipost AI</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden"><Brand to="/" /></div>
          <div>
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to continue creating.</p>
          </div>
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" defaultValue="dr.rhea@medipost.ai" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" defaultValue="demo1234" />
              </div>
              <Button className="w-full" size="lg" onClick={() => navigate({ to: "/dashboard" })}>
                Sign in
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                New to Medipost? <Link to="/register" className="text-[color:var(--teal)] font-medium">Create an account</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}