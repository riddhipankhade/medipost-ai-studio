import * as React from "react";
import { Link } from "@tanstack/react-router";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";

const links = [
  { href: "#features", label: "Content Studio" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 16);
  });

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b backdrop-blur-md transition-colors duration-300",
        scrolled ? "bg-background/80 border-border/70" : "bg-transparent border-transparent",
      )}
    >
      <motion.div
        className="max-w-6xl mx-auto px-6 flex items-center justify-between"
        animate={{ height: scrolled ? 60 : 72 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Brand />
        <nav
          className="hidden md:flex items-center gap-1 text-sm text-muted-foreground"
          onMouseLeave={() => setHovered(null)}
        >
          {links.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onMouseEnter={() => setHovered(i)}
              className="relative px-3.5 py-2 rounded-lg hover:text-foreground transition-colors"
            >
              {hovered === i && (
                <motion.span
                  layoutId="nav-hover"
                  className="absolute inset-0 rounded-lg bg-accent -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
          <Button size="sm" asChild><Link to="/register">Get started</Link></Button>
        </div>
      </motion.div>
    </header>
  );
}
