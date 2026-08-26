/**
 * src/lib/template-catalog-samples.ts
 *
 * Static, deterministic sample content for Template Studio's Post/Carousel/
 * Story catalog cards (templates #11-#30 in supabase/seed/003_template_catalog_v2.sql).
 * Poster cards (#1-#10) already have their own sample data
 * (TEMPLATE_SAMPLES in src/components/template-frames.tsx) and are unaffected.
 *
 * This is READ-ONLY preview content -- it is never sent to Gemini, never
 * generates a credit charge, and is never persisted. It exists purely so
 * /templates can show a real, representative rendering of what each catalog
 * entry produces, using the same rendering pipeline (resolveSinglePostStrategy /
 * resolveVisualStrategy + SlideCanvas, or StoryCard) real generations use --
 * see src/routes/_app.templates.tsx.
 *
 * Keyed by each row's fixed catalog UUID from 003_template_catalog_v2.sql
 * (not render_key, which is NULL for all of these -- see migration
 * 20240001000015). If a template's UUID ever changes in that seed file, its
 * sample here must move with it.
 *
 * Content follows the same medical-safety bar the catalog itself was audited
 * against: no invented statistics, no jurisdiction-specific healthcare rules,
 * no precise numeric claims beyond what's already in the approved catalog
 * copy. The one statistic used here (Stat Spotlight) is explicitly labeled
 * as an example with an example source, per the "evidence-driven, not
 * invented" architecture decision from Step 3B-1.
 */

export type PostSample = {
  headline: string;
  content: string;
  cta: string;
  specialty: string;
  topic: string;
};

export type CarouselSample = {
  slides: { title: string; content: string }[];
  cta: string;
  specialty: string;
  topic: string;
};

export type StorySample = {
  headline: string;
  message: string;
  cta: string;
  specialty: string;
};

// ── Post (11–18, 36–39) ──────────────────────────────────────────────────────
export const POST_SAMPLES: Record<string, PostSample> = {
  // 11 · Myth vs Fact Spotlight
  "00000000-0000-4000-8000-000000000011": {
    headline: "Sunscreen Doesn't Block All Vitamin D",
    content:
      "Myth: Wearing sunscreen daily stops your body from making vitamin D.\n\n" +
      "Fact: Most people still make some vitamin D through everyday, incidental sun exposure — even with sunscreen on — since coverage in real-world use is rarely complete. If you're concerned about your levels, a simple blood test can tell you where you stand.",
    cta: "Ask About Your Vitamin D Levels",
    specialty: "Dermatologist",
    topic: "Sunscreen and vitamin D",
  },
  // 12 · Did You Know / Stat Spotlight — statistic + source are always
  // user-supplied at generation time (see generate.functions.ts's
  // InputSchema superRefine); this sample explicitly labels itself as an
  // example so it's never mistaken for a verified live figure.
  "00000000-0000-4000-8000-000000000012": {
    headline: "A Number Worth Knowing",
    content:
      "Nearly 1 in 3 adults have high blood pressure — and many don't know it (Example source: WHO, 2023). Regular checks catch it early, before it becomes a bigger problem.",
    cta: "Book a BP Check",
    specialty: "Cardiologist",
    topic: "How common high blood pressure is",
  },
  // 13 · Patient FAQ
  "00000000-0000-4000-8000-000000000013": {
    headline: "Does Teeth Whitening Damage Enamel?",
    content:
      "In most cases, no — professional whitening performed under a dentist's guidance is not expected to weaken enamel. It temporarily affects the enamel surface, which is why some people notice short-term sensitivity that typically resolves on its own.",
    cta: "Ask About Safe Whitening",
    specialty: "Dentist",
    topic: "Does teeth whitening damage enamel?",
  },
  // 14 · Health Tips Checklist
  "00000000-0000-4000-8000-000000000014": {
    headline: "5 Habits Your Heart Will Thank You For",
    content:
      "Walk for 20 minutes daily\nCut back on added salt\nSleep 7–8 hours a night\nManage stress with short breaks\nSchedule your annual check-up",
    cta: "Book Your Check-Up",
    specialty: "General Physician",
    topic: "Everyday habits for better heart health",
  },
  // 15 · Prevention Focus
  "00000000-0000-4000-8000-000000000015": {
    headline: "4 Ways to Lower Your Risk",
    content:
      "Get screened on your doctor's recommended schedule\nAsk about the HPV vaccine if eligible\nAvoid smoking\nDon't skip your annual visit",
    cta: "Book Your Screening",
    specialty: "Gynecologist",
    topic: "Reducing cervical cancer risk",
  },
  // 16 · Editorial Column
  "00000000-0000-4000-8000-000000000016": {
    headline: "Understanding Chronic Migraine",
    content:
      "Chronic migraine means headaches on 15 or more days a month, with migraine features on at least 8 of those days. It's more than a bad headache — it's a distinct neurological condition, and it's manageable with the right treatment plan.",
    cta: "Book a Consultation",
    specialty: "Neurologist",
    topic: "What chronic migraine actually means",
  },
  // 17 · Blueprint Grid
  "00000000-0000-4000-8000-000000000017": {
    headline: "A Clear Path From Diagnosis to Recovery",
    content:
      "Every treatment plan starts with a precise diagnosis, moves through a tailored care plan, and ends with a measurable recovery milestone — no guesswork at any step.",
    cta: "Start Your Assessment",
    specialty: "Orthopedic Surgeon",
    topic: "How a structured treatment plan works",
  },
  // 18 · Torn Ticket
  "00000000-0000-4000-8000-000000000018": {
    headline: "Your Spot Is Reserved",
    content:
      "New patient slots are limited this month. Book your consultation and get a full assessment, a personalized plan, and answers to every question you bring.",
    cta: "Reserve Your Slot",
    specialty: "Dentist",
    topic: "Booking a limited new-patient consultation slot",
  },
  // 36 · Certified Seal
  "00000000-0000-4000-8000-000000000036": {
    headline: "Board-Certified Cardiac Care",
    content:
      "Every treatment plan here is led by a board-certified specialist and grounded in current clinical guidelines — care you can verify, not just trust.",
    cta: "Verify & Book",
    specialty: "Cardiologist",
    topic: "Board-certified, guideline-based cardiac care",
  },
  // 37 · Dossier Tab
  "00000000-0000-4000-8000-000000000037": {
    headline: "Your First Visit File",
    content:
      "On your first visit, we review your history, run a focused assessment, and open a file that follows you through every future appointment — nothing repeated, nothing lost.",
    cta: "Open Your File",
    specialty: "General Physician",
    topic: "What happens during a first-visit intake",
  },
  // 38 · Layered Frame
  "00000000-0000-4000-8000-000000000038": {
    headline: "Personalized Skin Care, Layer by Layer",
    content:
      "From diagnosis to treatment to long-term maintenance — your plan is built in stages, each one shaped by how your skin actually responds.",
    cta: "Start Your Plan",
    specialty: "Dermatologist",
    topic: "A staged, personalized skin-care treatment plan",
  },
  // 39 · Swiss Grid Bold
  "00000000-0000-4000-8000-000000000039": {
    headline: "Prevention Beats Treatment",
    content:
      "Regular screening catches most conditions years before symptoms appear. A 20-minute visit today can change the next 20 years.",
    cta: "Book Screening",
    specialty: "General Physician",
    topic: "The case for regular preventive screening",
  },
};

// ── Carousel (19–25) — 19 magazine-spread only, untouched ────────────────────
export const CAROUSEL_SAMPLES: Record<string, CarouselSample> = {
  // 19 · Myth vs Fact Carousel
  "00000000-0000-4000-8000-000000000019": {
    specialty: "General Physician",
    topic: "Antibiotics and the common cold",
    cta: "Book a Consultation",
    slides: [
      { title: "Reaching for Antibiotics?", content: "When a cold hits, it's tempting to ask for antibiotics right away." },
      { title: "The Myth: Antibiotics Cure Colds Faster", content: "Many people believe antibiotics will speed up recovery from a cold." },
      { title: "The Fact: Colds Are Viral, Not Bacterial", content: "Antibiotics only work on bacteria — they do nothing against the viruses that cause colds." },
      { title: "Why It Matters: Resistance Risk", content: "Unnecessary antibiotic use contributes to antibiotic resistance over time." },
      { title: "Ask Before You Assume You Need Them", content: "Talk to your doctor about what actually helps you recover." },
    ],
  },
  // 20 · Blueprint Deck
  "00000000-0000-4000-8000-000000000020": {
    specialty: "Orthopedic Surgeon",
    topic: "Understanding your knee diagnosis",
    cta: "Book an Assessment",
    slides: [
      { title: "Understanding Your Knee Diagnosis", content: "A clear look at what's going on and what comes next." },
      { title: "Imaging Findings", content: "An MRI or X-ray shows exactly where the wear or injury is located." },
      { title: "What It Means Day to Day", content: "Most findings at this stage respond well to guided treatment, not surgery." },
      { title: "Your Treatment Options", content: "Physiotherapy, bracing, and targeted strengthening are usually the first line of care." },
      { title: "Let's Build Your Plan", content: "Book an assessment and we'll map out the right next step for you." },
    ],
  },
  // 21 · Chart Deck
  "00000000-0000-4000-8000-000000000021": {
    specialty: "Physiotherapist",
    topic: "How a recovery plan is structured",
    cta: "Start Your Plan",
    slides: [
      { title: "How Your Recovery Plan Is Structured", content: "Every plan moves through the same phases, paced to how you respond." },
      { title: "Early Phase: Reduce & Protect", content: "The first goal is calming pain and protecting the area while it heals." },
      { title: "Building Phase: Strength & Range", content: "Once pain settles, we rebuild strength and full range of motion." },
      { title: "Ready When You Are", content: "Start your plan and we'll track your progress together." },
    ],
  },
  // 22 · Frame Stack
  "00000000-0000-4000-8000-000000000022": {
    specialty: "Dentist",
    topic: "A look inside our clinic",
    cta: "Book Your Visit",
    slides: [
      { title: "A Look Inside Our Clinic", content: "Patient Education Series." },
      { title: "Our Consultation Room", content: "A calm space for your first conversation, before any treatment is planned." },
      { title: "Modern Diagnostic Equipment", content: "Digital imaging gives us a precise, low-radiation view of your dental health." },
      { title: "Our Sterilization Standards", content: "Every instrument is tracked and sterilized to strict clinical protocol." },
      { title: "A Comfortable Recovery Area", content: "Time to rest and ask questions before you head home." },
      { title: "Come See Us", content: "We'd love to show you around in person." },
    ],
  },
  // 23 · Swiss Grid Deck
  "00000000-0000-4000-8000-000000000023": {
    specialty: "Dermatologist",
    topic: "The facts on sun protection",
    cta: "Book a Skin Check",
    slides: [
      { title: "The Facts on Sun Protection", content: "A short, practical guide to protecting your skin every day." },
      { title: "SPF Is a Daily Habit, Not a Summer One", content: "UV exposure adds up year-round, even on cloudy days and through windows." },
      { title: "Book Your Annual Skin Check", content: "Early detection is still the single best tool we have." },
    ],
  },
  // 24 · Timeline Deck
  "00000000-0000-4000-8000-000000000024": {
    specialty: "Physiotherapist",
    topic: "What to expect after an ACL injury",
    cta: "Start Your Recovery Plan",
    slides: [
      { title: "Recovering From an ACL Injury", content: "Your care journey, mapped out step by step." },
      { title: "Initial Assessment", content: "We confirm the injury pattern and rule out other damage before planning treatment." },
      { title: "Guided Rehabilitation", content: "A structured program rebuilds strength and stability without rushing the joint." },
      { title: "Return to Movement", content: "Sport- or activity-specific training prepares you for a safe return." },
      { title: "Start Your Recovery Plan", content: "Let's build your plan together, step by step." },
    ],
  },
  // 25 · Split Screen Deck
  "00000000-0000-4000-8000-000000000025": {
    specialty: "Cardiologist",
    topic: "Heart risk factors you can control",
    cta: "Get Your Risk Assessed",
    slides: [
      { title: "Heart Risk: What You Can Control", content: "Small, consistent changes measurably lower your cardiovascular risk over time." },
      { title: "Ready to Know Where You Stand?", content: "A simple assessment tells you exactly which factors matter most for you." },
    ],
  },
};

// ── Story (26–30) ────────────────────────────────────────────────────────────
export const STORY_SAMPLES: Record<string, StorySample> = {
  // 26 · Quick Health Reminder
  "00000000-0000-4000-8000-000000000026": {
    headline: "Stay Hydrated Today",
    message: "It's hot out there — sip water regularly through the day, more if you're active outdoors.",
    cta: "Book a Check-Up",
    specialty: "General Physician",
  },
  // 27 · Book Your Appointment
  "00000000-0000-4000-8000-000000000027": {
    headline: "Now Booking Consults",
    message: "New patient slots open this week — bring your skin questions.",
    cta: "DM to Book",
    specialty: "Dermatologist",
  },
  // 28 · Awareness Day Spotlight
  "00000000-0000-4000-8000-000000000028": {
    headline: "World Diabetes Day",
    message: "A reminder to check in on your blood sugar — early detection changes everything.",
    cta: "Book a Screening",
    specialty: "General Physician",
  },
  // 29 · Women's Wellness Screening Reminder
  "00000000-0000-4000-8000-000000000029": {
    headline: "When Did You Last Check In?",
    message: "Routine screenings catch things early. If it's been a while, this is your nudge.",
    cta: "Book Your Visit",
    specialty: "Gynecologist",
  },
  // 30 · Your First Visit: What to Expect
  "00000000-0000-4000-8000-000000000030": {
    headline: "Your First Visit, Simplified",
    message: "Expect a short chat about your health history, a few questions, and a clear plan before you leave — no surprises.",
    cta: "Book Your First Visit",
    specialty: "General Physician",
  },
};
