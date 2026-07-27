import { useAuth } from "@/lib/auth-context";
import { useShowWatermark } from "@/lib/use-subscription";

/**
 * Medipost brand badge (icon + wordmark) shown only on Starter/free-plan
 * creatives. Self-hydrates plan state via useAuth()/useShowWatermark() so it
 * can be dropped into any shared render component (SlideCanvas, StoryCard,
 * FestiveCard, template FrameShell) with zero prop-threading — mirrors
 * useBrandKit()'s self-hydrating pattern. Defaults to the top-right corner,
 * which is the one spot free across every layout's brand header/CTA/contact
 * bar placement; pass `style` to override per call site where it isn't.
 */
export function Watermark({ style }: { style?: React.CSSProperties }) {
  const { user } = useAuth();
  const show = useShowWatermark(user?.id);
  if (!show) return null;
  return (
    <div
      aria-hidden
      className="absolute z-40 flex items-center gap-1 rounded-full pl-1 pr-2 py-1 pointer-events-none select-none shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
      style={{ top: 8, right: 8, background: "rgba(255,255,255,0.95)", ...style }}
    >
      <img src="/logo-icon.png" alt="" className="h-3.5 w-3.5 object-contain shrink-0" />
      <span className="text-[9px] font-bold tracking-wide whitespace-nowrap" style={{ color: "#0f4c4c" }}>
        Medipost
      </span>
    </div>
  );
}
