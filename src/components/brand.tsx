import { Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";

export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-semibold text-foreground">
      <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: "var(--brand-gradient)" }}>
        <Stethoscope className="h-4 w-4" />
      </span>
      <span className="text-lg tracking-tight">
        Medipost <span className="text-[color:var(--teal)]">AI</span>
      </span>
    </Link>
  );
}