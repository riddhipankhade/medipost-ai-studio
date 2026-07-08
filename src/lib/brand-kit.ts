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

const KEY_PREFIX = "medipost.brandkit.v1";

// Brand kits are namespaced per signed-in account so switching accounts in the
// same browser never shows one account's logo/colors/photos to another.
function brandKitKey(userId: string) {
  return `${KEY_PREFIX}:${userId}`;
}

export function readBrandKit(userId: string): BrandKit {
  if (typeof window === "undefined") return defaultBrandKit;
  try {
    const raw = window.localStorage.getItem(brandKitKey(userId));
    if (!raw) return defaultBrandKit;
    return { ...defaultBrandKit, ...(JSON.parse(raw) as Partial<BrandKit>) };
  } catch {
    return defaultBrandKit;
  }
}

export function writeBrandKit(userId: string, kit: BrandKit) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(brandKitKey(userId), JSON.stringify(kit));
  window.dispatchEvent(new CustomEvent("brandkit:change"));
}

export function useBrandKit(): [BrandKit, (next: BrandKit) => void] {
  const [userId, setUserId] = useState<string | null>(null);
  const [kit, setKit] = useState<BrandKit>(defaultBrandKit);

  // Track which account is signed in so reads/writes always land in that
  // account's own bucket — resolved async, so state starts at defaults.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      const id = session?.user?.id ?? null;
      setUserId(id);
      setKit(id ? readBrandKit(id) : defaultBrandKit);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? null;
      setUserId(id);
      setKit(id ? readBrandKit(id) : defaultBrandKit);
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