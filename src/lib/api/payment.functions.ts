/**
 * src/lib/api/payment.functions.ts
 * PayU Money integration — hash creation + payment verification (with voucher support)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getRequestHeader } from "@tanstack/react-start/server";

// ── Supabase helper ───────────────────────────────────────────────────────────
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

// ── Server-side plan catalog — client can never override these prices ─────────
const PLAN_CATALOG: Record<string, { amount: string; productinfo: string }> = {
  starter: { amount: "499.00",  productinfo: "Medipost Starter Plan" },
  pro:     { amount: "1999.00", productinfo: "Medipost Pro Plan" },
  clinic:  { amount: "6999.00", productinfo: "Medipost Clinic Plan" },
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. createPayUHash — generates txnid + SHA-512 hash for checkout
//    Optionally applies a voucher discount server-side
// ─────────────────────────────────────────────────────────────────────────────
export const createPayUHash = createServerFn({ method: "POST" })
  .validator(z.object({
    planKey:     z.string(),
    voucherCode: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const plan = PLAN_CATALOG[data.planKey];
    if (!plan) throw new Error("Invalid plan selected.");

    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized. Please sign in.");

    const key       = process.env.PAYU_MERCHANT_KEY!;
    const salt      = process.env.PAYU_SALT!;
    const txnid     = `mp_${user.id.replace(/-/g, "").slice(0, 10)}_${Date.now()}`;
    const firstname = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0]
                      ?? user.email?.split("@")[0]
                      ?? "User";
    const email     = user.email!;
    const phone     = (user.user_metadata?.phone as string | undefined) ?? "9999999999";

    // Apply voucher discount server-side if a code is provided
    let finalAmount = plan.amount;

    if (data.voucherCode) {
      const { data: voucher } = await supabase
        .from("vouchers")
        .select("discount_percentage, applicable_plans, max_uses, used_count, expires_at")
        .eq("code", data.voucherCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (
        voucher &&
        voucher.applicable_plans.includes(data.planKey) &&
        !(voucher.expires_at && new Date(voucher.expires_at) < new Date()) &&
        !(voucher.max_uses !== null && voucher.used_count >= voucher.max_uses)
      ) {
        const discount = Number(plan.amount) * (Number(voucher.discount_percentage) / 100);
        finalAmount = Math.max(1, Number(plan.amount) - discount).toFixed(2);
      }
    }

    // PayU hash: key|txnid|amount|productinfo|firstname|email|udf1–5||||||salt
    const hashString = `${key}|${txnid}|${finalAmount}|${plan.productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    return { key, txnid, amount: finalAmount, productinfo: plan.productinfo, firstname, email, phone, hash };
  });

// ─────────────────────────────────────────────────────────────────────────────
// 2. verifyPayUPayment — verifies response hash + activates subscription
//    Also increments voucher used_count after successful payment
// ─────────────────────────────────────────────────────────────────────────────
const VerifySchema = z.object({
  planKey:      z.string(),
  voucherCode:  z.string().optional(),
  txnid:        z.string(),
  status:       z.string(),
  amount:       z.string(),
  productinfo:  z.string(),
  firstname:    z.string(),
  email:        z.string(),
  mihpayid:     z.string().optional().default(""),
  hash:         z.string(),
});

export const verifyPayUPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => VerifySchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized. Please sign in.");

    const salt = process.env.PAYU_SALT!;
    const key  = process.env.PAYU_MERCHANT_KEY!;

    // Verify PayU reverse hash
    const reverseHashString = `${salt}|${data.status}|||||||||||${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${key}`;
    const expectedHash = crypto.createHash("sha512").update(reverseHashString).digest("hex");

    if (expectedHash !== data.hash)
      throw new Error("Payment verification failed — hash mismatch. Do not activate.");
    if (data.status !== "success")
      throw new Error(`Payment ${data.status}. No subscription activated.`);

    // Look up plan_id
    const { data: planRow } = await supabase
      .from("plans")
      .select("id")
      .eq("name", data.planKey)
      .single();

    if (!planRow) throw new Error(`Plan "${data.planKey}" not found. Contact support.`);

    // Activate for 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id:              user.id,
          plan_id:              planRow.id,
          plan:                 "pro",
          status:               "active",
          plan_expires_at:      expiresAt.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end:   expiresAt.toISOString(),
          payu_txn_id:          data.txnid,
          payu_payment_id:      data.mihpayid,
          updated_at:           new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) throw new Error(`Subscription update failed: ${upsertError.message}`);

    // Increment voucher used_count if a voucher was applied
    if (data.voucherCode) {
      const { data: v } = await supabase
        .from("vouchers")
        .select("id, used_count")
        .eq("code", data.voucherCode.trim().toUpperCase())
        .single();

      if (v) {
        await supabase
          .from("vouchers")
          .update({ used_count: v.used_count + 1, updated_at: new Date().toISOString() })
          .eq("id", v.id);
      }
    }

    return { success: true, expiresAt: expiresAt.toISOString() };
  });