import * as React from "react";

/**
 * Full-page ambient background for the landing page: a blue/green glow that
 * trails the cursor and reveals a faint medical-icon pattern around it.
 * Anchored in document space (absolute, page coordinates) so the effect
 * scrolls with the content instead of sticking to the viewport.
 * Renders nothing on touch devices. Uses rAF + direct style writes (never
 * React state) so mousemove never triggers a re-render.
 */
export function AmbientCursor() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const glowRef = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) setEnabled(true);
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    const glow = glowRef.current;
    if (!root || !glow) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // last known cursor position in viewport coords; target is in page coords
    const last = { x: window.innerWidth / 2, y: window.innerHeight * 0.3 };
    const target = { x: last.x, y: last.y + window.scrollY };
    const pos = { ...target };
    let raf = 0;
    let seen = false;

    const render = () => {
      const ease = reduced ? 1 : 0.08;
      pos.x += (target.x - pos.x) * ease;
      pos.y += (target.y - pos.y) * ease;
      glow.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      root.style.setProperty("--amb-x", `${pos.x}px`);
      root.style.setProperty("--amb-y", `${pos.y}px`);
      raf =
        Math.abs(target.x - pos.x) > 0.5 || Math.abs(target.y - pos.y) > 0.5
          ? requestAnimationFrame(render)
          : 0;
    };

    const retarget = () => {
      target.x = last.x;
      target.y = last.y + window.scrollY;
      if (seen) root.style.opacity = "1";
      if (!raf) raf = requestAnimationFrame(render);
    };
    const onMove = (e: MouseEvent) => {
      last.x = e.clientX;
      last.y = e.clientY;
      seen = true;
      retarget();
    };
    // keep the halo under the cursor while the page scrolls beneath it
    const onScroll = () => retarget();
    const onLeave = () => {
      root.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  const revealMask =
    "radial-gradient(230px circle at var(--amb-x, 50vw) var(--amb-y, 30vh), black 0%, black 25%, transparent 82%)";

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-700"
    >
      <div
        className="absolute inset-0 bg-medical-pattern"
        style={{ WebkitMaskImage: revealMask, maskImage: revealMask }}
      />
      <div ref={glowRef} className="absolute left-0 top-0 will-change-transform">
        <div
          className="h-[380px] w-[380px] rounded-full blur-[70px]"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklch, var(--color-primary) 20%, transparent), color-mix(in oklch, var(--color-brand-sky) 10%, transparent) 55%, transparent 72%)",
          }}
        />
      </div>
    </div>
  );
}
