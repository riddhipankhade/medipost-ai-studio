/**
 * src/lib/api/voucher.functions.ts
 * Voucher/discount system — validation (user-facing) + CRUD (admin-only)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";

// ── Supabase client (respects RLS via user session) ───────────────────────────
function getSupabase() {
  const cookieHeader = getRequestHeader("cookie") ?? "";
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(cookieHeader)
            .filter((c) => c.value !== undefined)
            .map((c) => ({ name: c.name, value: c.value as string }));
        },
        setAll() {},
      },
    }
  );
}

// ── Supabase admin client (bypasses RLS — for admin write operations) ─────────
function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. validateVoucher — called when user applies a code on subscription page
// ─────────────────────────────────────────────────────────────────────────────
export const validateVoucher = createServerFn({ method: "POST" })
  .validator(z.object({ code: z.string() }))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { data: voucher } = await supabase
      .from("vouchers")
      .select("code, discount_percentage, applicable_plans, max_uses, used_count, expires_at")
      .eq("code", data.code.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (!voucher) throw new Error("Invalid voucher code.");

    if (voucher.expires_at && new Date(voucher.expires_at) < new Date())
      throw new Error("This voucher has expired.");

    if (voucher.max_uses !== null && voucher.used_count >= voucher.max_uses)
      throw new Error("Voucher usage limit has been reached.");

    return {
      code:               voucher.code as string,
      discountPercentage: Number(voucher.discount_percentage),
      applicablePlans:    voucher.applicable_plans as string[],
    };
  });

// ── Helper: assert caller is admin via profiles table ─────────────────────────
async function assertAdmin(supabase: ReturnType<typeof getSupabase>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (profile?.role !== "admin") throw new Error("Admin access required.");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. listVouchers — admin: list all vouchers (active + inactive)
// ─────────────────────────────────────────────────────────────────────────────
export const listVouchers = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");
    await assertAdmin(supabase, user.id);

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─────────────────────────────────────────────────────────────────────────────
// 3. createVoucher — admin: create a new discount code
// ─────────────────────────────────────────────────────────────────────────────
export const createVoucher = createServerFn({ method: "POST" })
  .validator(z.object({
    code:               z.string().min(3).max(20),
    discountPercentage: z.number().min(1).max(100),
    applicablePlans:    z.array(z.enum(["starter", "pro", "clinic"])).min(1),
    maxUses:            z.number().nullable(),
    expiresAt:          z.string().nullable(),
  }))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");
    await assertAdmin(supabase, user.id);

    const admin = getSupabaseAdmin();
    const { error } = await admin.from("vouchers").insert({
      code:                data.code.trim().toUpperCase(),
      discount_percentage: data.discountPercentage,
      applicable_plans:    data.applicablePlans,
      max_uses:            data.maxUses,
      expires_at:          data.expiresAt || null,
      is_active:           true,
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// 4. toggleVoucher — admin: enable or disable a voucher
// ─────────────────────────────────────────────────────────────────────────────
export const toggleVoucher = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");
    await assertAdmin(supabase, user.id);

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("vouchers")
      .update({ is_active: data.isActive, updated_at: new Date().toISOString() })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// 5. deleteVoucher — admin: permanently delete a voucher
// ─────────────────────────────────────────────────────────────────────────────
export const deleteVoucher = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");
    await assertAdmin(supabase, user.id);

    const admin = getSupabaseAdmin();
    const { error } = await admin.from("vouchers").delete().eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });