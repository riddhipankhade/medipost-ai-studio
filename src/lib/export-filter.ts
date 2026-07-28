/**
 * Shared `filter` predicate for every html-to-image `toPng()` call site.
 * Excludes <script> tags (they confuse the serialiser) and anything marked
 * `data-export-ignore="true"` — UI-only affordances like the watermark's
 * "Remove watermark" upsell button that must never appear in a downloaded
 * creative.
 */
export function isExportableNode(node: Node): boolean {
  if (node.nodeName === "SCRIPT") return false;
  if (node instanceof Element && node.getAttribute("data-export-ignore") === "true") return false;
  return true;
}
