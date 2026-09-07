export type ContentItem = {
  id: string;
  title: string;
  type: "Instagram Post" | "Patient Education" | "Blog Article";
  specialty: string;
  tone: string;
  topic: string;
  body: string;
  createdAt: string;
};

export const sampleContent: ContentItem[] = [
  {
    id: "c1",
    title: "5 Habits for a Brighter Smile",
    type: "Instagram Post",
    specialty: "Dentist",
    tone: "Friendly",
    topic: "Daily oral hygiene",
    body:
      "✨ A brighter smile starts with small daily habits!\n\n1. Brush twice a day (2 min each!)\n2. Floss before bed\n3. Swap soda for water\n4. Visit your dentist every 6 months\n5. Replace your toothbrush every 3 months\n\nWhich one will you start today? 🦷💙\n\n#DentalCare #HealthySmile",
    createdAt: "2025-06-14T10:24:00Z",
  },
  {
    id: "c2",
    title: "Understanding High Blood Pressure",
    type: "Patient Education",
    specialty: "Cardiologist",
    tone: "Educational",
    topic: "Hypertension basics",
    body:
      "High blood pressure, also called hypertension, often has no symptoms but quietly damages your heart and arteries.\n\nNormal: below 120/80 mmHg\nElevated: 120–129 / below 80\nStage 1: 130–139 / 80–89\nStage 2: 140+ / 90+\n\nLifestyle steps that help: reduce sodium, walk 30 minutes daily, manage stress, sleep 7–8 hours, and take medications as prescribed. Schedule a check-up if your readings stay elevated for more than a week.",
    createdAt: "2025-06-12T08:15:00Z",
  },
  {
    id: "c3",
    title: "Acne Myths vs. Facts",
    type: "Blog Article",
    specialty: "Dermatologist",
    tone: "Professional",
    topic: "Common acne misconceptions",
    body:
      "Acne is one of the most misunderstood skin conditions. Let's separate myth from fact.\n\nMyth: Chocolate causes acne.\nFact: No single food directly causes acne, though high-glycemic diets may worsen it.\n\nMyth: Sun exposure clears breakouts.\nFact: It dries the surface but increases long-term inflammation and pigmentation.\n\nMyth: Scrubbing harder helps.\nFact: Over-exfoliation damages the skin barrier and worsens breakouts.\n\nA dermatologist-guided routine with gentle cleansing, targeted actives, and SPF remains the gold standard.",
    createdAt: "2025-06-10T16:42:00Z",
  },
  {
    id: "c4",
    title: "Monsoon Health Tips",
    type: "Instagram Post",
    specialty: "General Physician",
    tone: "Friendly",
    topic: "Staying healthy in monsoon",
    body:
      "☔ Monsoon is here — stay healthy with these simple tips:\n\n• Drink only boiled or filtered water\n• Avoid raw street food\n• Wash hands often\n• Keep mosquito repellent handy\n• Eat warm, freshly cooked meals\n\nStay safe, stay smiling! 💙\n\n#MonsoonHealth #StaySafe",
    createdAt: "2025-06-08T12:00:00Z",
  },
  {
    id: "c5",
    title: "What to Expect at Your First Dental Visit",
    type: "Patient Education",
    specialty: "Dentist",
    tone: "Educational",
    topic: "First dental appointment",
    body:
      "Your first dental visit is a friendly conversation about your oral health. Here's what happens:\n\n1. Medical & dental history review\n2. Gentle examination of teeth & gums\n3. X-rays if needed\n4. Professional cleaning\n5. Personalized care plan\n\nThe entire visit usually takes 45–60 minutes. Feel free to ask any questions — we're here to help!",
    createdAt: "2025-06-05T09:30:00Z",
  },
];

export const specialties = [
  "Dentist",
  "Dermatologist",
  "Cardiologist",
  "General Physician",
  "Pediatrician",
  "Orthodontist",
  "Gynecologist",
  "Ayurvedic Doctor",
  "Homeopathic Doctor",
  "Physiotherapist",
  "Nutritionist",
  "ENT Specialist",
];
export const contentTypes = [
  "Instagram Post",
  "Patient Education",
  "Blog Article",
  "Health Awareness Post",
  "Caption",
  "Greeting / Festival Post",
  "Reel Script",
] as const;
export const tones = ["Standard", "Professional", "Educational", "Friendly", "Motivational"];
export const audiences = [
  "Patients",
  "General Public",
  "Existing Patients",
  "Parents",
  "Healthcare Professionals",
];

export const festivals = [
  "Diwali",
  "New Year",
  "Doctor's Day",
  "Independence Day",
  "Christmas",
  "World Health Day",
  "Women's Day",
  "Mother's Day",
];

/* ------------- Content Categories ------------- */

export type ContentCategory =
  | "educational"
  | "myth-fact"
  | "did-you-know"
  | "patient-faq"
  | "health-tips"
  | "warning-signs"
  | "prevention"
  | "doctor-explains"
  | "awareness"
  | "clinic-promo"
  | "greeting"
  | "reel-hook";

export const contentCategories: {
  id: ContentCategory;
  title: string;
  tagline: string;
  emoji: string;
  /** Workflow kinds where this category shines (UI hint only) */
  bestFor: WorkflowKind[];
}[] = [
  { id: "educational", title: "Educational", tagline: "Teach a concept simply", emoji: "📘", bestFor: ["single", "carousel", "reel"] },
  { id: "myth-fact", title: "Myth vs Fact", tagline: "Bust a common myth", emoji: "⚖️", bestFor: ["carousel", "single", "reel"] },
  { id: "did-you-know", title: "Did You Know?", tagline: "Eye-opening fact", emoji: "💡", bestFor: ["single", "story", "reel"] },
  { id: "patient-faq", title: "Patient FAQ", tagline: "Answer a real question", emoji: "❓", bestFor: ["carousel", "single"] },
  { id: "health-tips", title: "Health Tips", tagline: "Quick actionable tips", emoji: "✅", bestFor: ["carousel", "single", "reel"] },
  { id: "warning-signs", title: "Warning Signs", tagline: "When to seek care", emoji: "⚠️", bestFor: ["carousel", "single", "reel", "template"] },
  { id: "prevention", title: "Prevention Tips", tagline: "Stay ahead of disease", emoji: "🛡️", bestFor: ["carousel", "single"] },
  { id: "doctor-explains", title: "Clinician Explains", tagline: "Authority-led explainer", emoji: "🩺", bestFor: ["reel", "single", "carousel"] },
  { id: "awareness", title: "Awareness Campaign", tagline: "Build movement around a cause", emoji: "📣", bestFor: ["campaign", "single", "template"] },
  { id: "clinic-promo", title: "Clinic Promotion", tagline: "Highlight services & offers", emoji: "🏥", bestFor: ["single", "story", "carousel", "template"] },
  { id: "greeting", title: "Greeting Post", tagline: "Festive & occasion wishes", emoji: "🎉", bestFor: ["festive", "single", "story"] },
  { id: "reel-hook", title: "Reel Hook", tagline: "3-second scroll stopper", emoji: "🎬", bestFor: ["reel", "story"] },
];

export function defaultCategoryFor(kind: WorkflowKind): ContentCategory {
  switch (kind) {
    case "carousel": return "myth-fact";
    case "story": return "did-you-know";
    case "reel": return "reel-hook";
    case "campaign": return "awareness";
    case "festive": return "greeting";
    case "template": return "clinic-promo";
    default: return "educational";
  }
}

export type WorkflowKind =
  | "single"
  | "carousel"
  | "story"
  | "reel"
  | "campaign"
  | "festive"
  | "template";

// A campaign's per-day `format` (see the `weeklySchedule` entries in
// generate.functions.ts's Campaign type) is free text the AI writes — e.g.
// "Carousel", "Single Post", "Reel" — not a WorkflowKind, and it's never
// validated against one. This maps it to a real WorkflowKind only when it
// clearly matches one of the "Create Now" targets (Poster/Post/Carousel);
// anything else (Reel, Story, unrecognized) returns null so no Create Now
// action is offered for that day. Check "poster"/"template" before
// "single"/"post" since "poster" contains "post" as a substring. Shared by
// Content Studio's own per-day Create Now (src/routes/_app.generate.tsx,
// CampaignPreview) and Content History's campaign detail view
// (src/routes/_app.history.tsx) so the two stay in sync.
export function mapCampaignFormatToKind(format: string): WorkflowKind | null {
  const f = format.trim().toLowerCase();
  if (!f) return null;
  if (f.includes("carousel")) return "carousel";
  if (f.includes("poster") || f.includes("template")) return "template";
  if (f.includes("single") || f.includes("post")) return "single";
  return null;
}

export const workflows: {
  kind: WorkflowKind;
  title: string;
  tagline: string;
  icon: string;
  badge?: string;
}[] = [
  { kind: "single", title: "Single Post", tagline: "One scroll-stopping post", icon: "square" },
  { kind: "carousel", title: "Carousel Post", tagline: "2–10 swipeable slides", icon: "layers" },
  { kind: "story", title: "Story", tagline: "9:16 vertical story", icon: "smartphone" },
  { kind: "reel", title: "Reel Script", tagline: "Hook · Points · CTA", icon: "film" },
  { kind: "campaign", title: "Awareness Campaign", tagline: "Weekly content plan", icon: "calendar" },
  { kind: "festive", title: "Festive Wishes", tagline: "Greetings for any occasion", icon: "sparkles" },
  { kind: "template", title: "Template Post", tagline: "Ready-made promo designs", icon: "layout", badge: "Growth" },
];

export function generateMockContent(opts: {
  specialty: string;
  type: string;
  topic: string;
  tone: string;
}): string {
  const { specialty, type, topic, tone } = opts;
  if (type === "Instagram Post") {
    return `✨ ${topic} — from your ${specialty.toLowerCase()} 💙\n\nHere are 3 things you should know:\n\n1. Small daily habits make the biggest difference\n2. Consistency beats intensity\n3. Always consult a professional for personalized care\n\nSave this post & share with someone who needs it! 👇\n\n#${specialty.replace(/\s+/g, "")} #HealthTips #Medipost`;
  }
  if (type === "Patient Education") {
    return `${topic} — A patient guide\n\nAs a ${specialty.toLowerCase()}, I often get asked about ${topic.toLowerCase()}. Here's what every patient should understand:\n\n• What it is: a clear, simple explanation tailored to you.\n• Why it matters: how it affects your day-to-day health.\n• What to do: practical, evidence-based next steps.\n• When to seek help: warning signs to never ignore.\n\nThis material is for education only and does not replace a personal consultation. Tone: ${tone}.`;
  }
  return `# ${topic}\n\nWritten by your ${specialty}.\n\nIn today's article, we'll explore ${topic.toLowerCase()} in depth — what the latest research says, what it means for your daily life, and how to make informed decisions about your care.\n\n## The basics\nA concise, ${tone.toLowerCase()} overview that sets the stage.\n\n## What the evidence shows\nA summary of current clinical understanding, written in plain language.\n\n## Practical takeaways\nThree to five clear actions you can apply this week.\n\n## When to consult a professional\nKey signs that warrant a visit to your ${specialty.toLowerCase()}.\n\n*Disclaimer: This article is informational and not a substitute for medical advice.*`;
}