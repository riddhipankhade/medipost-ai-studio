import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type DbBrandKit = {
  id: string;
  user_id: string;
  clinic_name: string | null;
  doctor_name: string | null;
  specialty: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  brand_colors: { primary: string; secondary: string; accent: string };
};

export function useDbBrandKit(userId: string | undefined) {
  return useQuery({
    queryKey: ["brand-kit", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<DbBrandKit | null> => {
      const { data, error } = await supabase
        .from("brand_kits")
        .select("id, user_id, clinic_name, doctor_name, specialty, phone, website, address, brand_colors")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

type SavePayload = {
  clinic_name: string;
  doctor_name: string;
  specialty: string;
  phone: string;
  website: string;
  address: string;
  brand_colors: { primary: string; secondary: string; accent: string };
};

export function useSaveBrandKit(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SavePayload) => {
      const { error } = await supabase
        .from("brand_kits")
        .upsert({ user_id: userId!, ...payload }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-kit", userId] });
    },
  });
}
