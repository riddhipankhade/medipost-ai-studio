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
  Bone,
  Ear,
  Dna,
  FlaskConical,
  Thermometer,
  Droplets,
  Zap,
  Wind,
  Scan,
  Bandage,
  type LucideIcon,
} from "lucide-react";

export type CarouselTheme = {
  id: string;
  name: string;
  tagline: string;
  bg: string;
  text: string;
  heading: string;
  accent: string;
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
  { id: "centered",          name: "Centered Content",      description: "Headline + body, centered" },
  { id: "image-left",        name: "Image Left + Text Right", description: "Visual area on the left" },
  { id: "full-image",        name: "Full Background Image", description: "Photo backdrop, text overlay" },
  { id: "split",             name: "Split Layout",          description: "Color band + content panel" },
  { id: "modern-card",       name: "Modern Card",           description: "Floating glass card on bg" },
  { id: "hero-card",         name: "Hero Card",             description: "One dominant illustration + message" },
  { id: "icon-grid",         name: "Icon Grid",             description: "3-6 items with icons, grid layout" },
  { id: "statistic-hero",    name: "Statistic Hero",        description: "One large stat, minimal text" },
  { id: "comparison-split",  name: "Comparison Split",      description: "Two-column myth vs fact" },
  { id: "process-flow",      name: "Process Flow",          description: "Numbered sequential steps" },
  { id: "callout-diagram",   name: "Callout Diagram",       description: "Anatomical / warning callouts" },
  { id: "timeline",          name: "Timeline",              description: "Staged progression markers" },
  { id: "faq-card",          name: "FAQ Card",              description: "Question then answer" },
  { id: "checklist",         name: "Checklist",             description: "Vertical list with check markers" },
  { id: "radial-diagram",    name: "Radial Diagram",        description: "Central illustration with radiating labels" },
];

export const fontFamilies = [
  { id: "'Inter', system-ui, sans-serif",       name: "Inter (Sans)" },
  { id: "'Playfair Display', Georgia, serif",   name: "Playfair (Serif)" },
  { id: "'Nunito', 'Inter', sans-serif",        name: "Nunito (Rounded)" },
  { id: "'Poppins', 'Inter', sans-serif",       name: "Poppins (Modern)" },
  { id: "'DM Serif Display', Georgia, serif",   name: "DM Serif (Editorial)" },
];

/**
 * Specialty → decorative icon set.
 * Index 0 = primary icon (largest, most prominent).
 * Indexes 1-3 = supporting icons for the background pattern.
 *
 * Rules:
 *  - Every icon must be directly relevant to the specialty — no generic
 *    stethoscopes for cardiologists, no pill bottles for dentists.
 *  - Primary icon should be instantly recognisable for that specialty.
 *  - Keys must match the strings used in SpecialtySelect exactly.
 */
export const specialtyIcons: Record<string, LucideIcon[]> = {
  // ── Dental ──────────────────────────────────────────────────────────────
  "Dentist":                    [Smile, Sparkles, ShieldPlus, Cross],
  "Orthodontist":               [Smile, Bone, Sparkles, ShieldPlus],
  "Oral & Maxillofacial Surgeon": [Smile, Cross, Syringe, ShieldPlus],
  "Periodontist":               [Smile, ShieldPlus, Sparkles, Cross],
  "Endodontist":                [Smile, Cross, ShieldPlus, Sparkles],
  "Prosthodontist":             [Smile, Sparkles, ShieldPlus, Cross],

  // ── Cardiology ──────────────────────────────────────────────────────────
  "Cardiologist":               [Heart, HeartPulse, Activity, Stethoscope],
  "Cardiac Surgeon":            [Heart, Cross, Activity, Syringe],
  "Interventional Cardiologist":[HeartPulse, Heart, Activity, Scan],

  // ── Neurology ───────────────────────────────────────────────────────────
  "Neurologist":                [Brain, Zap, Activity, Stethoscope],
  "Neurosurgeon":               [Brain, Cross, Scan, Activity],
  "Psychiatrist":               [Brain, Heart, Sparkles, Activity],
  "Psychologist":               [Brain, Heart, Sparkles, Zap],

  // ── Pediatrics ──────────────────────────────────────────────────────────
  "Pediatrician":               [Baby, Heart, Smile, ShieldPlus],
  "Neonatologist":              [Baby, Heart, ShieldPlus, Stethoscope],
  "Pediatric Surgeon":          [Baby, Cross, ShieldPlus, Syringe],

  // ── Women's Health ──────────────────────────────────────────────────────
  "Gynecologist":               [Heart, ShieldPlus, Activity, Cross],
  "Obstetrician":               [Baby, Heart, ShieldPlus, Cross],
  "Gynecologist / Obstetrician":[Baby, Heart, ShieldPlus, Activity],
  "Fertility Specialist":       [Heart, Dna, Sparkles, ShieldPlus],

  // ── Skin & Hair ─────────────────────────────────────────────────────────
  "Dermatologist":              [Sparkles, Eye, ShieldPlus, Cross],
  "Cosmetologist":              [Sparkles, Eye, Heart, ShieldPlus],
  "Trichologist":               [Sparkles, ShieldPlus, Activity, Cross],
  "Plastic Surgeon":            [Sparkles, Cross, ShieldPlus, Syringe],
  "Cosmetic Surgeon":           [Sparkles, Eye, Cross, ShieldPlus],

  // ── Eyes ────────────────────────────────────────────────────────────────
  "Ophthalmologist":            [Eye, Scan, ShieldPlus, Cross],
  "Optometrist":                [Eye, Sparkles, ShieldPlus, Scan],

  // ── ENT ─────────────────────────────────────────────────────────────────
  "ENT Specialist":             [Ear, Stethoscope, ShieldPlus, Cross],
  "Otolaryngologist":           [Ear, Activity, ShieldPlus, Cross],

  // ── Orthopedics ─────────────────────────────────────────────────────────
  "Orthopedic Surgeon":         [Bone, Activity, Cross, ShieldPlus],
  "Spine Surgeon":              [Bone, Scan, Cross, Activity],
  "Physiotherapist":            [Activity, Bone, Heart, ShieldPlus],
  "Rheumatologist":             [Bone, Activity, ShieldPlus, Cross],
  "Sports Medicine":            [Activity, Heart, ShieldPlus, Bone],

  // ── Respiratory ─────────────────────────────────────────────────────────
  "Pulmonologist":              [Wind, Activity, Stethoscope, ShieldPlus],
  "Chest Physician":            [Wind, Stethoscope, Activity, Cross],

  // ── Gastro / Liver ──────────────────────────────────────────────────────
  "Gastroenterologist":         [Activity, Stethoscope, ShieldPlus, Microscope],
  "Hepatologist":               [Activity, Microscope, ShieldPlus, Cross],
  "Colorectal Surgeon":         [Activity, Cross, ShieldPlus, Stethoscope],
  "Bariatric Surgeon":          [Activity, Cross, ShieldPlus, Heart],

  // ── Urology & Nephrology ────────────────────────────────────────────────
  "Urologist":                  [Droplets, Activity, ShieldPlus, Cross],
  "Nephrologist":               [Droplets, Activity, Stethoscope, ShieldPlus],
  "Andrologist":                [Activity, ShieldPlus, Cross, Stethoscope],

  // ── Endocrinology & Metabolism ──────────────────────────────────────────
  "Endocrinologist":            [Activity, Thermometer, Pill, ShieldPlus],
  "Diabetologist":              [Droplets, Pill, Activity, HeartPulse],

  // ── Oncology ────────────────────────────────────────────────────────────
  "Oncologist":                 [Microscope, Dna, Cross, ShieldPlus],
  "Surgical Oncologist":        [Cross, Microscope, Dna, ShieldPlus],
  "Radiation Oncologist":       [Scan, Dna, Cross, ShieldPlus],
  "Hematologist":               [Droplets, Microscope, Activity, Cross],

  // ── General & Emergency ─────────────────────────────────────────────────
  "General Physician":          [Stethoscope, Cross, Pill, ShieldPlus],
  "General Surgeon":            [Cross, ShieldPlus, Syringe, Stethoscope],
  "Emergency Medicine":         [Cross, Activity, Syringe, ShieldPlus],
  "Anesthesiologist":           [Syringe, Activity, ShieldPlus, Cross],
  "Intensivist":                [Activity, HeartPulse, Syringe, Cross],

  // ── Diagnostics ─────────────────────────────────────────────────────────
  "Radiologist":                [Scan, Microscope, Activity, Cross],
  "Pathologist":                [Microscope, FlaskConical, Dna, Cross],
  "Lab Medicine":               [FlaskConical, Microscope, Dna, Activity],

  // ── Alternative / Integrative ───────────────────────────────────────────
  "Ayurvedic Doctor":           [Sparkles, Heart, ShieldPlus, Pill],
  "Homeopathic Doctor":         [Pill, Sparkles, Heart, Cross],
  "Naturopath":                 [Sparkles, Heart, Activity, ShieldPlus],
  "Unani Practitioner":         [Sparkles, Pill, Heart, ShieldPlus],

  // ── Vascular & Thoracic ─────────────────────────────────────────────────
  "Vascular Surgeon":           [Activity, Heart, Cross, Stethoscope],
  "Thoracic Surgeon":           [Wind, Cross, Heart, Syringe],

  // ── Other ───────────────────────────────────────────────────────────────
  "Geriatrician":               [Heart, Stethoscope, ShieldPlus, Pill],
  "Immunologist":               [ShieldPlus, Dna, Microscope, Cross],
  "Allergist":                  [ShieldPlus, Activity, Cross, Stethoscope],
  "Nutritionist":               [Heart, Activity, Sparkles, ShieldPlus],
  "Dietitian":                  [Activity, Heart, ShieldPlus, Sparkles],
  "Occupational Therapist":     [Activity, Heart, ShieldPlus, Sparkles],
  "Speech Therapist":           [Activity, Smile, Heart, ShieldPlus],
  "Sexologist":                 [Heart, ShieldPlus, Activity, Cross],

  // ── Fallback ────────────────────────────────────────────────────────────
  "Default":                    [Stethoscope, Cross, Heart, ShieldPlus],
};

/**
 * Returns the icon set for a specialty, with fuzzy fallback:
 * 1. Exact match
 * 2. Partial match (e.g. "Cardio" matches "Cardiologist")
 * 3. Default
 */
export function iconsFor(specialty: string): LucideIcon[] {
  if (!specialty) return specialtyIcons.Default;

  // Exact match
  if (specialtyIcons[specialty]) return specialtyIcons[specialty];

  // Partial match — find first key that includes the specialty string or vice versa
  const lower = specialty.toLowerCase();
  const match = Object.keys(specialtyIcons).find(
    (key) => key !== "Default" && (
      key.toLowerCase().includes(lower) ||
      lower.includes(key.toLowerCase().split(" ")[0])  // first word match
    )
  );
  if (match) return specialtyIcons[match];

  return specialtyIcons.Default;
}

export function primaryIconFor(specialty: string): LucideIcon {
  return iconsFor(specialty)[0];
}

/** Suggest a theme id based on specialty (used as a smart default). */
export function suggestThemeId(specialty: string): string {
  const s = specialty.toLowerCase();

  if (s.includes("dent") || s.includes("ortho") || s.includes("perio") || s.includes("endo") || s.includes("prostho"))
    return "dental-premium";

  if (s.includes("pediatric") || s.includes("neonat") || s.includes("child"))
    return "pediatric-friendly";

  if (s.includes("dermat") || s.includes("cosmet") || s.includes("aesthetic") || s.includes("plastic") || s.includes("trichol"))
    return "luxury-aesthetic";

  if (s.includes("cardio") || s.includes("cardiac") || s.includes("heart"))
    return "clinical-blue";

  if (s.includes("neuro") || s.includes("psych") || s.includes("brain"))
    return "clinical-blue";

  if (s.includes("onco") || s.includes("hemato") || s.includes("cancer"))
    return "clinical-blue";

  return "modern-healthcare";
}

export function getTheme(id: string): CarouselTheme {
  return carouselThemes.find((t) => t.id === id) ?? carouselThemes[0];
}

export type AiImageProvider = "gemini" | "imagen" | "dall-e";

export interface SlideImageRequest {
  specialty: string;
  slideTitle: string;
  slideBody: string;
  themeId: string;
  provider?: AiImageProvider;
}

export async function generateSlideImage(_req: SlideImageRequest): Promise<string | null> {
  return null;
}