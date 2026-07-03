import { Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";

export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 font-semibold text-foreground">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Stethoscope className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span className="text-[1.05rem] tracking-tight">
        Medipost <span className="text-primary">AI</span>
      </span>
    </Link>
  );
}