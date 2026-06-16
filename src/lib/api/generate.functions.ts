import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  specialty: z.string().min(1),
  type: z.string().min(1),
  topic: z.string().min(1),
  tone: z.string().min(1),
  audience: z.string().min(1),
});

export type GenerateInput = z.infer<typeof InputSchema>;

export type Section = { heading: string; body: string };
export type Variation = {
  label: string;
  sections: Section[];
  fullText: string;
};
export type Visual = {
  concept: string;
  colors: string[];
  style: string;
};
export type GenerateOutput = {
  variations: Variation[];
  visual: Visual;
};

function structureFor(type: string): string {
  switch (type) {
    case "Instagram Post":
      return `sections MUST be exactly: "Caption", "Hashtags" (10-15 relevant hashtags space-separated), "CTA".`;
    case "Blog Article":
      return `sections MUST be exactly: "Title", "Introduction", "Main Content" (3-5 short paragraphs), "Conclusion".`;
    case "Patient Education":
      return `sections MUST be exactly: "Patient-Friendly Explanation", "Key Takeaways" (bulleted with "• "), "CTA".`;
    case "Greeting / Festival Post":
      return `sections MUST be exactly: "Greeting Message", "Caption", "Hashtags".`;
    case "Reel Script":
      return `sections MUST be exactly: "Hook" (first 3 seconds), "Main Talking Points" (numbered), "CTA".`;
    case "Health Awareness Post":
      return `sections MUST be exactly: "Headline", "Awareness Message", "Key Facts" (bulleted), "CTA".`;
    case "Caption":
      return `sections MUST be exactly: "Caption", "Hashtags".`;
    default:
      return `Use 2-4 clearly labelled sections appropriate to a "${type}".`;
  }
}

function buildPrompt(d: GenerateInput) {
  return `You are Medipost AI, an assistant that writes professional, safe, marketing-ready healthcare content for clinicians.

BRIEF
- Specialty: ${d.specialty}
- Content type: ${d.type}
- Topic: ${d.topic}
- Tone: ${d.tone}
- Target audience: ${d.audience}

CONTENT RULES (strict)
- Be accurate, evidence-aligned, and easy to understand for ${d.audience}.
- DO NOT diagnose, prescribe, or guarantee outcomes.
- DO NOT include medical misinformation or unverified claims.
- Always remind to consult a qualified professional when appropriate.
- Keep it patient-friendly and marketing-friendly.

STRUCTURE
${structureFor(d.type)}

TASK
Generate THREE clearly different variations (Option A, Option B, Option C) of this content. Each must take a different angle (e.g. educational, emotional, story-driven) while following the required section structure.

Also propose ONE suggested visual concept for accompanying imagery: a short scene description, 3-5 hex colors that fit a healthcare brand, and a short visual style note (e.g. "Soft, clinical, natural light photography").

Return STRICT JSON with this exact shape, no markdown fences, no commentary:
{
  "variations": [
    { "label": "Option A", "sections": [{ "heading": "...", "body": "..." }] },
    { "label": "Option B", "sections": [{ "heading": "...", "body": "..." }] },
    { "label": "Option C", "sections": [{ "heading": "...", "body": "..." }] }
  ],
  "visual": {
    "concept": "one-sentence scene description",
    "colors": ["#RRGGBB", "#RRGGBB", "#RRGGBB"],
    "style": "short style description"
  }
}`;
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

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateOutput> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are Medipost AI, a healthcare content writer. Always respond with strict JSON only when asked." },
          { role: "user", content: buildPrompt(data) },
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
    const parsed = extractJson(content) as Partial<GenerateOutput>;

    const variations: Variation[] = (parsed.variations ?? []).slice(0, 3).map((v, i) => {
      const sections = (v?.sections ?? []).map((s) => ({
        heading: String(s?.heading ?? ""),
        body: String(s?.body ?? ""),
      }));
      const fullText = sections.map((s) => `${s.heading}\n${s.body}`).join("\n\n");
      return {
        label: v?.label || `Option ${String.fromCharCode(65 + i)}`,
        sections,
        fullText,
      };
    });

    const visual: Visual = {
      concept: parsed.visual?.concept ?? "",
      colors: Array.isArray(parsed.visual?.colors) ? parsed.visual!.colors.slice(0, 5) : [],
      style: parsed.visual?.style ?? "",
    };

    if (variations.length === 0) throw new Error("No content was generated. Please try again.");

    return { variations, visual };
  });