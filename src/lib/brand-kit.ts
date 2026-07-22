import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type BrandKit = {
  clinicName: string;
  doctorName: string;
  specialty: string;
  phone: string;
  website: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  /** data URLs (prototype storage) */
  logo?: string;
  doctorPhoto?: string;
  clinicPhoto?: string;
  coverPhoto?: string;
  teamPhoto?: string;
};

export const defaultBrandKit: BrandKit = {
  clinicName: "Bright Smile Dental Studio",
  doctorName: "Dr. Rhea Patel",
  specialty: "Dentist",
  phone: "+91 98200 12345",
  website: "brightsmile.clinic",
  address: "12 Linking Rd, Bandra West, Mumbai",
  primaryColor: "#0E7C7B",
  secondaryColor: "#1f4e79",
};

// What creatives actually start from: no identity data at all (a creative must
// never show placeholder doctor/clinic details), only the design-color defaults
// that themes and gradients rely on.
export const emptyBrandKit: BrandKit = {
  clinicName: "",
  doctorName: "",
  specialty: "",
  phone: "",
  website: "",
  address: "",
  primaryColor: defaultBrandKit.primaryColor,
  secondaryColor: defaultBrandKit.secondaryColor,
};

// Earlier versions merged defaultBrandKit into every read and hydrateFromDb
// persisted that merge, so existing per-account caches carry the dummy
// identity values. Strip exact matches so they never resurface on creatives.
const IDENTITY_KEYS = ["clinicName", "doctorName", "specialty", "phone", "website", "address"] as const;

function stripLegacyDummies(kit: BrandKit): BrandKit {
  const out = { ...kit };
  for (const k of IDENTITY_KEYS) {
    if (out[k] === defaultBrandKit[k]) out[k] = "";
  }
  return out;
}

const KEY_PREFIX = "medipost.brandkit.v1";

// Brand kits are namespaced per signed-in account so switching accounts in the
// same browser never shows one account's logo/colors/photos to another.
function brandKitKey(userId: string) {
  return `${KEY_PREFIX}:${userId}`;
}

export function readBrandKit(userId: string): BrandKit {
  if (typeof window === "undefined") return emptyBrandKit;
  try {
    let raw = window.localStorage.getItem(brandKitKey(userId));
    if (!raw) {
      // One-time migration: kits cached before per-account namespacing live at
      // the bare legacy key. The first account to sign in claims it, then it's
      // removed so other accounts on this browser don't inherit it.
      const legacy = window.localStorage.getItem(KEY_PREFIX);
      if (legacy) {
        window.localStorage.setItem(brandKitKey(userId), legacy);
        window.localStorage.removeItem(KEY_PREFIX);
        raw = legacy;
      }
    }
    if (!raw) return emptyBrandKit;
    return stripLegacyDummies({ ...emptyBrandKit, ...(JSON.parse(raw) as Partial<BrandKit>) });
  } catch {
    return emptyBrandKit;
  }
}

export function writeBrandKit(userId: string, kit: BrandKit) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(brandKitKey(userId), JSON.stringify(kit));
  window.dispatchEvent(new CustomEvent("brandkit:change"));
}

// ── DB hydration ────────────────────────────────────────────────────────────
// The Brand page saves the kit to the Supabase `brand_kits` row — that row is
// the source of truth; localStorage is only a per-account cache. Hydrating
// inside the hook (instead of relying on whichever page happens to push DB data
// into setBrand first) keeps every preview's brand data matching what the
// Brand page saved.
let lastHydrated = { userId: "", at: 0 };

// Call this after a successful brand kit save so the next useBrandKit mount
// always fetches fresh data instead of returning the stale cache.
export function resetHydrationCache() {
  lastHydrated = { userId: "", at: 0 };
}

async function hydrateFromDb(userId: string): Promise<void> {
  // dedupe the burst of hook instances mounting on the same page
  const now = Date.now();
  if (lastHydrated.userId === userId && now - lastHydrated.at < 3000) return;
  lastHydrated = { userId, at: now };

  const { data, error } = await supabase
    .from("brand_kits")
    .select(
      "clinic_name, doctor_name, specialty, phone, website, address, " +
      "logo_url, doctor_photo_url, clinic_photo_url, brand_colors"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return;

  const d = data as unknown as Record<string, unknown>;
  const colors = (d.brand_colors ?? {}) as Record<string, string>;
  const str = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim() ? v : undefined;

  // Only non-empty DB values override the cache; fields the doctor left blank
  // stay empty so creatives simply omit them (never placeholder data).
  const fromDb: Partial<BrandKit> = {};
  const put = (key: keyof BrandKit, value: string | undefined) => {
    if (value !== undefined) (fromDb as Record<string, string>)[key] = value;
  };

  put("clinicName",     str(d.clinic_name));
  put("doctorName",     str(d.doctor_name));
  put("specialty",      str(d.specialty));
  put("phone",          str(d.phone));
  put("website",        str(d.website));
  put("address",        str(d.address));
  put("primaryColor",   str(colors.primary));
  put("secondaryColor", str(colors.secondary));
  put("logo",           str(d.logo_url));
  put("doctorPhoto",    str(d.doctor_photo_url));
  put("clinicPhoto",    str(d.clinic_photo_url));

  // writeBrandKit dispatches "brandkit:change", so every mounted hook instance
  // picks the merged kit up.
  writeBrandKit(userId, { ...readBrandKit(userId), ...fromDb });
}

export function useBrandKit(): [BrandKit, (next: BrandKit) => void] {
  const [userId, setUserId] = useState<string | null>(null);
  const [kit, setKit] = useState<BrandKit>(emptyBrandKit);

  // Track which account is signed in so reads/writes always land in that
  // account's own bucket — resolved async, so state starts at defaults.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      const id = session?.user?.id ?? null;
      setUserId(id);
      setKit(id ? readBrandKit(id) : emptyBrandKit);
      if (id) void hydrateFromDb(id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? null;
      setUserId(id);
      setKit(id ? readBrandKit(id) : emptyBrandKit);
      if (id) void hydrateFromDb(id);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const sync = () => setKit(readBrandKit(userId));
    window.addEventListener("brandkit:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("brandkit:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [userId]);

  const save = (next: BrandKit) => {
    setKit(next);
    if (userId) writeBrandKit(userId, next);
  };

  return [kit, save];
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}