import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  kind: z.enum(["single", "carousel", "story", "reel", "campaign", "festive"]),
  specialty: z.string().min(1),
  topic: z.string().min(1),
  tone: z.string().min(1),
  audience: z.string().min(1),
  festival: z.string().optional(),
  slideCount: z.number().int().min(5).max(10).optional(),
});

export type GenerateInput = z.infer<typeof InputSchema>;

export type Visual = {
  concept: string;
  colors: string[];
  style: string;
  layout: string;
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
  slides: { title: string; content: string }[];
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
- Remind readers to consult a qualified professional when appropriate.`;

const VISUAL_BLOCK = `"visual": {
    "concept": "one-sentence scene description for the accompanying image",
    "colors": ["#RRGGBB","#RRGGBB","#RRGGBB","#RRGGBB"],
    "style": "short visual style note (e.g. Soft clinical photography)",
    "layout": "layout recommendation (e.g. Instagram Square Post, 9:16 Vertical, Carousel 1080x1080)"
  }`;

function buildPrompt(d: GenerateInput): { system: string; user: string } {
  const base = `BRIEF
- Specialty: ${d.specialty}
- Topic: ${d.topic}
- Tone: ${d.tone}
- Target audience: ${d.audience}

${SHARED_RULES}`;

  switch (d.kind) {
    case "single":
      return {
        system: "You are Medipost AI, a healthcare social-media copywriter. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Generate ONE scroll-stopping single social media post about "${d.topic}".

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
      return {
        system: "You are Medipost AI. You design educational carousel posts for doctors. Respond ONLY with strict JSON.",
        user: `${base}

TASK: Design an Instagram CAROUSEL with exactly ${n} slides on "${d.topic}".
- Slide 1 = cover slide (hook + topic).
- Slides 2 to ${n - 1} = educational/value slides, each one focused idea.
- Slide ${n} = final slide with a strong call-to-action.
- Each slide title 3-7 words, slide content 20-40 words, plain text.

Return STRICT JSON:
{
  "title": "short carousel title",
  "slides": [
    { "title": "Slide 1 title", "content": "Slide 1 body" },
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