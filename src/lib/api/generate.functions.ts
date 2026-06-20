import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BrandSchema = z
  .object({
    clinicName: z.string().optional(),
    doctorName: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    website: z.string().optional(),
    phone: z.string().optional(),
    hasLogo: z.boolean().optional(),
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
  kind: z.enum(["single", "carousel", "story", "reel", "campaign", "festive"]),
  category: CategoryEnum.default("educational"),
  specialty: z.string().min(1),
  topic: z.string().min(1),
  tone: z.string().min(1),
  audience: z.string().min(1),
  festival: z.string().optional(),
  slideCount: z.number().int().min(5).max(10).optional(),
  brand: BrandSchema,
});

export type GenerateInput = z.infer<typeof InputSchema>;

export type Visual = {
  concept: string;
  colors: string[];
  style: string;
  layout: string;
  imagePrompt: string;
  composition: string;
  visualStyle: string;
};

export type SinglePost = {
  kind: "single";
  headline: string;
  content: string;
  caption: string;
  cta: string;
  hashtags: string[];
  visual: Visual;
};

export type CarouselPost = {
  kind: "carousel";
  title: string;
  slides: { title: string; content: string; imagePrompt?: string }[];
  cta: string;
  hashtags: string[];
  visual: Visual;
};

export type StoryPost = {
  kind: "story";
  headline: string;
  message: string;
  cta: string;
  visual: Visual;
};

export type ReelScript = {
  kind: "reel";
  hook: string;
  talkingPoints: string[];
  cta: string;
  visual: Visual;
};

export type Campaign = {
  kind: "campaign";
  theme: string;
  objective: string;
  postIdeas: string[];
  weeklySchedule: { day: string; format: string; idea: string }[];
  ctaSuggestions: string[];
  visual: Visual;
};

export type FestivePost = {
  kind: "festive";
  festival: string;
  greeting: string;
  caption: string;
  hashtags: string[];
  visual: Visual;
};

export type GenerateOutput =
  | SinglePost
  | CarouselPost
  | StoryPost
  | ReelScript
  | Campaign
  | FestivePost;

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

/** Per-category carousel slide structures (drives slide outlines). */
function carouselStructureFor(
  category: z.infer<typeof CategoryEnum>,
  n: number,
): string {
  const fill = (count: number, label: string) =>
    Array.from({ length: count }, (_, i) => `Slide ${i + 2}: ${label} ${i + 1}`).join("\n");

  switch (category) {
    case "myth-fact":
      return `MUST follow exactly this structure (adapt slide count as needed but keep the order):
Slide 1: HOOK — call out the myth in 4-7 words (e.g. "Brushing harder ≠ cleaner teeth")
Slide 2: THE MYTH — state the common belief in plain language
Slide 3: THE FACT — the evidence-based truth
Slide 4: WHY — short mechanism explanation (1-2 sentences)
${n >= 5 ? `Slide 5: WHAT TO DO INSTEAD — practical fix\n` : ""}${n >= 6 ? `Slide 6: BONUS TIP — extra value\n` : ""}Slide ${n}: CTA — clear next step + book/consult line`;
    case "patient-faq":
      return `MUST follow exactly this structure:
Slide 1: HOOK — frame the question patients actually ask
Slide 2: QUESTION — the question in patient words
Slide 3: DIRECT ANSWER — yes/no/it depends in one line + 1-2 sentence explanation
Slide 4: WHY THIS HAPPENS — the medical reason in plain language
${n >= 5 ? `Slide 5: WHAT TO DO — patient action steps\n` : ""}${n >= 6 ? `Slide 6: KEY TAKEAWAY — the 'remember this' line\n` : ""}Slide ${n}: CTA — invite them to book / DM / ask`;
    case "educational":
      return `MUST follow exactly this structure:
Slide 1: HOOK — surprising stat or relatable scenario
Slide 2: KEY POINT 1 — the most important idea
Slide 3: KEY POINT 2 — supporting idea
${n >= 4 ? `Slide 4: KEY POINT 3 — supporting idea\n` : ""}${n >= 5 ? `Slide 5: PRACTICAL TIPS — what the reader should do this week\n` : ""}${n >= 6 ? `Slide 6: MYTH BUSTED — a common misconception quickly corrected\n` : ""}Slide ${n}: CTA — book a consultation / save this post`;
    case "warning-signs":
      return `MUST follow exactly this structure:
Slide 1: HOOK — "Don't ignore these signs of {topic}"
Slides 2 to ${n - 1}: ONE warning sign per slide. Title = the symptom in plain language; body = why it matters and when to act.
Slide ${n}: CTA — "If you notice any of these, book a {specialty} consultation"`;
    case "prevention":
      return `MUST follow exactly this structure:
Slide 1: HOOK — what's at stake without prevention
Slides 2 to ${n - 1}: ONE prevention habit per slide. Title = habit (3-5 words). Body = how / how often / why it works.
Slide ${n}: CTA — book a preventive check-up`;
    case "health-tips":
      return `MUST follow exactly this structure:
Slide 1: HOOK — promise of the tips (e.g. "5 dentist-approved tips for whiter teeth")
Slides 2 to ${n - 1}: ONE tip per slide. Title = the tip itself; body = brief how-to.
Slide ${n}: CTA — "Save this & share with someone who needs it"`;
    case "doctor-explains":
      return `MUST follow exactly this structure, first-person:
Slide 1: HOOK — "As a {specialty}, here's what most patients get wrong about {topic}"
Slide 2: THE COMMON BELIEF
Slide 3: WHAT'S ACTUALLY HAPPENING — clinician-level explanation in plain words
${n >= 4 ? `Slide 4: WHAT I RECOMMEND — clinical guidance\n` : ""}${n >= 5 ? `Slide 5: WHO SHOULD WORRY — risk groups\n` : ""}Slide ${n}: CTA — book a consult / DM for questions`;
    case "did-you-know":
      return `MUST follow exactly this structure:
Slide 1: HOOK — "Did you know…?" + the surprising fact
Slides 2 to ${n - 1}: ONE related insight per slide.
Slide ${n}: CTA`;
    case "awareness":
      return `MUST follow exactly this structure:
Slide 1: HOOK — the cause / awareness theme
Slide 2: THE PROBLEM — scale & stats
Slide 3: WHO IS AT RISK
${n >= 4 ? `Slide 4: WHAT YOU CAN DO\n` : ""}${n >= 5 ? `Slide 5: HOW WE HELP AT THE CLINIC\n` : ""}Slide ${n}: CTA — join the movement / share / book a screening`;
    case "clinic-promo":
      return `MUST follow exactly this structure:
Slide 1: HOOK — patient benefit headline
Slide 2: THE SERVICE / OFFER — what it is in plain language
Slide 3: WHO IT'S FOR
${n >= 4 ? `Slide 4: WHAT TO EXPECT — patient journey in 2-3 lines\n` : ""}${n >= 5 ? `Slide 5: WHY OUR CLINIC — credibility / experience\n` : ""}Slide ${n}: CTA — book now / WhatsApp us`;
    case "greeting":
      return `Festive carousel:
Slide 1: Greeting headline tied to the occasion
Slides 2 to ${n - 1}: One short wellness wish per slide tied to the festival
Slide ${n}: Warm signoff from the clinic`;
    case "reel-hook":
      return `Use the carousel as a teaser:
Slide 1: 3-second scroll-stop HOOK
Slides 2 to ${n - 1}: One curiosity beat per slide
Slide ${n}: CTA — "Watch the full reel" / "Follow for more"`;
  }
}

function brandBlock(b: GenerateInput["brand"]): string {
  if (!b) return "BRAND: not provided. Keep content brand-neutral.";
  const lines: string[] = ["BRAND CONTEXT (subtly weave in, do not stuff):"];
  if (b.clinicName) lines.push(`- Clinic name: ${b.clinicName}`);
  if (b.doctorName) lines.push(`- Doctor: ${b.doctorName}`);
  if (b.primaryColor || b.secondaryColor) {
    lines.push(
      `- Brand colors (use as visual.colors[0] and visual.colors[1] verbatim): ${b.primaryColor ?? ""} ${b.secondaryColor ?? ""}`.trim(),
    );
  }
  if (b.website) lines.push(`- Website: ${b.website}`);
  if (b.phone) lines.push(`- Phone: ${b.phone}`);
  if (b.hasDoctorPhoto) lines.push(`- A doctor headshot is available — reference it in visual.concept where appropriate.`);
  if (b.hasClinicPhoto) lines.push(`- A clinic photo is available — reference it as a possible background.`);
  if (b.hasLogo) lines.push(`- A clinic logo is available — mention placing it as a brand mark.`);
  return lines.join("\n");
}

const VISUAL_BLOCK = `"visual": {
    "concept": "one-sentence scene description for the accompanying image",
    "colors": ["#RRGGBB","#RRGGBB","#RRGGBB","#RRGGBB"],
    "style": "short visual style note (e.g. Soft clinical photography)",
    "layout": "layout recommendation (e.g. Instagram Square Post, 9:16 Vertical, Carousel 1080x1080)",
    "visualStyle": "pick ONE: 'Modern Healthcare' | 'Premium Clinic' | 'Editorial Infographic' | 'Lifestyle Photography' | 'Awareness Campaign' | 'Luxury Aesthetic'",
    "composition": "1-line composition instructions (subject placement, camera angle, lighting, color mood)",
    "imagePrompt": "FULL ready-to-send image generation prompt (60-120 words). Must describe a real, photorealistic or editorial-illustrated healthcare scene related to the topic and specialty. NEVER ask for solid color backgrounds. Include subject, environment, lighting, mood, framing, and 'no text, no watermark, Instagram-ready, premium healthcare marketing'."
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
The post MUST clearly read as a "${d.category}" piece (see CATEGORY GUIDANCE above).
The headline must be specific — not a generic platitude.

Return STRICT JSON, no markdown, no commentary:
{
  "headline": "punchy 4-8 word headline",
  "content": "main body, 60-100 words, friendly and informative, 2-3 short paragraphs separated by \\n\\n",
  "caption": "1-2 sentence Instagram caption",
  "cta": "short call to action (e.g. 'Book your check-up today')",
  "hashtags": ["#tag1","#tag2", "... 8-12 relevant hashtags total"],
  ${VISUAL_BLOCK}
}`,
      };

    case "carousel": {
      const n = d.slideCount ?? 7;
      const structure = carouselStructureFor(d.category, n);
      return {
        system: "You are Medipost AI. You design educational carousel posts for doctors. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Design an Instagram CAROUSEL with exactly ${n} slides on "${d.topic}".

${structure}

- Each slide title 3-7 words, slide content 20-40 words, plain text.
- Do NOT repeat the same idea across slides. Each slide must add new value.
- For EACH slide, write an "imagePrompt": a vivid 40-80 word AI image prompt for that slide that visually communicates the slide's idea (real healthcare scene, doctor/patient/anatomy/lifestyle imagery — NOT solid colors, NOT text-on-background). End each with "no text, no watermark, Instagram-ready, premium healthcare brand aesthetic".

Return STRICT JSON:
{
  "title": "short carousel title",
  "slides": [
    { "title": "Slide 1 title", "content": "Slide 1 body", "imagePrompt": "..." },
    ... exactly ${n} slides total
  ],
  "cta": "the final CTA repeated as a single line",
  "hashtags": ["#tag1", "... 8-12 hashtags"],
  ${VISUAL_BLOCK}
}`,
      };
    }

    case "story":
      return {
        system: "You are Medipost AI. You write tight, vertical-format healthcare Instagram Stories. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Write ONE Instagram Story (9:16) about "${d.topic}".
Keep total text very short — stories must be readable on a phone in 3 seconds.

Return STRICT JSON:
{
  "headline": "4-6 word headline, big text",
  "message": "short supporting message, max 25 words",
  "cta": "tap-style CTA (e.g. 'Swipe up to book')",
  ${VISUAL_BLOCK}
}`,
      };

    case "reel":
      return {
        system: "You are Medipost AI, a short-form video scriptwriter for clinicians. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Write a 30-45 second REEL SCRIPT about "${d.topic}".
- Hook = the first 3 seconds, must stop the scroll.
- 3-5 main talking points, each one sentence the doctor speaks on camera.
- End with a CTA.

Return STRICT JSON:
{
  "hook": "first 3-second hook line",
  "talkingPoints": ["point 1", "point 2", "point 3", "..."],
  "cta": "spoken call-to-action at the end",
  ${VISUAL_BLOCK}
}`,
      };

    case "campaign":
      return {
        system: "You are Medipost AI, a healthcare marketing strategist. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Plan a 1-week AWARENESS CAMPAIGN around "${d.topic}".
- Define a clear campaign theme and objective.
- Provide 6-8 distinct post ideas (mix of formats).
- Provide a 7-day schedule (Mon-Sun) mapping each day to a content format and idea.
- Provide 3-5 CTA suggestions usable across the campaign.

Return STRICT JSON:
{
  "theme": "campaign theme in 4-8 words",
  "objective": "what this campaign should achieve, 1-2 sentences",
  "postIdeas": ["idea 1", "idea 2", "..."],
  "weeklySchedule": [
    { "day": "Mon", "format": "Carousel | Reel | Story | Single Post | Live", "idea": "what to post" },
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
      const fest = d.festival || "the upcoming festival";
      return {
        system: "You are Medipost AI, a culturally-aware festive greeting writer for healthcare brands. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Write a ${fest} greeting from a ${d.specialty}'s clinic.
- Greeting should feel warm, respectful, and brand-safe.
- Tie the wish gracefully to health/wellness without being preachy.

Return STRICT JSON:
{
  "festival": "${fest}",
  "greeting": "main greeting message, 2-3 sentences, ready to render on a card",
  "caption": "matching social media caption, 1-2 sentences",
  "hashtags": ["#tag1", "... 6-10 festive + healthcare hashtags"],
  ${VISUAL_BLOCK}
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
    concept: String(obj.concept ?? ""),
    colors: Array.isArray(obj.colors) ? obj.colors.slice(0, 6).map(String) : [],
    style: String(obj.style ?? ""),
    layout: String(obj.layout ?? ""),
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
        kind: "single",
        headline: String(raw?.headline ?? ""),
        content: String(raw?.content ?? ""),
        caption: String(raw?.caption ?? ""),
        cta: String(raw?.cta ?? ""),
        hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags.map(String) : [],
        visual,
      };
    case "carousel":
      return {
        kind: "carousel",
        title: String(raw?.title ?? ""),
        slides: Array.isArray(raw?.slides)
          ? raw.slides.map((s: any) => ({
              title: String(s?.title ?? ""),
              content: String(s?.content ?? ""),
              imagePrompt: s?.imagePrompt ? String(s.imagePrompt) : undefined,
            }))
          : [],
        cta: String(raw?.cta ?? ""),
        hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags.map(String) : [],
        visual,
      };
    case "story":
      return {
        kind: "story",
        headline: String(raw?.headline ?? ""),
        message: String(raw?.message ?? ""),
        cta: String(raw?.cta ?? ""),
        visual,
      };
    case "reel":
      return {
        kind: "reel",
        hook: String(raw?.hook ?? ""),
        talkingPoints: Array.isArray(raw?.talkingPoints) ? raw.talkingPoints.map(String) : [],
        cta: String(raw?.cta ?? ""),
        visual,
      };
    case "campaign":
      return {
        kind: "campaign",
        theme: String(raw?.theme ?? ""),
        objective: String(raw?.objective ?? ""),
        postIdeas: Array.isArray(raw?.postIdeas) ? raw.postIdeas.map(String) : [],
        weeklySchedule: Array.isArray(raw?.weeklySchedule)
          ? raw.weeklySchedule.map((s: any) => ({
              day: String(s?.day ?? ""),
              format: String(s?.format ?? ""),
              idea: String(s?.idea ?? ""),
            }))
          : [],
        ctaSuggestions: Array.isArray(raw?.ctaSuggestions) ? raw.ctaSuggestions.map(String) : [],
        visual,
      };
    case "festive":
      return {
        kind: "festive",
        festival: String(raw?.festival ?? ""),
        greeting: String(raw?.greeting ?? ""),
        caption: String(raw?.caption ?? ""),
        hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags.map(String) : [],
        visual,
      };
  }
}

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateOutput> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const { system, user } = buildPrompt(data);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`AI request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(content);
    return normalize(data.kind, parsed);
  });

/* ============================ AI Image Generation ============================ */

const ImageInputSchema = z.object({
  prompt: z.string().min(3).max(2000),
  visualStyle: z.string().optional(),
});

export type GenerateImageOutput = { dataUrl: string };

const STYLE_DIRECTIVES: Record<string, string> = {
  "Modern Healthcare":
    "modern healthcare photography, bright clinic, soft daylight, shallow depth of field, calm and trustworthy mood",
  "Premium Clinic":
    "premium private clinic editorial photography, luxurious interiors, warm neutral palette, cinematic lighting",
  "Editorial Infographic":
    "clean editorial healthcare illustration, flat vector style, minimal palette, infographic feel, isometric details",
  "Lifestyle Photography":
    "real lifestyle photography of patients and doctors, candid moments, natural light, documentary feel, authentic skin tones",
  "Awareness Campaign":
    "bold awareness campaign visual, high contrast, emotive subject, public health poster energy, single hero subject",
  "Luxury Aesthetic":
    "luxury aesthetic clinic visual, marble and gold accents, soft beige and ivory tones, fashion-editorial composition",
};

export const generateImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ImageInputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateImageOutput> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const directive = data.visualStyle ? STYLE_DIRECTIVES[data.visualStyle] : "";
    const fullPrompt = [
      data.prompt,
      directive,
      "Square 1:1 composition, Instagram-ready, premium healthcare marketing creative, no text, no watermark, no logos, no captions, photorealistic where appropriate.",
    ]
      .filter(Boolean)
      .join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Image rate limit reached. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`Image generation failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const b64: string | undefined = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image generation returned no image data");
    return { dataUrl: `data:image/png;base64,${b64}` };
  });