import { useEffect, useState } from "react";

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

const KEY = "medipost.brandkit.v1";

export function readBrandKit(): BrandKit {
  if (typeof window === "undefined") return defaultBrandKit;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultBrandKit;
    return { ...defaultBrandKit, ...(JSON.parse(raw) as Partial<BrandKit>) };
  } catch {
    return defaultBrandKit;
  }
}

export function writeBrandKit(kit: BrandKit) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(kit));
  window.dispatchEvent(new CustomEvent("brandkit:change"));
}

export function useBrandKit(): [BrandKit, (next: BrandKit) => void] {
  const [kit, setKit] = useState<BrandKit>(defaultBrandKit);
  useEffect(() => {
    setKit(readBrandKit());
    const sync = () => setKit(readBrandKit());
    window.addEventListener("brandkit:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("brandkit:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const save = (next: BrandKit) => {
    setKit(next);
    writeBrandKit(next);
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