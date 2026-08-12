import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A textarea that starts at a comfortable height and grows to fit its content
 * as the user types, up to a max height (after which it scrolls). Handy for
 * fields like the Topic / Prompt where the input can be a short phrase or a
 * couple of sentences.
 */
const AutoGrowTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, value, onChange, rows = 2, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      },
      [ref],
    );

    const resize = React.useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    // Re-fit whenever the controlled value changes (typing, resets, restores).
    React.useEffect(() => {
      resize();
    }, [value, resize]);

    return (
      <textarea
        ref={setRefs}
        value={value}
        rows={rows}
        onChange={(e) => {
          onChange?.(e);
          resize();
        }}
        className={cn(
          "flex min-h-[64px] max-h-[220px] w-full resize-none overflow-y-auto rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);
AutoGrowTextarea.displayName = "AutoGrowTextarea";

export { AutoGrowTextarea };
