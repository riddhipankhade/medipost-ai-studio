import { Link } from "@tanstack/react-router";

export function Brand({ to = "/", compact = false }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="flex items-center">
      <img
        src={compact ? "/logo-icon.png" : "/logo-full.png"}
        alt="Medipost AI"
        className={compact ? "h-10 w-10" : "h-14 w-auto"}
      />
    </Link>
  );
}