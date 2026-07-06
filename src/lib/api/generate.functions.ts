/**
 * src/lib/api/generate.functions.ts
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getRequestHeader } from "@tanstack/react-start/server";

// ─────────────────────────────────────────────────────────────────────────────
// ENV VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function validateEnv(): { supabaseUrl: string; supabaseAnonKey: string; geminiApiKey: string } {
  const supabaseUrl     = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const geminiApiKey    = process.env.GEMINI_API_KEY;

  if (!supabaseUrl)     throw new Error("Missing env: SUPABASE_URL");
  if (!supabaseAnonKey) throw new Error("Missing env: SUPABASE_ANON_KEY");
  if (!geminiApiKey)    throw new Error("Missing env: GEMINI_API_KEY");

  return { supabaseUrl, supabaseAnonKey, geminiApiKey };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE SERVER CLIENT
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI — text generation
// ─────────────────────────────────────────────────────────────────────────────

async function callGeminiText(
  system:     string,
  userPrompt: string,
  apiKey:     string,
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature:      0.85,
      topK:             40,
      topP:             0.95,
      maxOutputTokens:  8192,
      responseMimeType: "application/json",
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  const MAX_ATTEMPTS = 5; // extra retries for 503 high-demand spikes
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
      // Exponential backoff: 1s, 2s, 4s, 8s
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

// ─────────────────────────────────────────────────────────────────────────────
// POLLINATIONS.AI — image generation
// FIX: now returns BOTH the dataUrl (for immediate display) AND the
//      imageUrl (the public Pollinations URL stored in the DB).
// ─────────────────────────────────────────────────────────────────────────────

async function callPollinationsImage(
  prompt: string,
): Promise<{ dataUrl: string; imageUrl: string }> {
  const encoded  = encodeURIComponent(prompt);
  const seed     = Date.now();
  // Store this URL — it's publicly accessible and doesn't expire
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1080&model=flux&nologo=true&seed=${seed}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    let res: Response;
    try {
      res = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
    } catch (networkErr: any) {
      // fetch() itself threw — network down, DNS failure, or timeout
      console.warn(`[Pollinations] Network error on attempt ${attempt}:`, networkErr?.message);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw new Error(
        "Image generation service is temporarily unreachable. " +
        "Please wait a moment and try again."
      );
    }

    if (res.ok) {
      const buffer   = await res.arrayBuffer();
      const b64      = Buffer.from(buffer).toString("base64");
      const mimeType = res.headers.get("content-type") ?? "image/jpeg";
      return {
        dataUrl:  `data:${mimeType};base64,${b64}`,
        imageUrl, // ← the public URL we'll persist to the DB
      };
    }

    const isRetryable = res.status === 429 || res.status === 503;
    if (attempt < 3 && isRetryable) {
      const delay = 1500 * Math.pow(2, attempt - 1);
      console.warn(`[Pollinations] Attempt ${attempt} got ${res.status}. Retrying in ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    if (res.status === 429)
      throw new Error("Image generation is rate-limited. Please wait 30 seconds and try again.");
    throw new Error(`Image generation failed (${res.status}). Please try again.`);
  }

  throw new Error("Image generation failed after 3 attempts. Please try again in a moment.");
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT / OUTPUT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

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
  kind:               z.enum(["single", "carousel", "story", "reel", "campaign", "festive"]),
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
  brand:      BrandSchema,
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
  // `relationship` is an optional model-provided hint (e.g. "statistic", "comparison").
  // It is never required — src/lib/visual-strategy.ts classifies layout deterministically
  // from title/content and only falls back to this hint as a last resort.
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

export type GenerateOutput =
  | SinglePost
  | CarouselPost
  | StoryPost
  | ReelScript
  | Campaign
  | FestivePost;

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

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
    "List the red-flag symptoms that mean 'see a doctor now'. Be firm but not alarmist. End with a clear next-step.",
  "prevention":
    "Focus on small daily/weekly habits that prevent the condition. Mention realistic risk reduction.",
  "doctor-explains":
    "First-person voice from the clinician. Use phrases like 'As a {specialty}, here's what I tell my patients…'.",
  "awareness":
    "Frame the issue, scale of the problem, who is at risk, and a clear call to action / movement.",
  "clinic-promo":
    "Highlight a specific service / package / new doctor. Lead with patient benefit, not features. End with a booking CTA.",
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

function brandBlock(b: GenerateInput["brand"]): string {
  if (!b) return "BRAND: not provided. Keep content brand-neutral.";
  const lines: string[] = ["BRAND CONTEXT (subtly weave in, do not stuff):"];
  if (b.clinicName)    lines.push(`- Clinic name: ${b.clinicName}`);
  if (b.doctorName)    lines.push(`- Doctor: ${b.doctorName}`);
  if (b.primaryColor || b.secondaryColor)
    lines.push(`- Brand colors: ${b.primaryColor ?? ""} ${b.secondaryColor ?? ""}`.trim());
  if (b.website)        lines.push(`- Website: ${b.website}`);
  if (b.phone)          lines.push(`- Phone: ${b.phone}`);
  if (b.hasDoctorPhoto) lines.push(`- Doctor headshot available — reference in visual.concept.`);
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

function buildPrompt(d: GenerateInput): { system: string; user: string } {
  const base = `BRIEF
- Specialty: ${d.specialty}
- Topic: ${d.topic}
- Tone: ${d.tone}
- Target audience: ${d.audience}
- Content category: ${d.category}

CATEGORY GUIDANCE
${CATEGORY_HINTS[d.category]}

${brandBlock(d.brand)}

${SHARED_RULES}`;

  switch (d.kind) {
    case "single":
      return {
        system: "You are Medipost AI, a healthcare social-media copywriter. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Generate ONE scroll-stopping single social media post about "${d.topic}".

Return STRICT JSON, no markdown:
{
  "headline": "punchy 4-8 word headline",
  "content": "main body 60-100 words, 2-3 short paragraphs separated by \\n\\n",
  "caption": "1-2 sentence Instagram caption",
  "cta": "short call to action",
  "hashtags": ["#tag1","#tag2","... 8-12 hashtags total"],
  ${VISUAL_BLOCK}
}`,
      };

    case "carousel": {
      const n         = d.slideCount ?? 7;
      const structure = carouselStructureFor(d.category, n);
      return {
        system: "You are Medipost AI. You design educational carousel posts for doctors. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Design an Instagram CAROUSEL with exactly ${n} slides on "${d.topic}".

${structure}

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

    case "story":
      return {
        system: "You are Medipost AI. You write tight, vertical-format healthcare Instagram Stories. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Write ONE Instagram Story (9:16) about "${d.topic}". Max 25 words total.

Return STRICT JSON:
{
  "headline": "4-6 word headline",
  "message": "supporting message, max 25 words",
  "cta": "tap-style CTA",
  ${VISUAL_BLOCK}
}`,
      };

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
      const fest      = d.festival || "the upcoming festival";
      const styleNote = d.festiveStyle
        ? `CREATIVE STYLE: ${d.festiveStyle}. Greeting, caption AND visual must reflect this style.`
        : "";
      const extra = d.customInstructions?.trim()
        ? `ADDITIONAL INSTRUCTIONS:\n"""\n${d.customInstructions!.trim()}\n"""`
        : "";
      return {
        system:
          "You are Medipost AI, a culturally-aware festive greeting writer for healthcare brands. You write greetings for ANY occasion. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Write a greeting post for "${fest}" from a ${d.specialty}'s clinic.
- Must feel specific to "${fest}" — not generic.
- Tie the wish gracefully to health/wellness without being preachy.
${styleNote}
${extra}

Return STRICT JSON:
{
  "festival": "${fest}",
  "greeting": "main greeting, 2-3 sentences, ready to render on a card",
  "caption": "matching social caption, 1-2 sentences",
  "hashtags": ["#tag1","... 6-10 festive + healthcare hashtags"],
  ${VISUAL_BLOCK}
}`,
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZERS
// ─────────────────────────────────────────────────────────────────────────────

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
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER FUNCTION: generateContent
// ─────────────────────────────────────────────────────────────────────────────

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

    let rawText: string;
    try {
      rawText = await callGeminiText(system, userPrompt, geminiApiKey);
    } catch (geminiErr: any) {
      try { await supabase.rpc("refund_credit", { p_user_id: user.id }); } catch {}
      throw geminiErr;
    }

    const parsed = extractJson(rawText);
    const result = normalize(data.kind, parsed);

    const hashtags =
      "hashtags" in result && Array.isArray(result.hashtags) ? result.hashtags : [];

    // Select back the id so the client can link the image to this row
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
        ai_model:         "gemini-2.5-flash",
      })
      .select("id")
      .single();

    if (saveError) console.error("[generateContent] DB save failed:", saveError.message);

    // Attach _rowId so the client can pass it to generateImage
    return { ...result, _rowId: inserted?.id ?? undefined } as typeof result & { _rowId?: string };
    } catch (error: any) {
      console.error("FULL SERVER ERROR:", error);
      throw error;
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// SERVER FUNCTION: generateImage
// FIX: now stores the public Pollinations URL in generated_image_url
//      instead of the "[base64 image — stored client-side]" placeholder.
// ─────────────────────────────────────────────────────────────────────────────

const ImageInputSchema = z.object({
  prompt:      z.string().min(3).max(2000),
  visualStyle: z.string().optional(),
  // If provided, UPDATE this existing row instead of inserting a new one
  contentId:   z.string().uuid().optional(),
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
};

export const generateImage = createServerFn({ method: "POST" })
  .validator((data: unknown) => ImageInputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateImageOutput> => {
    try {
    const { supabaseUrl, supabaseAnonKey } = validateEnv();

    const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized. Please sign in to generate images.");

    // AI image generation is a Pro-only feature — check subscription directly
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("plan, plan_expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const isPro = subRow?.plan === "pro"
      && !!subRow?.plan_expires_at
      && new Date(subRow.plan_expires_at) > new Date();

    if (!isPro) {
      throw new Error("PRO_REQUIRED: AI image generation is available on the Pro plan. Upgrade to unlock it.");
    }

    const directive = data.visualStyle ? (STYLE_DIRECTIVES[data.visualStyle] ?? "") : "";
    const fullPrompt = [
      data.prompt,
      directive,
      "Square 1:1 composition, Instagram-ready, premium healthcare marketing creative, no text, no watermark, no logos, photorealistic where appropriate.",
    ]
      .filter(Boolean)
      .join(" ");

    // FIX: destructure both dataUrl (returned to client) and imageUrl (stored in DB)
    let dataUrl: string;
    let imageUrl: string;
    try {
      ({ dataUrl, imageUrl } = await callPollinationsImage(fullPrompt));
    } catch (imgErr: any) {
      throw imgErr;
    }

    // If a contentId was passed, UPDATE that row's image URL (links image to text).
    // Otherwise INSERT a standalone image row (backward compatible).
    if (data.contentId) {
      const { error: updateError } = await supabase
        .from("content_generations")
        .update({ generated_image_url: imageUrl })
        .eq("id", data.contentId)
        .eq("user_id", user.id);   // security: only update own rows
      if (updateError) console.error("[generateImage] DB update failed:", updateError.message);
    } else {
      const { error: saveError } = await supabase
        .from("content_generations")
        .insert({
          user_id:             user.id,
          workflow_kind:       "single",
          content_category:    "educational",
          specialty:           "",
          tone:                "Professional",
          topic:               data.prompt.slice(0, 200),
          generated_text:      "",
          generated_image_url: imageUrl,
          hashtags:            [],
          status:              "completed",
          ai_model:            "pollinations-flux",
        });
      if (saveError) console.error("[generateImage] DB save failed:", saveError.message);
    }

    return { dataUrl };
    } catch (error: any) {
      console.error("FULL SERVER ERROR:", error);
      throw error;
    }
  });