/**
 * src/lib/api/generate.functions.ts
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getRequestHeader } from "@tanstack/react-start/server";
import { PostCustomizationSchema, defaultCustomizationFor } from "@/lib/post-customization";
import { validateTemplateContent } from "@/lib/template-content-schema";
import { buildRenderKeyGuidance, rendererOverridesCategoryStructure } from "@/lib/template-generation-hints";

function validateEnv(): { supabaseUrl: string; supabaseAnonKey: string; geminiApiKey: string } {
  const supabaseUrl     = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const geminiApiKey    = process.env.GEMINI_API_KEY;

  if (!supabaseUrl)     throw new Error("Missing env: SUPABASE_URL");
  if (!supabaseAnonKey) throw new Error("Missing env: SUPABASE_ANON_KEY");
  if (!geminiApiKey)    throw new Error("Missing env: GEMINI_API_KEY");

  return { supabaseUrl, supabaseAnonKey, geminiApiKey };
}

function getSupabaseClient(supabaseUrl: string, supabaseAnonKey: string) {
  const cookieHeader = getRequestHeader("cookie") ?? "";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(cookieHeader)
          .filter((c) => c.value !== undefined)
          .map((c) => ({ name: c.name, value: c.value as string }));
      },
      setAll() {},
    },
  });
}

// ─── Plan-based AI quality config ────────────────────────────────────────────
const PLAN_AI_CONFIG = {
  starter: {
    model:           "gemini-2.5-flash",
    temperature:     0.85,
    topK:            40,
    topP:            0.95,
    maxOutputTokens: 8192,
    imageSteps:      4,
  },
  growth: {
    model:           "gemini-2.5-flash",
    temperature:     0.9,
    topK:            64,
    topP:            0.95,
    maxOutputTokens: 16384,
    imageSteps:      6,
  },
  pro_clinic: {
    model:           "gemini-2.5-flash",
    temperature:     1.0,
    topK:            64,
    topP:            0.95,
    maxOutputTokens: 32768,
    imageSteps:      8,
  },
} as const;

type PlanAiConfig = (typeof PLAN_AI_CONFIG)[keyof typeof PLAN_AI_CONFIG];

function getPlanConfig(plan: string | null | undefined): PlanAiConfig {
  if (plan === "growth")    return PLAN_AI_CONFIG.growth;
  if (plan === "pro_clinic" || plan === "pro") return PLAN_AI_CONFIG.pro_clinic;
  return PLAN_AI_CONFIG.starter;
}
// ─────────────────────────────────────────────────────────────────────────────

async function callGeminiText(
  system:     string,
  userPrompt: string,
  apiKey:     string,
  cfg:        PlanAiConfig,
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature:      cfg.temperature,
      topK:             cfg.topK,
      topP:             cfg.topP,
      maxOutputTokens:  cfg.maxOutputTokens,
      responseMimeType: "application/json",
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (res.ok) {
      const json = await res.json();
      const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!text || text.trim().length < 10)
        throw new Error("Gemini returned an empty response");
      return text;
    }

    const isRetryable = res.status === 429 || res.status === 503;
    if (attempt < MAX_ATTEMPTS && isRetryable) {
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.warn(`[Gemini] Attempt ${attempt} failed (${res.status}). Retrying in ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    const errBody = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a minute.");
    if (res.status === 503) throw new Error("AI service is currently busy. Please try again in 30 seconds.");
    throw new Error(`AI request failed (${res.status}): ${errBody.slice(0, 200)}`);
  }

  throw new Error("AI service is overloaded right now. Please try again in a moment.");
}

async function callGeminiImage(
  prompt: string,
  apiKey: string,
): Promise<{ dataUrl: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["image"] },
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType ?? "image/png";
          return { dataUrl: `data:${mimeType};base64,${part.inlineData.data}` };
        }
      }
      throw new Error("Image generation returned an empty result.");
    }
    const isRetryable = res.status === 429 || res.status >= 500;
    if (attempt < 3 && isRetryable) {
      console.warn(`[Gemini Image] Attempt ${attempt} got ${res.status}. Retrying...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    const errBody = await res.text().catch(() => "");
    if (res.status === 429)
      throw new Error("Image generation is rate-limited. Please try again shortly.");
    throw new Error(`Image generation failed (${res.status}): ${errBody.slice(0, 200)}`);
  }
  throw new Error("Image generation failed after 3 attempts. Please try again in a moment.");
}

const BrandSchema = z
  .object({
    clinicName:     z.string().optional(),
    doctorName:     z.string().optional(),
    primaryColor:   z.string().optional(),
    secondaryColor: z.string().optional(),
    website:        z.string().optional(),
    phone:          z.string().optional(),
    hasLogo:        z.boolean().optional(),
    hasDoctorPhoto: z.boolean().optional(),
    hasClinicPhoto: z.boolean().optional(),
  })
  .optional();

const CategoryEnum = z.enum([
  "educational",
  "myth-fact",
  "did-you-know",
  "patient-faq",
  "health-tips",
  "warning-signs",
  "prevention",
  "doctor-explains",
  "awareness",
  "clinic-promo",
  "greeting",
  "reel-hook",
]);

const InputSchema = z.object({
  kind:               z.enum(["single", "carousel", "story", "reel", "campaign", "festive", "template"]),
  category:           CategoryEnum.default("educational"),
  specialty:          z.string().min(1),
  topic:              z.string().min(1),
  tone:               z.string().min(1),
  audience:           z.string().min(1),
  festival:           z.string().optional(),
  customInstructions: z.string().max(800).optional(),
  festiveStyle: z
    .enum([
      "Professional",
      "Warm & Friendly",
      "Premium",
      "Luxury Clinic",
      "Traditional",
      "Modern Social Media",
      "Community-Focused",
    ])
    .optional(),
  slideCount: z.number().int().min(2).max(10).optional(),
  language:   z.string().max(40).optional(),
  brand:      BrandSchema,
  // Which `templates` catalog row this generation started from, if the user
  // arrived via Template Studio's "Use Template" action. Optional and
  // independent of `data.kind`/frame choice below -- see migration
  // 20240001000014's comment on content_generations.template_id for why this
  // is allowed to diverge from the actual render/frame chosen.
  templateId: z.string().uuid().optional(),
  // Which bespoke renderer (templateFrames/postTemplates/carouselTemplates/
  // storyTemplates registry key) this generation's result will render
  // through, if any -- set only via Template Studio's in-place workspaces.
  // PROMPT HINT ONLY: read exclusively by buildPrompt() via
  // template-generation-hints.ts to append/override a short render_key-
  // specific guidance block. Never used for authorization, entitlement,
  // credit, or any security decision -- a missing, stale, or unrecognized
  // value degrades to "no hint", identical to today's generation.
  renderKey: z.string().optional(),
  // "Did You Know" statistics are always supplied by the doctor, never
  // invented by Gemini -- see the superRefine below, which makes statistic +
  // statisticSource required whenever category === "did-you-know", for every
  // kind, not just Template Studio's Stat Spotlight entry. Frontend fields
  // mirror this for UX; this schema-level check is the actual guard, and it
  // runs inside `.validator()` -- before deduct_credit is ever called.
  statistic:        z.string().min(1).max(300).optional(),
  statisticSource:  z.string().min(1).max(200).optional(),
  statisticContext: z.string().max(300).optional(),
}).superRefine((data, ctx) => {
  if (data.category === "did-you-know") {
    if (!data.statistic?.trim()) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ["statistic"],
        message: "A statistic is required for the \"Did You Know\" category -- Medipost formats it, but never invents the number.",
      });
    }
    if (!data.statisticSource?.trim()) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ["statisticSource"],
        message: "A source is required for the \"Did You Know\" category.",
      });
    }
  }
});

export type GenerateInput = z.infer<typeof InputSchema>;

export type Visual = {
  concept:     string;
  colors:      string[];
  style:       string;
  layout:      string;
  imagePrompt: string;
  composition: string;
  visualStyle: string;
};

export type SinglePost = {
  kind:     "single";
  headline: string;
  content:  string;
  caption:  string;
  cta:      string;
  hashtags: string[];
  visual:   Visual;
};

export type CarouselPost = {
  kind:     "carousel";
  title:    string;
  slides:   { title: string; content: string; imagePrompt?: string; relationship?: string }[];
  cta:      string;
  hashtags: string[];
  visual:   Visual;
};

export type StoryPost = {
  kind:     "story";
  headline: string;
  message:  string;
  cta:      string;
  visual:   Visual;
};

export type ReelScript = {
  kind:          "reel";
  hook:          string;
  talkingPoints: string[];
  cta:           string;
  visual:        Visual;
};

export type Campaign = {
  kind:           "campaign";
  theme:          string;
  objective:      string;
  postIdeas:      string[];
  weeklySchedule: { day: string; format: string; idea: string }[];
  ctaSuggestions: string[];
  visual:         Visual;
};

export type FestivePost = {
  kind:     "festive";
  festival: string;
  greeting: string;
  caption:  string;
  hashtags: string[];
  visual:   Visual;
};

export type TemplatePost = {
  kind:     "template";
  headline: string;
  subline:  string;
  cta:      string;
  caption:  string;
  hashtags: string[];
  // Short (1-3 word) benefit/feature labels, e.g. "Expert Doctors",
  // "Advanced Care" -- optional per-frame content; only Poster frames with a
  // feature-row slot (currently just Benefit Grid) render these. Every other
  // frame ignores the field entirely, matching how `subline`/`cta` already
  // work (some frames use them, none require every field to be non-empty).
  features: string[];
  visual:   Visual;
};

export type GenerateOutput =
  | SinglePost
  | CarouselPost
  | StoryPost
  | ReelScript
  | Campaign
  | FestivePost
  | TemplatePost;

const SHARED_RULES = `CONTENT SAFETY RULES (strict)
- Be accurate, evidence-aligned, marketing-friendly, and culturally respectful.
- Do NOT diagnose, prescribe, or guarantee outcomes.
- Do NOT include misinformation or unverified claims.
- Remind readers to consult a qualified professional when appropriate.

EDITORIAL VOICE (very important)
- Write like world-class healthcare brands: Mayo Clinic, Cleveland Clinic, Apollo, Fortis,
  and creator-doctors like Dr Mike, Dr Karan Rajan, Dr Tanaya Narendra.
- Use plain, modern English. Short sentences. Concrete numbers and timeframes.
- Lead with a real human hook (a fear, a myth, a surprising stat), NOT generic intros.
- No "in today's fast-paced world", no "are you struggling with…", no fluff.
- Prefer specifics over generalities. Cite mechanism in 1 line when relevant.
- Sound like a confident clinician talking to a patient, not a marketing template.`;

const CATEGORY_HINTS: Record<z.infer<typeof CategoryEnum>, string> = {
  "educational":
    "Tone: clear, calm, evidence-based explainer. Teach ONE concept well; finish with a 'remember this' line.",
  "myth-fact":
    "Bust ONE specific myth. Be confident and respectful. Name the myth → state the fact → explain why → tell them what to do.",
  "did-you-know":
    "Open with a single surprising stat or anatomy fact. Keep it punchy and shareable.",
  "patient-faq":
    "Answer a real patient question. Use the structure Question → Direct answer → Why → Key takeaway → CTA.",
  "health-tips":
    "Give 3–6 specific, low-friction tips a patient can act on this week. No vague advice.",
  "warning-signs":
    "List the red-flag symptoms that mean 'see a clinician now'. Be firm but not alarmist. End with a clear next-step.",
  "prevention":
    "Focus on small daily/weekly habits that prevent the condition. Mention realistic risk reduction.",
  "doctor-explains":
    "First-person voice from the clinician. Use phrases like 'As a {specialty}, here's what I tell my patients…'.",
  "awareness":
    "Frame the issue, scale of the problem, who is at risk, and a clear call to action / movement.",
  "clinic-promo":
    "Highlight a specific service / package / new clinician. Lead with patient benefit, not features. End with a booking CTA.",
  "greeting":
    "Warm, culturally respectful festive wish from a clinic. Tie wellbeing to the occasion subtly.",
  "reel-hook":
    "Write a 3-second scroll-stopper opening line followed by the rest of the script. Hook must create a curiosity gap.",
};

function carouselStructureFor(
  category: z.infer<typeof CategoryEnum>,
  n: number,
): string {
  switch (category) {
    case "myth-fact":
      return `MUST follow exactly this structure:
Slide 1: HOOK — call out the myth in 4-7 words
Slide 2: THE MYTH — state the common belief
Slide 3: THE FACT — evidence-based truth
Slide 4: WHY — short mechanism (1-2 sentences)
${n >= 5 ? "Slide 5: WHAT TO DO INSTEAD — practical fix\n" : ""}${n >= 6 ? "Slide 6: BONUS TIP\n" : ""}Slide ${n}: CTA`;
    case "patient-faq":
      return `MUST follow exactly this structure:
Slide 1: HOOK — frame the question
Slide 2: QUESTION — in patient words
Slide 3: DIRECT ANSWER
Slide 4: WHY THIS HAPPENS
${n >= 5 ? "Slide 5: WHAT TO DO\n" : ""}${n >= 6 ? "Slide 6: KEY TAKEAWAY\n" : ""}Slide ${n}: CTA`;
    case "warning-signs":
      return `Slide 1: HOOK — "Don't ignore these signs of {topic}"
Slides 2 to ${n - 1}: ONE warning sign per slide
Slide ${n}: CTA`;
    case "prevention":
      return `Slide 1: HOOK — what's at stake without prevention
Slides 2 to ${n - 1}: ONE prevention habit per slide
Slide ${n}: CTA`;
    case "health-tips":
      return `Slide 1: HOOK — promise of the tips
Slides 2 to ${n - 1}: ONE tip per slide
Slide ${n}: CTA — "Save this & share"`;
    case "doctor-explains":
      return `Slide 1: HOOK — first-person opening
Slide 2: THE COMMON BELIEF
Slide 3: WHAT'S ACTUALLY HAPPENING
${n >= 4 ? "Slide 4: WHAT I RECOMMEND\n" : ""}${n >= 5 ? "Slide 5: WHO SHOULD WORRY\n" : ""}Slide ${n}: CTA`;
    default:
      return `Slide 1: HOOK
Slides 2 to ${n - 1}: one insight per slide
Slide ${n}: CTA`;
  }
}

function singleStructureFor(category: z.infer<typeof CategoryEnum>): string {
  switch (category) {
    case "myth-fact":
      return `CONTENT STRUCTURE (strict — rendered as two opposing Myth/Fact panels):
"content" MUST be exactly two paragraphs separated by \\n\\n:
Paragraph 1 starts with "Myth: " — the common belief in 1-2 short sentences.
Paragraph 2 starts with "Fact: " — the evidence-based truth + 1-line why, 2-3 short sentences.`;
    case "did-you-know":
      return `CONTENT STRUCTURE (strict — rendered as a big-number poster):
"content" MUST open with the SUPPLIED STATISTIC given above, verbatim (see the SUPPLIED STATISTIC block),
followed by ONE supporting line that cites the source naturally. 25-45 words total. "headline" is the curiosity hook.
Do NOT substitute a different number and do NOT invent one if that block is somehow missing -- in that
case, use a qualitative surprising fact or mechanism instead, with no invented statistic.`;
    case "patient-faq":
      return `CONTENT STRUCTURE (strict — rendered as a question/answer chat exchange):
"headline" MUST be the patient's question, ending with "?".
"content" is the clinician's direct answer: answer first, then the 1-line why. 40-70 words.`;
    case "health-tips":
    case "prevention":
      return `CONTENT STRUCTURE (strict — rendered as a checklist card):
"content" MUST be 4-5 tips, ONE per line separated by \\n. Each tip imperative and ≤ 12 words. No numbering, no bullets.`;
    case "warning-signs":
      return `CONTENT STRUCTURE (strict — rendered as an alert poster):
"content" MUST be 3-4 red-flag signs, ONE per line separated by \\n, each ≤ 10 words,
then a final line stating when to seek care immediately.`;
    default:
      return `CONTENT STRUCTURE:
"content" is 60-100 words, 2-3 short paragraphs separated by \\n\\n.`;
  }
}

/**
 * All formats write copy in the selected regional language.
 * "visual" always stays English (goes to the image model).
 * Structural markers the client parses (e.g. "Myth: "/"Fact: ") stay English verbatim.
 *
 * FIX: Changed from "patient-facing text" to an explicit mandatory requirement
 * so Gemini doesn't default to English when the audience is healthcare professionals.
 */
function languageBlock(lang?: string): string {
  const l = lang?.trim();
  if (!l || l.toLowerCase() === "english") return "";
  return `LANGUAGE — MANDATORY (non-negotiable, applies to ALL audiences including healthcare professionals)
You MUST write ALL text content in ${l} using its native script. Do NOT write in English.
- MUST be in ${l}: headline, content, message, greeting, caption, cta, hook, talkingPoints, theme, objective, postIdeas, all "idea" fields in weeklySchedule, ctaSuggestions, slide titles, slide bodies, subline, title.
- Write ${l} the way clinics in that region actually speak — clear, professional, natural.
- Widely-used English medical terms (e.g. "diabetes", "BP", "ECG", "MRI") may stay in English within ${l} sentences.
- Keep "hashtags" mostly in English.
- EXCEPTION 1: Every field inside "visual" (concept, style, composition, imagePrompt, visualStyle, layout) MUST stay in English — this goes to an image-generation model that only understands English.
- EXCEPTION 2: Structural CONTENT STRUCTURE markers (e.g. "Myth: " and "Fact: " prefixes) stay in English exactly as specified — only the text after the marker is in ${l}.
If any content field is in English instead of ${l}, the output is wrong. Write in ${l}.`;
}

/**
 * Placed in buildPrompt()'s shared `base` block (not just the "single" case)
 * so the no-invented-statistic rule applies to every kind that can carry
 * category === "did-you-know" -- carousel, story, etc, not only single posts
 * or Template Studio's Stat Spotlight entry. Returns "" for every other
 * category, and also "" if statistic is somehow absent (the InputSchema
 * superRefine is what actually prevents that for did-you-know).
 */
function statisticBlock(d: GenerateInput): string {
  if (d.category !== "did-you-know" || !d.statistic) return "";
  return `
SUPPLIED STATISTIC — MANDATORY, VERBATIM (non-negotiable)
You MUST use this exact statistic, unchanged: "${d.statistic}"
Source (cite naturally in the supporting line, do not just append "(Source)"): ${d.statisticSource ?? "not provided"}
${d.statisticContext ? `Additional context supplied: ${d.statisticContext}` : ""}
- Do NOT alter this number, round it, or restate it differently.
- Do NOT introduce any second, different numeric/statistical claim anywhere in the output.
- Your job is only to rewrite the surrounding copy for social media, add one supporting explanatory
  line, and write the caption/CTA -- never to invent or adjust the figure itself.`;
}

function brandBlock(b: GenerateInput["brand"]): string {
  if (!b) return "BRAND: not provided. Keep content brand-neutral.";
  const lines: string[] = ["BRAND CONTEXT (subtly weave in, do not stuff):"];
  if (b.clinicName)    lines.push(`- Clinic name: ${b.clinicName}`);
  if (b.doctorName)    lines.push(`- Clinician: ${b.doctorName}`);
  if (b.primaryColor || b.secondaryColor)
    lines.push(`- Brand colors: ${b.primaryColor ?? ""} ${b.secondaryColor ?? ""}`.trim());
  if (b.website)        lines.push(`- Website: ${b.website}`);
  if (b.phone)          lines.push(`- Phone: ${b.phone}`);
  if (b.hasDoctorPhoto) lines.push(`- Clinician headshot available — reference in visual.concept.`);
  if (b.hasClinicPhoto) lines.push(`- Clinic photo available — reference as possible background.`);
  if (b.hasLogo)        lines.push(`- Clinic logo available — mention as brand mark.`);
  return lines.join("\n");
}

const VISUAL_BLOCK = `"visual": {
    "concept": "one-sentence scene description",
    "colors": ["#RRGGBB","#RRGGBB","#RRGGBB","#RRGGBB"],
    "style": "short visual style note",
    "layout": "layout recommendation (e.g. Instagram Square Post, 9:16 Vertical)",
    "visualStyle": "pick ONE: 'Modern Healthcare' | 'Premium Clinic' | 'Editorial Infographic' | 'Lifestyle Photography' | 'Awareness Campaign' | 'Luxury Aesthetic'",
    "composition": "1-line composition instructions",
    "imagePrompt": "FULL ready-to-send image generation prompt (60-120 words). Real photorealistic or editorial healthcare scene. No text, no watermark, Instagram-ready, premium healthcare marketing."
  }`;

const FESTIVE_VISUAL_BLOCK = `"visual": {
    "concept": "one-sentence scene description of the FESTIVE decor/mood (not a clinic scene)",
    "colors": ["#RRGGBB","#RRGGBB","#RRGGBB","#RRGGBB", "colors drawn from how this specific festival is traditionally decorated/celebrated"],
    "style": "short visual style note",
    "layout": "layout recommendation (e.g. Instagram Square Post, 9:16 Vertical)",
    "visualStyle": "pick ONE: 'Festive Traditional' | 'Festive Modern' | 'Festive Premium' | 'Festive Minimal'",
    "composition": "1-line composition instructions — leave the lower third visually calm/uncluttered so a greeting and doctor photo can sit on top",
    "imagePrompt": "FULL ready-to-send image generation prompt (60-120 words) for a warm, premium FESTIVE creative tied to the specific festival named above — real decor/symbols/colors people actually associate with it (e.g. diyas and marigolds for Diwali, lanterns and red-gold for Lunar New Year, string lights and pine for Christmas, crescent and lanterns for Eid) rendered as elegant photorealistic or soft-bokeh photography. Do NOT depict a clinic, doctor, stethoscope, or hospital — this is a greeting-card background, not a medical scene. No text, no watermark, no people's faces, Instagram-ready, premium aesthetic."
  }`;

const TEMPLATE_VISUAL_BLOCK = `"visual": {
    "concept": "one-sentence description of the SINGLE photographic subject (person/scene) for this ad",
    "colors": ["#RRGGBB","#RRGGBB","#RRGGBB","#RRGGBB"],
    "style": "short visual style note",
    "layout": "Instagram Square Post",
    "visualStyle": "pick ONE: 'Modern Healthcare' | 'Premium Clinic' | 'Lifestyle Photography' | 'Awareness Campaign'",
    "composition": "1-line composition instructions",
    "imagePrompt": "FULL ready-to-send image generation prompt (60-120 words) for ONE clear photographic subject relevant to the condition/service — e.g. a patient showing the symptom, a doctor consulting, a treatment close-up. Single subject centered with generous space around it, clean soft neutral or softly blurred background, photorealistic, warm trustworthy healthcare-ad mood. The photo will be cropped into a shaped window on a designed poster, so NO text, NO watermark, NO logos, NO graphic overlays, subject must not touch the frame edges."
  }`;

/** Exported only so a standalone verification script can call it directly
 *  with fixture inputs (no DB/network) to snapshot-diff render_key-aware
 *  guidance against today's output -- see the implementation plan's §12. */
export function buildPrompt(d: GenerateInput): { system: string; user: string } {
  const base = `BRIEF
- Specialty: ${d.specialty}
- Topic: ${d.topic}
- Tone: ${d.tone}
- Target audience: ${d.audience}
- Content category: ${d.category}

CATEGORY GUIDANCE
${CATEGORY_HINTS[d.category]}
${statisticBlock(d)}

${brandBlock(d.brand)}

${SHARED_RULES}

${languageBlock(d.language)}`;

  switch (d.kind) {
    case "single": {
      // Polaroid Stack (render_key "polaroid-stack") is the one render_key
      // that OVERRIDES its category's structure text instead of appending
      // after it -- see rendererOverridesCategoryStructure()'s doc comment.
      // Every other flagged render_key composes with the category structure,
      // never replaces it; a missing/unrecognized renderKey leaves
      // structureText byte-identical to singleStructureFor(d.category) alone.
      const categoryStructure = singleStructureFor(d.category);
      const renderGuidance = buildRenderKeyGuidance(d.renderKey, "single");
      const structureText = rendererOverridesCategoryStructure(d.renderKey, "single")
        ? renderGuidance
        : renderGuidance
          ? `${categoryStructure}\n\n${renderGuidance}`
          : categoryStructure;
      return {
        system: "You are Medipost AI, a healthcare social-media copywriter. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Generate ONE scroll-stopping single social media post about "${d.topic}".

${structureText}

Return STRICT JSON, no markdown:
{
  "headline": "punchy 4-8 word headline",
  "content": "main body following the CONTENT STRUCTURE above",
  "caption": "1-2 sentence Instagram caption",
  "cta": "short call to action",
  "hashtags": ["#tag1","#tag2","... 8-12 hashtags total"],
  ${VISUAL_BLOCK}
}`,
      };
    }

    case "carousel": {
      const n         = d.slideCount ?? 7;
      const structure = carouselStructureFor(d.category, n);
      const renderGuidance = buildRenderKeyGuidance(d.renderKey, "carousel");
      const zoneBudget = renderGuidance ? `\n\n${renderGuidance}` : "";
      return {
        system: "You are Medipost AI. You design educational carousel posts for clinicians. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Design an Instagram CAROUSEL with exactly ${n} slides on "${d.topic}".

${structure}${zoneBudget}

- Each slide title 3-7 words, body 20-40 words.
- For each slide write an "imagePrompt": 40-80 word AI image prompt (real healthcare scene, no solid colors, no text-on-background). End each with "no text, no watermark, Instagram-ready, premium healthcare brand aesthetic".
- For each slide also set "relationship" to whichever best describes that slide's content structure: single | list | checklist | sequence | timeline | cause-effect | comparison | hierarchy | statistic | faq. This is a hint only — best effort.

Return STRICT JSON:
{
  "title": "short carousel title",
  "slides": [
    { "title": "Slide 1 title", "content": "Slide 1 body", "imagePrompt": "...", "relationship": "..." },
    ... exactly ${n} slides
  ],
  "cta": "final CTA line",
  "hashtags": ["#tag1","... 8-12 hashtags"],
  ${VISUAL_BLOCK}
}`,
      };
    }

    case "story": {
      const renderGuidance = buildRenderKeyGuidance(d.renderKey, "story");
      const storyGuidance = renderGuidance ? `\n\n${renderGuidance}` : "";
      return {
        system: "You are Medipost AI. You write tight, vertical-format healthcare Instagram Stories. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Write ONE Instagram Story (9:16) about "${d.topic}". Max 25 words total.

- cta: a short, direct action line (2-4 words, e.g. "Book Appointment", "Call Now", "DM to Book"). NOT a question, NOT a poll/tap-to-vote prompt.${storyGuidance}

Return STRICT JSON:
{
  "headline": "4-6 word headline",
  "message": "supporting message, max 25 words",
  "cta": "2-4 word action line",
  ${VISUAL_BLOCK}
}`,
      };
    }

    case "reel":
      return {
        system: "You are Medipost AI, a short-form video scriptwriter for clinicians. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Write a 30-45 second REEL SCRIPT about "${d.topic}".

Return STRICT JSON:
{
  "hook": "first 3-second hook line",
  "talkingPoints": ["point 1","point 2","point 3","..."],
  "cta": "spoken call-to-action",
  ${VISUAL_BLOCK}
}`,
      };

    case "campaign":
      return {
        system: "You are Medipost AI, a healthcare marketing strategist. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Plan a 1-week AWARENESS CAMPAIGN around "${d.topic}".

Return STRICT JSON:
{
  "theme": "campaign theme 4-8 words",
  "objective": "what this campaign achieves, 1-2 sentences",
  "postIdeas": ["idea 1","idea 2","..."],
  "weeklySchedule": [
    { "day": "Mon", "format": "Carousel | Reel | Story | Single Post", "idea": "what to post" },
    { "day": "Tue", "format": "...", "idea": "..." },
    { "day": "Wed", "format": "...", "idea": "..." },
    { "day": "Thu", "format": "...", "idea": "..." },
    { "day": "Fri", "format": "...", "idea": "..." },
    { "day": "Sat", "format": "...", "idea": "..." },
    { "day": "Sun", "format": "...", "idea": "..." }
  ],
  "ctaSuggestions": ["cta 1","cta 2","cta 3"],
  ${VISUAL_BLOCK}
}`,
      };

    case "festive": {
      const fest       = d.festival || "the upcoming festival";
      const doctorName = d.brand?.doctorName;
      const clinicName = d.brand?.clinicName;
      const styleNote = d.festiveStyle
        ? `CREATIVE STYLE: ${d.festiveStyle}. Greeting, caption AND visual must reflect this style.`
        : "";
      const extra = d.customInstructions?.trim()
        ? `ADDITIONAL INSTRUCTIONS:\n"""\n${d.customInstructions!.trim()}\n"""`
        : "";
      const signOff = doctorName
        ? `Write it as a PERSONAL greeting FROM ${doctorName}${clinicName ? ` and the ${clinicName} team` : ""} — first-person warmth ("I wish you...", "we at ..."), like a clinician signing a card for their patients, not a corporate announcement.`
        : `Write it as a warm personal greeting from the clinic's clinician to their patients, not a corporate announcement.`;
      return {
        system:
          "You are Medipost AI, a culturally-aware festive greeting writer for healthcare brands. You write greetings for ANY occasion. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Write a greeting card post for "${fest}" from a ${d.specialty}'s clinic.
- Must feel specific to "${fest}" — reference its real traditions/symbols, not generic "season's greetings" filler.
- ${signOff}
- Tie the wish gracefully to health/wellness in ONE short line at most — the greeting itself, not a health lecture.
${styleNote}
${extra}

Return STRICT JSON:
{
  "festival": "${fest}",
  "greeting": "main greeting, 2-3 warm sentences, ready to render on a card, signed in spirit from the clinician",
  "caption": "matching social caption, 1-2 sentences",
  "hashtags": ["#tag1","... 6-10 festive + healthcare hashtags"],
  ${FESTIVE_VISUAL_BLOCK}
}`,
      };
    }

    case "template": {
      const renderGuidance = buildRenderKeyGuidance(d.renderKey, "template");
      const templateGuidance = renderGuidance ? `\n\n${renderGuidance}` : "";
      return {
        system:
          "You are Medipost AI, a copywriter for poster-style local healthcare ads (clinic flyers, treatment-center promos). Respond ONLY with strict JSON.",
        user: `${base}

TASK: Write the copy for ONE poster-style promo creative about "${d.topic}" — the kind of ad a local clinic prints or posts on social media: a bold service headline, a short benefit line, a contact-style CTA, and a short list of trust/benefit feature labels.${templateGuidance}

Return STRICT JSON:
{
  "headline": "3-6 word poster headline naming the service/condition center or promise (e.g. 'Hernia Treatment Center', 'Are You Suffering From Piles?')",
  "subline": "1-2 short benefit/action lines, 8-16 words total, specific and reassuring (e.g. 'Get checked here, treat it early')",
  "cta": "2-4 word action line (e.g. 'Contact Now', 'Book Appointment')",
  "features": ["1-3 word benefit/trust labels for this exact specialty and topic, e.g. 'Expert Doctors', 'Advanced Care', 'Painless Procedure', 'Proven Results' — exactly 4, each genuinely relevant to \\"${d.topic}\\", never generic filler unrelated to this specialty"],
  "caption": "1-2 sentence social caption",
  "hashtags": ["#tag1","... 8-12 hashtags"],
  ${TEMPLATE_VISUAL_BLOCK}
}`,
      };
    }
  }
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Model did not return valid JSON");
  }
}

function normalizeVisual(v: unknown): Visual {
  const obj = (v ?? {}) as Partial<Visual>;
  return {
    concept:     String(obj.concept ?? ""),
    colors:      Array.isArray(obj.colors) ? obj.colors.slice(0, 6).map(String) : [],
    style:       String(obj.style ?? ""),
    layout:      String(obj.layout ?? ""),
    imagePrompt: String((obj as any).imagePrompt ?? ""),
    composition: String((obj as any).composition ?? ""),
    visualStyle: String((obj as any).visualStyle ?? ""),
  };
}

function normalize(kind: GenerateInput["kind"], raw: any): GenerateOutput {
  const visual = normalizeVisual(raw?.visual);
  switch (kind) {
    case "single":
      return {
        kind:     "single",
        headline: String(raw?.headline ?? ""),
        content:  String(raw?.content ?? ""),
        caption:  String(raw?.caption ?? ""),
        cta:      String(raw?.cta ?? ""),
        hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags.map(String) : [],
        visual,
      };
    case "carousel":
      return {
        kind:  "carousel",
        title: String(raw?.title ?? ""),
        slides: Array.isArray(raw?.slides)
          ? raw.slides.map((s: any) => ({
              title:        String(s?.title ?? ""),
              content:      String(s?.content ?? ""),
              imagePrompt:  s?.imagePrompt ? String(s.imagePrompt) : undefined,
              relationship: s?.relationship ? String(s.relationship) : undefined,
            }))
          : [],
        cta:      String(raw?.cta ?? ""),
        hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags.map(String) : [],
        visual,
      };
    case "story":
      return {
        kind:     "story",
        headline: String(raw?.headline ?? ""),
        message:  String(raw?.message ?? ""),
        cta:      String(raw?.cta ?? ""),
        visual,
      };
    case "reel":
      return {
        kind:          "reel",
        hook:          String(raw?.hook ?? ""),
        talkingPoints: Array.isArray(raw?.talkingPoints) ? raw.talkingPoints.map(String) : [],
        cta:           String(raw?.cta ?? ""),
        visual,
      };
    case "campaign":
      return {
        kind:      "campaign",
        theme:     String(raw?.theme ?? ""),
        objective: String(raw?.objective ?? ""),
        postIdeas: Array.isArray(raw?.postIdeas) ? raw.postIdeas.map(String) : [],
        weeklySchedule: Array.isArray(raw?.weeklySchedule)
          ? raw.weeklySchedule.map((s: any) => ({
              day:    String(s?.day ?? ""),
              format: String(s?.format ?? ""),
              idea:   String(s?.idea ?? ""),
            }))
          : [],
        ctaSuggestions: Array.isArray(raw?.ctaSuggestions) ? raw.ctaSuggestions.map(String) : [],
        visual,
      };
    case "festive":
      return {
        kind:     "festive",
        festival: String(raw?.festival ?? ""),
        greeting: String(raw?.greeting ?? ""),
        caption:  String(raw?.caption ?? ""),
        hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags.map(String) : [],
        visual,
      };
    case "template":
      return {
        kind:     "template",
        headline: String(raw?.headline ?? ""),
        subline:  String(raw?.subline ?? ""),
        cta:      String(raw?.cta ?? ""),
        caption:  String(raw?.caption ?? ""),
        hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags.map(String) : [],
        features: Array.isArray(raw?.features) ? raw.features.map(String) : [],
        visual,
      };
  }
}

export const generateContent = createServerFn({ method: "POST" })
  .validator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateOutput> => {
    try {
      const { supabaseUrl, supabaseAnonKey, geminiApiKey } = validateEnv();

      const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Unauthorized. Please sign in to generate content.");

      const { error: creditError } = await supabase.rpc("deduct_credit", { p_user_id: user.id });
      if (creditError) {
        if (creditError.message.includes("INSUFFICIENT_CREDITS"))
          throw new Error("Credits exhausted. Please upgrade your plan to continue.");
        if (creditError.message.includes("SUBSCRIPTION_NOT_FOUND"))
          throw new Error("No active subscription found. Please contact support.");
        throw new Error(`Credit processing failed: ${creditError.message}`);
      }

      // Fetch plan to determine AI quality tier
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();
      const aiConfig = getPlanConfig(sub?.plan);

      const { data: brandKit } = await supabase
        .from("brand_kits")
        .select("clinic_name, doctor_name, brand_colors, website, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      const brandColors = brandKit?.brand_colors as
        | { primary?: string; secondary?: string; accent?: string }
        | null;

      const mergedBrand = {
        clinicName:     data.brand?.clinicName     ?? brandKit?.clinic_name   ?? undefined,
        doctorName:     data.brand?.doctorName     ?? brandKit?.doctor_name   ?? undefined,
        primaryColor:   data.brand?.primaryColor   ?? brandColors?.primary    ?? undefined,
        secondaryColor: data.brand?.secondaryColor ?? brandColors?.secondary  ?? undefined,
        website:        data.brand?.website        ?? brandKit?.website       ?? undefined,
        phone:          data.brand?.phone          ?? brandKit?.phone         ?? undefined,
        hasLogo:        data.brand?.hasLogo,
        hasDoctorPhoto: data.brand?.hasDoctorPhoto,
        hasClinicPhoto: data.brand?.hasClinicPhoto,
      };

      const { system, user: userPrompt } = buildPrompt({ ...data, brand: mergedBrand });

      // Runs the full Gemini call -> parse -> normalize -> (for `template`
      // only) schema-validate pipeline once. Thrown errors here (a Gemini
      // call failure, malformed JSON, or -- template kind only -- a missing
      // required slot) are handled by the retry/refund logic below, not here.
      async function generateAndValidate(): Promise<GenerateOutput> {
        const rawText = await callGeminiText(system, userPrompt, geminiApiKey, aiConfig);
        const parsed = extractJson(rawText);
        const generated = normalize(data.kind, parsed);
        return generated.kind === "template" ? validateTemplateContent(generated) : generated;
      }

      let result: GenerateOutput;
      try {
        result = await generateAndValidate();
      } catch (firstErr: any) {
        if (data.kind === "template") {
          // Template content is schema-validated (see template-content-schema.ts).
          // A failure here is worth one automatic, uncharged retry before
          // giving up -- no second credit is deducted, since deduct_credit
          // already ran once above for this whole request.
          console.warn("[generateContent] template generation failed validation, retrying once:", firstErr?.message);
          try {
            result = await generateAndValidate();
          } catch (secondErr: any) {
            try { await supabase.rpc("refund_credit", { p_user_id: user.id }); } catch {}
            console.error("[generateContent] template generation failed validation twice:", secondErr?.message);
            throw new Error("We couldn't generate valid content for this template. Please try again.");
          }
        } else {
          // Unchanged behavior for the other six kinds, extended to also
          // cover extractJson/normalize failures (previously only a raw
          // callGeminiText failure triggered a refund here -- a malformed-
          // JSON response deducted a credit with no refund).
          try { await supabase.rpc("refund_credit", { p_user_id: user.id }); } catch {}
          throw firstErr;
        }
      }

      const hashtags =
        "hashtags" in result && Array.isArray(result.hashtags) ? result.hashtags : [];

      let customization: unknown = null;
      try {
        customization = defaultCustomizationFor(result, data.category, data.specialty);
      } catch (e) {
        console.error("[generateContent] default customization failed:", e);
      }

      const { data: inserted, error: saveError } = await supabase
        .from("content_generations")
        .insert({
          user_id:          user.id,
          workflow_kind:    data.kind,
          content_category: data.category,
          specialty:        data.specialty,
          tone:             data.tone,
          topic:            data.topic.trim(),
          generated_text:   JSON.stringify(result),
          hashtags,
          status:           "completed",
          ai_model:         aiConfig.model,
          customization,
          template_id:      data.templateId ?? null,
        })
        .select("id")
        .single();

      if (saveError) console.error("[generateContent] DB save failed:", saveError.message);

      return { ...result, _rowId: inserted?.id ?? undefined } as typeof result & { _rowId?: string };
    } catch (error: any) {
      console.error("FULL SERVER ERROR:", error);
      throw error;
    }
  });

const ImageInputSchema = z.object({
  prompt:      z.string().min(3).max(2000),
  visualStyle: z.string().optional(),
  contentId:   z.string().uuid().optional(),
  slideIndex:  z.number().int().min(0).max(19).optional(),
  slideCount:  z.number().int().min(1).max(20).optional(),
});

export type GenerateImageOutput = { dataUrl: string };

const STYLE_DIRECTIVES: Record<string, string> = {
  "Modern Healthcare":
    "modern healthcare photography, bright clinic, soft daylight, shallow depth of field, calm and trustworthy mood",
  "Premium Clinic":
    "premium private clinic editorial photography, luxurious interiors, warm neutral palette, cinematic lighting",
  "Editorial Infographic":
    "clean editorial healthcare illustration, flat vector style, minimal palette, infographic feel",
  "Lifestyle Photography":
    "real lifestyle photography of patients and doctors, candid moments, natural light, documentary feel",
  "Awareness Campaign":
    "bold awareness campaign visual, high contrast, emotive subject, public health poster energy",
  "Luxury Aesthetic":
    "luxury aesthetic clinic visual, marble and gold accents, soft beige and ivory tones, fashion-editorial composition",
  "Festive Traditional":
    "traditional festival decor photography, rich cultural colors and textures, warm ambient/golden-hour lighting, authentic and celebratory mood",
  "Festive Modern":
    "modern minimal festive styling, clean bokeh string lights, contemporary color palette, editorial greeting-card aesthetic",
  "Festive Premium":
    "premium festive editorial photography, elegant gold and jewel tones, soft cinematic lighting, luxury greeting-card aesthetic",
  "Festive Minimal":
    "minimal festive flat-lay styling, soft pastel palette, generous negative space, clean and elegant",
};

export const generateImage = createServerFn({ method: "POST" })
  .validator((data: unknown) => ImageInputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateImageOutput> => {
    try {
      const { supabaseUrl, supabaseAnonKey, geminiApiKey } = validateEnv();

      const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Unauthorized. Please sign in to generate images.");

      // Fetch plan to determine image quality tier
      const { data: imgSub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();
      const imgConfig = getPlanConfig(imgSub?.plan);

      const directive = data.visualStyle ? (STYLE_DIRECTIVES[data.visualStyle] ?? "") : "";
      const isFestive = data.visualStyle?.startsWith("Festive") ?? false;
      const fullPrompt = [
        data.prompt,
        directive,
        isFestive
          ? "Square 1:1 composition, Instagram-ready, warm premium festive greeting-card creative, no clinic/hospital imagery, no text, no watermark, no logos."
          : "Square 1:1 composition, Instagram-ready, premium healthcare marketing creative, no text, no watermark, no logos, photorealistic where appropriate.",
      ]
        .filter(Boolean)
        .join(" ");

      const { dataUrl } = await callGeminiImage(fullPrompt, geminiApiKey);

      // Persist the generated visual onto its content row so it survives
      // navigation/remount (Content History, tab switches, etc.) — mirrors
      // how brand-kit logos/photos are stored as base64 directly in the DB.
      if (data.contentId) {
        if (data.slideIndex !== undefined) {
          const { data: existing } = await supabase
            .from("content_generations")
            .select("generated_image_url")
            .eq("id", data.contentId)
            .eq("user_id", user.id)
            .maybeSingle();

          const slideCount = data.slideCount ?? data.slideIndex + 1;
          let slides: (string | null)[] = [];
          const raw = existing?.generated_image_url;
          if (raw?.startsWith("[")) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) slides = parsed;
            } catch { /* fall through to a fresh array */ }
          }
          slides = Array.from({ length: slideCount }, (_, i) => slides[i] ?? null);
          slides[data.slideIndex] = dataUrl;

          const { error } = await supabase
            .from("content_generations")
            .update({ generated_image_url: JSON.stringify(slides) })
            .eq("id", data.contentId)
            .eq("user_id", user.id);
          if (error) console.error("[generateImage] Failed to persist slide image:", error.message);
        } else {
          const { error } = await supabase
            .from("content_generations")
            .update({ generated_image_url: dataUrl })
            .eq("id", data.contentId)
            .eq("user_id", user.id);
          if (error) console.error("[generateImage] Failed to persist image:", error.message);
        }
      }

      return { dataUrl };
    } catch (error: any) {
      console.error("FULL SERVER ERROR:", error);
      throw error;
    }
  });

const UpdateCustomizationInputSchema = z.object({
  contentId:     z.string().uuid(),
  customization: PostCustomizationSchema,
});

export const updatePostCustomization = createServerFn({ method: "POST" })
  .validator((data: unknown) => UpdateCustomizationInputSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseUrl, supabaseAnonKey, geminiApiKey } = validateEnv();
    const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized. Please sign in.");

    const { error } = await supabase
      .from("content_generations")
      .update({ customization: data.customization })
      .eq("id", data.contentId)
      .eq("user_id", user.id);

    if (error) throw new Error(`Save failed: ${error.message}`);
    return { ok: true };
  });

