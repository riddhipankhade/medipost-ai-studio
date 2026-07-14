import { forwardRef } from "react";

export interface PostCardProps {
  doctorName: string;
  specialty?: string;
  clinicName: string;
  phone?: string;
  address?: string;
  imageUrl?: string;
  title: string;
  bodyText: string;
  /** deprecated: hashtags are no longer rendered on the creative (they belong in the caption, not the image) */
  hashtags?: string;
  isTrial?: boolean;
  /** Max characters before body text is truncated. Default 130. Pass Infinity to show all. */
  maxBodyLength?: number;
}

// Pool of diverse, high-quality healthcare Unsplash images (free, no API key).
// New images are picked per post so every card looks different.
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80", // doctor consult
  "https://images.unsplash.com/photo-1588776814546-1ffbb172e4eb?w=800&q=80", // dental tools
  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80", // heart health
  "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&q=80", // skincare
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80", // eye exam
  "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=80", // healthy food
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", // physiotherapy
  "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80", // pediatric
  "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=800&q=80", // mental health
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80", // clinic interior
];

/** Stable hash so the same post always picks the same background image. */
function pickFallback(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_IMAGES[h % FALLBACK_IMAGES.length];
}

const PostCard = forwardRef<HTMLDivElement, PostCardProps>(
  (
    {
      doctorName,
      specialty,
      clinicName,
      phone,
      address,
      imageUrl,
      title,
      bodyText,
      isTrial = true,
      maxBodyLength = 130,
    },
    ref
  ) => {
    // Stable fallback per post (hashed from title), so different posts look different
    const fallbackImage = pickFallback(title + clinicName);

    return (
      <div
        ref={ref}
        style={{
          width: 390,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          background: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          flexShrink: 0,
        }}
      >
        {/* ── Image area ── */}
        <div style={{ position: "relative", width: "100%", height: 320 }}>
          {/* Background image */}
          <img
            src={imageUrl || fallbackImage}
            alt="Generated post visual"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />

          {/* Subtle dark gradient at bottom for readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)",
            }}
          />

          {/* Top-left clinic badge — only when the brand kit has a clinic name */}
          {clinicName && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: "rgba(255,255,255,0.92)",
                borderRadius: 20,
                padding: "5px 13px",
                fontSize: 11,
                fontWeight: 700,
                color: "#1F2937",
                display: "flex",
                alignItems: "center",
                gap: 6,
                maxWidth: "72%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                backdropFilter: "blur(4px)",
              }}
            >
              🩺 {clinicName.toUpperCase()}
            </div>
          )}

          {/* Content overlay card */}
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: 12,
              right: 12,
              background: "rgba(255,255,255,0.96)",
              borderRadius: 16,
              padding: "15px 18px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              backdropFilter: "blur(6px)",
            }}
          >
            {/* Clinic name — small */}
            {clinicName && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#028090",
                  letterSpacing: 1.2,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                🌿 {clinicName.toUpperCase()}
              </div>
            )}

            {/* Title */}
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.3,
                marginBottom: 10,
              }}
            >
              {title}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#E5E7EB", marginBottom: 10 }} />

            {/* Body with checkmark */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#028090",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                ✓
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.55,
                }}
              >
                {bodyText.length > maxBodyLength ? bodyText.slice(0, maxBodyLength) + "…" : bodyText}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer pill — only when the brand kit has something to show ── */}
        {(doctorName || phone || address) && (
          <div
            style={{
              margin: "12px 12px 0",
              border: "1px solid #E5E7EB",
              borderRadius: 40,
              padding: "10px 22px",
              textAlign: "center",
            }}
          >
            {doctorName && (
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
                {doctorName}
                {specialty ? <span style={{ fontWeight: 400, color: "#6B7280" }}> · {specialty}</span> : null}
              </div>
            )}
            {(phone || address) && (
              <div style={{ fontSize: 12, color: "#028090", marginTop: 2 }}>
                {[phone, address].filter(Boolean).join(" • ")}
              </div>
            )}
          </div>
        )}

        {/* ── Trial watermark ── */}
        {isTrial && (
          <div
            style={{
              background: "#0F172A",
              textAlign: "center",
              padding: "9px 0",
              marginTop: 12,
              fontSize: 12,
              fontWeight: 700,
              color: "#F59E0B",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            ⚡ Trial Edition Custom Stamp
          </div>
        )}

      </div>
    );
  }
);

PostCard.displayName = "PostCard";
export default PostCard;