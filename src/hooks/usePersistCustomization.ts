import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { updatePostCustomization } from "@/lib/api/generate.functions";
import type { PostCustomization } from "@/lib/post-customization";

/**
 * Debounced save for Studio's customization state. `generateContent` already
 * seeds a valid default `customization` in the same insert that creates the
 * row (see generate.functions.ts), so this hook only ever needs to persist
 * SUBSEQUENT edits — color picker drags, layout/theme/frame picks, etc.
 *
 * Skips the network call entirely when the serialized value hasn't actually
 * changed since the last successful save (re-renders with derived-but-equal
 * objects are common here and shouldn't trigger a write).
 */
export function usePersistCustomization(
  contentId: string | null | undefined,
  customization: PostCustomization | null,
) {
  const call = useServerFn(updatePostCustomization);
  const lastSaved = useRef<string | null>(null);

  useEffect(() => {
    if (!contentId || !customization) return;
    const serialized = JSON.stringify(customization);
    if (serialized === lastSaved.current) return;

    const timer = setTimeout(async () => {
      try {
        await call({ data: { contentId, customization } });
        lastSaved.current = serialized;
      } catch (e) {
        console.error("[usePersistCustomization] save failed:", e);
        toast.error("Design changes couldn't be saved — they'll only apply to this session.");
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, JSON.stringify(customization)]);
}
