import type { WorkflowKind } from "@/lib/mock-data";

/**
 * Example topics shown as an animated placeholder in the Topic/Prompt field —
 * pure inspiration for a doctor staring at a blank box, never written into
 * the actual value. Keyed by specialty so the examples feel relevant;
 * unknown/custom specialties fall back to a generic list.
 */
const TOPIC_EXAMPLES_BY_SPECIALTY: Record<string, string[]> = {
  Dentist: [
    "Root canal myths",
    "How often to change your toothbrush",
    "Signs of gum disease",
    "Do's and don'ts after a tooth extraction",
    "Is teeth whitening safe?",
  ],
  Dermatologist: [
    "Common acne myths",
    "How to choose the right sunscreen",
    "Warning signs of skin cancer",
    "Skincare routine for oily skin",
    "Is dry skin a sign of something bigger?",
  ],
  Cardiologist: [
    "Warning signs of a heart attack",
    "Managing high blood pressure",
    "How much cardio is enough?",
    "Cholesterol myths busted",
    "Heart-healthy diet tips",
  ],
  "General Physician": [
    "When a fever needs a doctor visit",
    "Common cold vs flu",
    "Why annual check-ups matter",
    "Managing seasonal allergies",
    "Staying hydrated in summer",
  ],
  Pediatrician: [
    "Vaccination schedule myths",
    "Signs your child needs to see a doctor",
    "Managing a child's fever at home",
    "Healthy screen time habits for kids",
    "Common childhood nutrition mistakes",
  ],
  Orthodontist: [
    "Right age to start braces",
    "Invisalign vs traditional braces",
    "How to care for braces",
    "Signs your child needs an orthodontist",
    "How long braces really take",
  ],
  Gynecologist: [
    "Menstrual cycle myths",
    "Why regular pap smears matter",
    "Managing PCOS naturally",
    "Pregnancy myths vs facts",
    "When to see a gynecologist",
  ],
};

const GENERAL_TOPIC_FALLBACK = [
  "A common myth in your field",
  "Preventive care tips for patients",
  "A warning sign patients often overlook",
  "Answering a frequent patient question",
  "One simple daily health habit",
];

const CAMPAIGN_EXAMPLES_BY_SPECIALTY: Record<string, string[]> = {
  Dentist: ["Oral health awareness month", "World Oral Health Day campaign", "National Smile Week"],
  Dermatologist: ["Skin cancer awareness month", "Sun safety awareness week", "Healthy skin campaign"],
  Cardiologist: ["Heart health awareness month", "World Heart Day campaign", "Blood pressure awareness week"],
  "General Physician": ["Immunization awareness month", "Preventive health check-up drive", "Flu season awareness campaign"],
  Pediatrician: ["Child nutrition awareness month", "Vaccination awareness drive", "Back-to-school health campaign"],
  Orthodontist: ["Braces awareness month", "Smile confidence campaign", "Teen orthodontic care month"],
  Gynecologist: ["Women's health awareness month", "Cervical cancer awareness month", "PCOS awareness campaign"],
};

const CAMPAIGN_FALLBACK = [
  "Preventive health awareness month",
  "Community health check-up drive",
  "Patient education campaign",
];

const FESTIVE_MESSAGE_EXAMPLES = [
  "Wish patients good health this season",
  "Thank patients for trusting us this year",
  "Invite patients for a festive health check-up",
  "Celebrate wellness this holiday season",
  "Share festive greetings from the clinic team",
];

/** Which example set to cycle through, based on the active workflow + chosen specialty. */
export function getTopicExamples(kind: WorkflowKind, specialty: string): string[] {
  if (kind === "festive") return FESTIVE_MESSAGE_EXAMPLES;
  if (kind === "campaign") return CAMPAIGN_EXAMPLES_BY_SPECIALTY[specialty] ?? CAMPAIGN_FALLBACK;
  return TOPIC_EXAMPLES_BY_SPECIALTY[specialty] ?? GENERAL_TOPIC_FALLBACK;
}
