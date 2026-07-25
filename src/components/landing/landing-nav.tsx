import * as React from "react";
import { Link } from "@tanstack/react-router";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";

const ENQUIRY_EMAIL = "office@sayitdoc.com";

const links = [
  { href: "#features", label: "Content Studio" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
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
        className="max-w-6xl mx-auto px-6 grid grid-cols-[1fr_auto_1fr] items-center"
        animate={{ height: scrolled ? 60 : 72 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="col-start-1 justify-self-start">
          <Brand />
        </div>
        <nav
          className="col-start-2 hidden md:flex items-center gap-1 text-sm text-muted-foreground justify-self-center"
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
        <div className="col-start-3 flex items-center gap-2 justify-self-end">
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${ENQUIRY_EMAIL}`}>Enquire</a>
            </Button>
            <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
            <Button size="sm" asChild><Link to="/register">Get started</Link></Button>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation menu</SheetTitle>
                <SheetDescription>Site navigation and account links</SheetDescription>
              </SheetHeader>
              <Brand />
              <nav className="flex flex-col gap-1 mt-4 text-base">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-border/70">
                <Button variant="outline" asChild>
                  <a href={`mailto:${ENQUIRY_EMAIL}`} onClick={() => setMobileOpen(false)}>
                    Enquire
                  </a>
                </Button>
                <Button variant="ghost" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/register">Get started</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>
    </header>
  );
}