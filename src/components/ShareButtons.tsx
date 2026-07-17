/**
 * src/components/ShareButtons.tsx
 *
 * Share generated content to WhatsApp, Facebook, Instagram.
 * - WhatsApp: shares image via Web Share API on mobile, text-only on desktop
 * - Facebook/Instagram: copies caption to clipboard + shows clear "now paste" panel
 */

import { useState } from "react";
import { Check, Copy, Download, Share2, X } from "lucide-react";

// ── Platform SVG icons ──────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

// ── Types ───────────────────────────────────────────────────────────────────

interface ShareButtonsProps {
  text: string;
  imageUrl?: string | null;
  className?: string;
}

type PendingPlatform = "facebook" | "instagram" | null;

// ── Component ───────────────────────────────────────────────────────────────

export function ShareButtons({ text, imageUrl, className = "" }: ShareButtonsProps) {
  const [copied, setCopied]                 = useState(false);
  const [pendingPlatform, setPending]       = useState<PendingPlatform>(null);
  const [clipboardReady, setClipboardReady] = useState(false);
  const [imageDownloaded, setImageDownloaded] = useState(false);

  // ── Copy text ──────────────────────────────────────────────────────────
  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────
  // On mobile: shares image + text via Web Share API if imageUrl is available
  // On desktop: opens WhatsApp Web with text pre-filled (no image support on desktop)
  async function shareWhatsApp() {
    if (imageUrl && typeof navigator !== "undefined" && navigator.share) {
      try {
        const res  = await fetch(imageUrl);
        const blob = await res.blob();
        const file = new File([blob], "medipost-card.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text });
          return;
        }
      } catch {}
    }
    // Desktop fallback — text only via WhatsApp Web
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      "_blank", "noopener,noreferrer"
    );
  }

  // ── Facebook / Instagram ───────────────────────────────────────────────
  // FB and IG don't accept programmatic image pushes.
  // Strategy: auto-download the image + copy caption, then show paste panel.
  async function preparePlatform(platform: "facebook" | "instagram") {
    // Run both in parallel — caption copy and image download
    const [, downloaded] = await Promise.all([
      navigator.clipboard.writeText(text).then(() => true).catch(() => false),
      imageUrl ? downloadImage() : Promise.resolve(false),
    ]);
    setClipboardReady(true);
    setImageDownloaded(downloaded as boolean);
    setPending(platform);
  }

  function openPlatform() {
    const url = pendingPlatform === "facebook"
      ? "https://www.facebook.com/"
      : "https://www.instagram.com/";
    window.open(url, "_blank", "noopener,noreferrer");
    setPending(null);
  }

  // ── Download image ─────────────────────────────────────────────────────
  // Fetches as blob first so cross-origin Pollinations URLs actually download
  // instead of just navigating to the image (which a plain anchor would do).
  async function downloadImage() {
    if (!imageUrl) return false;
    try {
      let blob: Blob;
      if (imageUrl.startsWith("data:")) {
        const [header, b64] = imageUrl.split(",");
        const mime           = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
        const bytes          = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        blob                 = new Blob([bytes], { type: mime });
      } else {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        blob = await res.blob();
      }
      const objectUrl = URL.createObjectURL(blob);
      const a         = document.createElement("a");
      a.href          = objectUrl;
      a.download      = "medipost-card.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
      return true;
    } catch (err) {
      console.warn("[ShareButtons] download failed, opening in new tab:", err);
      window.open(imageUrl, "_blank", "noopener,noreferrer");
      return false;
    }
  }

  // ── Native share (mobile "More") ───────────────────────────────────────
  async function nativeShare() {
    if (!navigator.share) return;
    try {
      const shareData: ShareData = { text };
      if (imageUrl && navigator.canShare) {
        try {
          const res  = await fetch(imageUrl);
          const blob = await res.blob();
          const file = new File([blob], "medipost-card.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) shareData.files = [file];
        } catch {}
      }
      await navigator.share(shareData);
    } catch {}
  }

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className={className}>
      <p className="text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wide">
        Share
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {/* WhatsApp */}
        <button
          onClick={shareWhatsApp}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-[#25D366] text-white hover:bg-[#20ba5a] transition-colors"
        >
          <WhatsAppIcon />
          WhatsApp
        </button>

        {/* Facebook */}
        <button
          onClick={() => preparePlatform("facebook")}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-[#1877F2] text-white hover:bg-[#1464d0] transition-colors"
        >
          <FacebookIcon />
          Facebook
        </button>

        {/* Instagram */}
        <button
          onClick={() => preparePlatform("instagram")}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors"
          style={{ background: "linear-gradient(135deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)" }}
        >
          <InstagramIcon />
          Instagram
        </button>

        {/* Copy text */}
        <button
          onClick={copyText}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy text"}
        </button>

        {/* Download image */}
        {imageUrl && (
          <button
            onClick={() => downloadImage()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download card
          </button>
        )}

        {/* Native share — mobile only */}
        {canNativeShare && (
          <button
            onClick={nativeShare}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            More
          </button>
        )}
      </div>

      {/* ── Facebook / Instagram "paste" panel ────────────────────────────── */}
      {pendingPlatform && (
        <div className="mt-3 rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">
              Ready to post on {pendingPlatform === "facebook" ? "Facebook" : "Instagram"}
            </p>
            <button
              onClick={() => { setPending(null); setImageDownloaded(false); }}
              className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Status checklist */}
          <ul className="space-y-1.5 text-xs">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-muted-foreground">Caption copied to clipboard</span>
            </li>
            {imageUrl && (
              <li className="flex items-center gap-2">
                {imageDownloaded
                  ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  : <Download className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                <span className="text-muted-foreground">
                  {imageDownloaded
                    ? "Image saved to Downloads"
                    : "Image opened in new tab — save it manually"}
                </span>
              </li>
            )}
          </ul>

          {/* Steps */}
          <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
            {imageUrl && <li>Create a new post and <strong>upload the downloaded image</strong></li>}
            <li>Paste your caption (<kbd className="px-1 py-0.5 bg-muted border rounded text-xs">Ctrl+V</kbd> / <kbd className="px-1 py-0.5 bg-muted border rounded text-xs">⌘V</kbd>)</li>
            <li>Publish!</li>
          </ol>

          <div className="flex gap-2 pt-0.5">
            <button
              onClick={openPlatform}
              className="flex-1 rounded-lg py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background: pendingPlatform === "facebook"
                  ? "#1877F2"
                  : "linear-gradient(135deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
              }}
            >
              Open {pendingPlatform === "facebook" ? "Facebook" : "Instagram"} →
            </button>
            {imageUrl && (
              <button
                onClick={downloadImage}
                className="rounded-lg px-3 py-2 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors inline-flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Re-download
              </button>
            )}
            <button
              onClick={() => { setPending(null); setImageDownloaded(false); }}
              className="rounded-lg px-3 py-2 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}