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
  "Ayurvedic Doctor": [
    "Everyday Ayurvedic tips for better digestion",
    "Balancing your dosha through the seasons",
    "Myths about Ayurvedic medicine",
    "Simple herbs for immunity",
    "Ayurveda vs modern medicine — how they work together",
  ],
  "Homeopathic Doctor": [
    "How homeopathy actually works",
    "Common homeopathy myths busted",
    "Managing seasonal allergies with homeopathy",
    "Is homeopathy safe for children?",
    "When homeopathy helps most",
  ],
  Physiotherapist: [
    "Fixing posture for desk workers",
    "Simple stretches for lower back pain",
    "When knee pain needs a physiotherapist",
    "Recovering faster after a sports injury",
    "Do's and don'ts after a sprain",
  ],
  Nutritionist: [
    "Reading food labels the right way",
    "Myths about weight-loss diets",
    "Building a balanced Indian thali",
    "Foods that actually boost immunity",
    "Sugar cravings — why they happen",
  ],
  "ENT Specialist": [
    "When an ear infection needs a doctor",
    "Managing chronic sinus problems",
    "Why you keep getting a sore throat",
    "Protecting your hearing from loud noise",
    "Home remedies for a blocked nose that work",
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
  "Ayurvedic Doctor": ["Ayurveda wellness awareness month", "Seasonal detox (Ritucharya) campaign", "Immunity through Ayurveda drive"],
  "Homeopathic Doctor": ["World Homeopathy Day campaign", "Gentle immunity awareness month", "Seasonal allergy relief campaign"],
  Physiotherapist: ["Posture awareness month", "Back-pain prevention campaign", "World Physiotherapy Day drive"],
  Nutritionist: ["Healthy eating awareness month", "Sugar-free challenge campaign", "Balanced-diet awareness week"],
  "ENT Specialist": ["Hearing health awareness month", "Sinus care awareness campaign", "World Hearing Day drive"],
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
