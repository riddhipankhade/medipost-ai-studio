import {
  Heart,
  Stethoscope,
  Activity,
  Pill,
  Brain,
  Baby,
  Smile,
  Sparkles,
  ShieldPlus,
  Cross,
  Syringe,
  Eye,
  HeartPulse,
  Microscope,
  type LucideIcon,
} from "lucide-react";

export type CarouselTheme = {
  id: string;
  name: string;
  tagline: string;
  bg: string; // CSS background (gradient)
  text: string; // body text color
  heading: string; // heading color
  accent: string; // accent/CTA color
  fontFamily: string;
  iconOpacity: number;
};

export const carouselThemes: CarouselTheme[] = [
  {
    id: "clinical-blue",
    name: "Clinical Blue",
    tagline: "Trustworthy, hospital-clean",
    bg: "linear-gradient(135deg, #0b3d91 0%, #1f6feb 60%, #4ea8ff 100%)",
    text: "#eaf3ff",
    heading: "#ffffff",
    accent: "#ffd166",
    fontFamily: "'Inter', system-ui, sans-serif",
    iconOpacity: 0.12,
  },
  {
    id: "dental-premium",
    name: "Dental Premium",
    tagline: "Soft mint · pearl white",
    bg: "linear-gradient(135deg, #f0fbf8 0%, #d8f3ec 50%, #a8e6d1 100%)",
    text: "#0f3d3a",
    heading: "#073b3a",
    accent: "#0E7C7B",
    fontFamily: "'Playfair Display', Georgia, serif",
    iconOpacity: 0.18,
  },
  {
    id: "modern-healthcare",
    name: "Modern Healthcare",
    tagline: "Teal · slate · airy",
    bg: "linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #14b8a6 100%)",
    text: "#ecfdf5",
    heading: "#ffffff",
    accent: "#facc15",
    fontFamily: "'Inter', system-ui, sans-serif",
    iconOpacity: 0.14,
  },
  {
    id: "pediatric-friendly",
    name: "Pediatric Friendly",
    tagline: "Warm · playful · kid-safe",
    bg: "linear-gradient(135deg, #fff1f2 0%, #ffd6a5 50%, #fdba74 100%)",
    text: "#7c2d12",
    heading: "#9a3412",
    accent: "#ef4444",
    fontFamily: "'Nunito', 'Inter', sans-serif",
    iconOpacity: 0.22,
  },
  {
    id: "luxury-aesthetic",
    name: "Luxury Aesthetic",
    tagline: "Champagne · charcoal",
    bg: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #4a3f35 100%)",
    text: "#e8d9b8",
    heading: "#f5e6c8",
    accent: "#c9a96e",
    fontFamily: "'Playfair Display', Georgia, serif",
    iconOpacity: 0.1,
  },
  {
    id: "minimal-professional",
    name: "Minimal Professional",
    tagline: "Crisp · clean · editorial",
    bg: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #e5e5e5 100%)",
    text: "#1f2937",
    heading: "#0a0a0a",
    accent: "#0E7C7B",
    fontFamily: "'Inter', system-ui, sans-serif",
    iconOpacity: 0.08,
  },
];

export type SlideLayout =
  | "centered"
  | "image-left"
  | "full-image"
  | "split"
  | "modern-card"
  | "hero-card"
  | "icon-grid"
  | "statistic-hero"
  | "comparison-split"
  | "process-flow"
  | "callout-diagram"
  | "timeline"
  | "faq-card"
  | "checklist"
  | "radial-diagram";

export const slideLayouts: { id: SlideLayout; name: string; description: string }[] = [
  { id: "centered", name: "Centered Content", description: "Headline + body, centered" },
  { id: "image-left", name: "Image Left + Text Right", description: "Visual area on the left" },
  { id: "full-image", name: "Full Background Image", description: "Photo backdrop, text overlay" },
  { id: "split", name: "Split Layout", description: "Color band + content panel" },
  { id: "modern-card", name: "Modern Card", description: "Floating glass card on bg" },
  { id: "hero-card", name: "Hero Card", description: "One dominant illustration + message" },
  { id: "icon-grid", name: "Icon Grid", description: "3-6 items with icons, grid layout" },
  { id: "statistic-hero", name: "Statistic Hero", description: "One large stat, minimal text" },
  { id: "comparison-split", name: "Comparison Split", description: "Two-column myth vs fact" },
  { id: "process-flow", name: "Process Flow", description: "Numbered sequential steps" },
  { id: "callout-diagram", name: "Callout Diagram", description: "Anatomical / warning callouts" },
  { id: "timeline", name: "Timeline", description: "Staged progression markers" },
  { id: "faq-card", name: "FAQ Card", description: "Question then answer" },
  { id: "checklist", name: "Checklist", description: "Vertical list with check markers" },
  { id: "radial-diagram", name: "Radial Diagram", description: "Central illustration with radiating labels" },
];

export const fontFamilies = [
  { id: "'Inter', system-ui, sans-serif", name: "Inter (Sans)" },
  { id: "'Playfair Display', Georgia, serif", name: "Playfair (Serif)" },
  { id: "'Nunito', 'Inter', sans-serif", name: "Nunito (Rounded)" },
  { id: "'Poppins', 'Inter', sans-serif", name: "Poppins (Modern)" },
  { id: "'DM Serif Display', Georgia, serif", name: "DM Serif (Editorial)" },
];

/** Specialty → suggested decorative icons + primary symbol */
export const specialtyIcons: Record<string, LucideIcon[]> = {
  Dentist: [Smile, Sparkles, ShieldPlus, Cross],
  Orthodontist: [Smile, Sparkles, ShieldPlus, Activity],
  Dermatologist: [Sparkles, ShieldPlus, Eye, Cross],
  Cardiologist: [Heart, HeartPulse, Activity, Stethoscope],
  "General Physician": [Stethoscope, Cross, Pill, ShieldPlus],
  Pediatrician: [Baby, Heart, Smile, ShieldPlus],
  Gynecologist: [Heart, ShieldPlus, Cross, Activity],
  Neurologist: [Brain, Activity, Stethoscope, Cross],
  Default: [Stethoscope, Cross, Heart, ShieldPlus],
};

export function iconsFor(specialty: string): LucideIcon[] {
  return specialtyIcons[specialty] ?? specialtyIcons.Default;
}

export function primaryIconFor(specialty: string): LucideIcon {
  return iconsFor(specialty)[0];
}

/** Suggest a theme id based on specialty (used as a smart default). */
export function suggestThemeId(specialty: string): string {
  if (specialty === "Dentist" || specialty === "Orthodontist") return "dental-premium";
  if (specialty === "Pediatrician") return "pediatric-friendly";
  if (specialty === "Dermatologist") return "luxury-aesthetic";
  if (specialty === "Cardiologist") return "clinical-blue";
  return "modern-healthcare";
}

export function getTheme(id: string): CarouselTheme {
  return carouselThemes.find((t) => t.id === id) ?? carouselThemes[0];
}

/* Hooks for future AI image generation pipeline.
 * When connecting Gemini / Imagen / DALL-E, implement:
 *   generateSlideImage({ specialty, slideTitle, themeId }) -> Promise<string url>
 * and inject the returned url into <SlideCanvas imageUrl={...}>.
 */
export type AiImageProvider = "gemini" | "imagen" | "dall-e";
export interface SlideImageRequest {
  specialty: string;
  slideTitle: string;
  slideBody: string;
  themeId: string;
  provider?: AiImageProvider;
}
export async function generateSlideImage(_req: SlideImageRequest): Promise<string | null> {
  // Not implemented in the prototype — UI shows a placeholder image area.
  return null;
}