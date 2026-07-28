import { useRef, useCallback } from "react";
import { isExportableNode } from "@/lib/export-filter";

/**
 * Hook that provides a ref to attach to your PostCard and a download function
 * that captures the card as a high-res PNG.
 *
 * Uses html-to-image (NOT html2canvas) because html2canvas crashes on
 * oklch() CSS color functions used by shadcn/ui.
 *
 * Requirements:
 *   npm install html-to-image
 */
export function useDownloadPost(doctorName: string) {
  const cardRef = useRef<HTMLDivElement>(null);

  const filename = `medipost-${doctorName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${Date.now()}.png`;

  const download = useCallback(async () => {
    if (!cardRef.current) {
      console.error("[useDownloadPost] cardRef is null — PostCard ref not attached");
      return;
    }

    try {
      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,          // 2× retina quality
        cacheBust: true,        // bust cached cross-origin images
        backgroundColor: "#ffffff",
        filter: isExportableNode,
      });

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("[useDownloadPost] capture failed:", err);
      alert("Download failed — check console for details.");
    }
  }, [doctorName]);

  /** Capture without downloading — useful for saving previews elsewhere. */
  const captureDataUrl = useCallback(async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    try {
      const { toPng } = await import("html-to-image");
      return await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: isExportableNode,
      });
    } catch {
      return null;
    }
  }, []);

  return { cardRef, download, captureDataUrl };
}