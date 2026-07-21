import { supabase } from "@/lib/supabase";
import type { WorkflowKind, ContentCategory } from "@/lib/mock-data";
import type { GenerateOutput } from "@/lib/api/generate.functions";
import { parseCustomization, type PostCustomization } from "@/lib/post-customization";

/**
 * Studio's "active workspace" pointer: which post the user was last editing.
 * Deliberately small — the post's actual content/images/customization stay
 * in `content_generations` (already the source of truth) and are re-fetched
 * by id on restore, instead of being duplicated into localStorage.
 */

const STUDIO_SESSION_PREFIX = "medipost.studio-session.v1";

function studioSessionKey(userId: string) {
  return `${STUDIO_SESSION_PREFIX}:${userId}`;
}

export type StudioSessionPointer = {
  rowId: string;
  kind: WorkflowKind;
  category: ContentCategory;
};

export function readStudioSessionPointer(userId: string): StudioSessionPointer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(studioSessionKey(userId));
    return raw ? (JSON.parse(raw) as StudioSessionPointer) : null;
  } catch {
    return null;
  }
}

export function writeStudioSessionPointer(userId: string, pointer: StudioSessionPointer) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(studioSessionKey(userId), JSON.stringify(pointer));
  } catch {
    // best-effort — losing the restore pointer is not worth surfacing to the user
  }
}

export function clearStudioSessionPointer(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(studioSessionKey(userId));
  } catch {
    // no-op
  }
}

function parseSlideImageArray(url: string | null): (string | null)[] {
  if (!url?.startsWith("[")) return [];
  try {
    const arr = JSON.parse(url);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export type StudioSessionRow = {
  result: GenerateOutput;
  initialImageUrl: string | null;
  initialSlideImages: (string | null)[];
  initialCustomization: PostCustomization | null;
};

/**
 * Re-fetches a `content_generations` row for Studio's restore path — mirrors
 * the read path Content History already uses (parsePost/parseSlideImages/
 * parseCustomization) so a restored post looks identical to how it would
 * render there. Returns null if the row is missing, foreign, or malformed
 * (stale pointer, deleted post) so the caller can fall back to the empty
 * Studio state silently.
 */
export async function fetchStudioSessionRow(rowId: string): Promise<StudioSessionRow | null> {
  const { data, error } = await supabase
    .from("content_generations")
    .select("id, workflow_kind, generated_text, generated_image_url, customization")
    .eq("id", rowId)
    .single();

  if (error || !data) return null;

  let result: GenerateOutput;
  try {
    const parsed = JSON.parse(data.generated_text as string);
    if (!parsed || parsed.kind !== data.workflow_kind) return null;
    result = parsed as GenerateOutput;
  } catch {
    return null;
  }

  const imageUrl = data.generated_image_url as string | null;
  const isSlideArray = imageUrl?.startsWith("[") ?? false;

  return {
    result,
    initialImageUrl: isSlideArray ? null : imageUrl,
    initialSlideImages: isSlideArray ? parseSlideImageArray(imageUrl) : [],
    initialCustomization: parseCustomization(data.customization, result.kind),
  };
}
