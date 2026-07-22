/**
 * src/components/illustrations/index.tsx
 *
 * Hand-authored flat/line-art medical illustrations. These are the primary
 * visual element for the new content-driven layout archetypes — text supports
 * the illustration, not the other way around (see design-tokens.ts illustrationStyle).
 *
 * Style contract: at most 2 colors (a `line` stroke color + an `accent` fill
 * tint) plus white, consistent stroke width, rounded line caps/joins.
 */
import type { SVGProps } from "react";
import { illustrationStyle } from "@/lib/design-tokens";

export type IllustrationProps = {
  /** stroke color */
  line?: string;
  /** fill tint for accent shapes (typically theme.accent at reduced opacity) */
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
};

function Svg({ children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
      {children}
    </svg>
  );
}

const sw = illustrationStyle.strokeWidth * 6; // scaled for a 200x200 viewBox

export function HeartIllustration({ line = "#111827", accent = "#ef4444", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.12} />
      <path
        d="M100 150C60 122 30 96 30 66c0-22 17-38 38-38 15 0 26 8 32 20 6-12 17-20 32-20 21 0 38 16 38 38 0 30-30 56-70 84Z"
        stroke={line} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round"
      />
      <path d="M55 88h22l12-20 16 34 12-20h20" stroke={accent} strokeWidth={sw * 0.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BrainIllustration({ line = "#111827", accent = "#8b5cf6", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.1} />
      <path
        d="M70 50c-18 0-30 14-28 30-10 6-14 20-6 30-6 12 2 26 16 28 4 14 20 22 34 16 14 6 30-2 34-16 14-2 22-16 16-28 8-10 4-24-6-30 2-16-10-30-28-30-8 0-14 4-16 10-2-6-8-10-16-10Z"
        stroke={line} strokeWidth={sw} strokeLinejoin="round"
      />
      <path d="M100 56v96M76 70c8 6 8 16 0 22M124 70c-8 6-8 16 0 22M64 108c10 2 16 10 16 20M136 108c-10 2-16 10-16 20"
        stroke={accent} strokeWidth={sw * 0.55} strokeLinecap="round" />
    </Svg>
  );
}

export function LungsIllustration({ line = "#111827", accent = "#14b8a6", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.1} />
      <path d="M100 46v34" stroke={line} strokeWidth={sw} strokeLinecap="round" />
      <path d="M100 80c-6-10-18-14-30-10-16 6-26 22-24 44 2 20 14 32 26 30 10-2 16-12 18-24"
        stroke={line} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M100 80c6-10 18-14 30-10 16 6 26 22 24 44-2 20-14 32-26 30-10-2-16-12-18-24"
        stroke={line} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="70" cy="104" r="8" fill={accent} />
      <circle cx="130" cy="104" r="8" fill={accent} />
    </Svg>
  );
}

export function KidneyIllustration({ line = "#111827", accent = "#f59e0b", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.1} />
      <path d="M78 50c-24 4-38 26-36 50 2 24 20 44 44 46 18 2 30-10 26-26-4-14-18-16-18-30 0-16 14-20 12-36-2-14-16-6-28-4Z"
        stroke={line} strokeWidth={sw} strokeLinejoin="round" />
      <ellipse cx="112" cy="100" rx="10" ry="16" fill={accent} />
    </Svg>
  );
}

export function ToothIllustration({ line = "#111827", accent = "#0ea5e9", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.1} />
      <path d="M100 44c-20 0-34 14-34 32 0 14 6 20 6 38 0 18 8 42 18 42 8 0 8-22 10-22s2 22 10 22c10 0 18-24 18-42 0-18 6-24 6-38 0-18-14-32-34-32Z"
        stroke={line} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M78 78c6-6 14-8 22-6" stroke={accent} strokeWidth={sw * 0.6} strokeLinecap="round" />
    </Svg>
  );
}

export function GlucoseMeterIllustration({ line = "#111827", accent = "#dc2626", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.1} />
      <rect x="66" y="56" width="68" height="100" rx="12" stroke={line} strokeWidth={sw} />
      <rect x="78" y="70" width="44" height="28" rx="4" fill={accent} opacity={0.85} />
      <path d="M86 116h28M86 128h28M86 140h16" stroke={line} strokeWidth={sw * 0.55} strokeLinecap="round" />
      <path d="M134 78l18-14" stroke={line} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

export function StethoscopeIllustration({ line = "#111827", accent = "var(--color-primary)", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.1} />
      <path d="M64 44v34c0 18 14 32 32 32s32-14 32-32V44" stroke={line} strokeWidth={sw} strokeLinecap="round" />
      <path d="M96 110v20c0 14 10 26 26 26 14 0 24-10 26-24" stroke={line} strokeWidth={sw} strokeLinecap="round" />
      <circle cx="148" cy="156" r="14" fill={accent} stroke={line} strokeWidth={sw * 0.6} />
      <circle cx="64" cy="40" r="8" fill={accent} />
      <circle cx="96" cy="40" r="8" fill={accent} />
    </Svg>
  );
}

export function BodyOutlineIllustration({ line = "#111827", accent = "#6366f1", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.1} />
      <circle cx="100" cy="46" r="16" stroke={line} strokeWidth={sw} />
      <path d="M100 62v50M100 82H70l-14 34M100 82h30l14 34M100 112l-18 46M100 112l18 46"
        stroke={line} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChecklistIllustration({ line = "#111827", accent = "#10b981", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.1} />
      <rect x="56" y="44" width="88" height="112" rx="10" stroke={line} strokeWidth={sw} />
      <rect x="80" y="36" width="40" height="16" rx="6" fill={accent} />
      {[72, 100, 128].map((y, i) => (
        <g key={i}>
          <rect x="68" y={y - 8} width="16" height="16" rx="4" stroke={accent} strokeWidth={sw * 0.6} />
          {i < 2 && <path d={`M71 ${y} l4 4 l7 -8`} stroke={accent} strokeWidth={sw * 0.6} strokeLinecap="round" strokeLinejoin="round" />}
          <path d={`M92 ${y}h44`} stroke={line} strokeWidth={sw * 0.55} strokeLinecap="round" />
        </g>
      ))}
    </Svg>
  );
}

export function TimelineMarkerIllustration({ line = "#111827", accent = "#3b82f6", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.1} />
      <path d="M40 100h120" stroke={line} strokeWidth={sw * 0.6} strokeLinecap="round" />
      {[40, 100, 160].map((x, i) => (
        <circle key={i} cx={x} cy={100} r={i === 1 ? 14 : 10} fill={i === 1 ? accent : "#fff"} stroke={line} strokeWidth={sw * 0.6} />
      ))}
      <rect x="70" y="50" width="60" height="24" rx="8" fill={accent} opacity={0.85} />
    </Svg>
  );
}

export function WarningTriangleIllustration({ line = "#111827", accent = "#f97316", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.14} />
      <path d="M100 40 172 158H28Z" stroke={line} strokeWidth={sw} strokeLinejoin="round" fill={accent} fillOpacity={0.18} />
      <path d="M100 82v36" stroke={line} strokeWidth={sw} strokeLinecap="round" />
      <circle cx="100" cy="134" r="6" fill={line} />
    </Svg>
  );
}

export function WellnessAbstractIllustration({ line = "#111827", accent = "var(--color-primary)", className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      <circle cx="100" cy="100" r="86" fill={accent} opacity={0.1} />
      <circle cx="100" cy="100" r="46" stroke={line} strokeWidth={sw} />
      <circle cx="100" cy="100" r="20" fill={accent} opacity={0.6} />
      <path d="M100 30v24M100 146v24M30 100h24M146 100h24" stroke={line} strokeWidth={sw * 0.6} strokeLinecap="round" />
    </Svg>
  );
}

export type IllustrationKey =
  | "heart" | "brain" | "lungs" | "kidney" | "tooth" | "glucose-meter"
  | "stethoscope" | "body-outline" | "checklist" | "timeline-marker"
  | "warning-triangle" | "wellness-abstract";

export const illustrations: Record<IllustrationKey, React.ComponentType<IllustrationProps>> = {
  "heart":             HeartIllustration,
  "brain":             BrainIllustration,
  "lungs":             LungsIllustration,
  "kidney":            KidneyIllustration,
  "tooth":             ToothIllustration,
  "glucose-meter":     GlucoseMeterIllustration,
  "stethoscope":       StethoscopeIllustration,
  "body-outline":      BodyOutlineIllustration,
  "checklist":         ChecklistIllustration,
  "timeline-marker":   TimelineMarkerIllustration,
  "warning-triangle":  WarningTriangleIllustration,
  "wellness-abstract": WellnessAbstractIllustration,
};

/** specialty -> ordered illustration keys, most relevant first (mirrors specialtyIcons in carousel-themes.ts) */
const SPECIALTY_ILLUSTRATIONS: Record<string, IllustrationKey[]> = {
  Dentist:             ["tooth", "wellness-abstract", "checklist"],
  Orthodontist:        ["tooth", "checklist", "wellness-abstract"],
  Dermatologist:       ["wellness-abstract", "body-outline", "checklist"],
  Cardiologist:        ["heart", "stethoscope", "wellness-abstract"],
  "General Physician": ["stethoscope", "body-outline", "wellness-abstract"],
  Pediatrician:        ["body-outline", "heart", "wellness-abstract"],
  Gynecologist:        ["heart", "wellness-abstract", "body-outline"],
  Neurologist:         ["brain", "body-outline", "wellness-abstract"],
  Default:             ["stethoscope", "wellness-abstract", "body-outline"],
};

const CATEGORY_ILLUSTRATION_OVERRIDE: Partial<Record<string, IllustrationKey>> = {
  "warning-signs": "warning-triangle",
  "prevention":    "checklist",
  "health-tips":   "checklist",
  "patient-faq":   "wellness-abstract",
};

/** topic keyword -> illustration key, highest-signal match wins */
const TOPIC_KEYWORDS: [RegExp, IllustrationKey][] = [
  [/diabet|glucose|sugar|blood sugar/i, "glucose-meter"],
  [/heart|cardiac|cardio/i, "heart"],
  [/brain|neuro|migraine|stroke/i, "brain"],
  [/lung|asthma|breath|respirat/i, "lungs"],
  [/kidney|renal/i, "kidney"],
  [/tooth|teeth|dental|oral/i, "tooth"],
  [/timeline|recovery|weeks?|days? after/i, "timeline-marker"],
  [/warning|emergency|danger|red flag/i, "warning-triangle"],
];

/**
 * Strips common medical specialty suffixes so that "neurology" and "neurologist"
 * both reduce to "neurolog" and fuzzy-match each other.
 */
function stemSpecialty(s: string): string {
  const l = s.toLowerCase().trim();
  if (l.endsWith("ologist")) return l.slice(0, -7); // neurologist  → neurolog
  if (l.endsWith("ology"))   return l.slice(0, -5); // neurology    → neurolog ✓
  if (l.endsWith("ician"))   return l.slice(0, -5); // pediatrician → pediat
  if (l.endsWith("ics"))     return l.slice(0, -3); // orthopedics  → orthoped
  if (l.endsWith("ist"))     return l.slice(0, -3); // therapist    → therap
  if (l.endsWith("ry"))      return l.slice(0, -2); // surgery      → surge
  return l;
}

/** Resolves the most relevant illustration for a given specialty/topic/category, with graceful fallback. */
export function illustrationFor(specialty: string, topic: string, category?: string): IllustrationKey {
  if (category && CATEGORY_ILLUSTRATION_OVERRIDE[category]) return CATEGORY_ILLUSTRATION_OVERRIDE[category]!;
  for (const [pattern, key] of TOPIC_KEYWORDS) {
    if (pattern.test(topic)) return key;
  }
  // Direct lookup first (fast path)
  if (SPECIALTY_ILLUSTRATIONS[specialty]) return SPECIALTY_ILLUSTRATIONS[specialty][0];
  // Fuzzy match: stem both sides so "neurology" matches "Neurologist"
  const needle = stemSpecialty(specialty);
  const match = Object.keys(SPECIALTY_ILLUSTRATIONS).find((key) => {
    const stem = stemSpecialty(key);
    return stem.includes(needle) || needle.includes(stem);
  });
  return (match ? SPECIALTY_ILLUSTRATIONS[match] : SPECIALTY_ILLUSTRATIONS.Default)[0];
}

export function IllustrationFor({ specialty, topic, category, ...props }: IllustrationProps & { specialty: string; topic: string; category?: string }) {
  const key = illustrationFor(specialty, topic, category);
  const Component = illustrations[key];
  return <Component {...props} />;
}