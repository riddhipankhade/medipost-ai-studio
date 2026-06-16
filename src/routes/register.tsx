import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brand } from "@/components/brand";
import { specialties } from "@/lib/mock-data";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Medipost AI" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 text-white" style={{ background: "var(--brand-gradient)" }}>
        <Brand to="/" />
        <div>
          <h2 className="text-3xl font-semibold leading-tight">Join 1,200+ doctors<br/>creating with AI.</h2>
          <p className="mt-3 text-white/85 max-w-sm">Start free. Generate your first 5 posts on us.</p>
        </div>
        <p className="text-sm text-white/70">© 2026 Medipost AI</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden"><Brand to="/" /></div>
          <div>
            <h1 className="text-2xl font-semibold">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Built for doctors, dentists & clinics.</p>
          </div>
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>First name</Label><Input defaultValue="Rhea" /></div>
                <div className="space-y-2"><Label>Last name</Label><Input defaultValue="Patel" /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue="dr.rhea@medipost.ai" /></div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select defaultValue="Dentist">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" defaultValue="demo1234" /></div>
              <Button className="w-full" size="lg" onClick={() => navigate({ to: "/dashboard" })}>Create account</Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account? <Link to="/login" className="text-[color:var(--teal)] font-medium">Sign in</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}