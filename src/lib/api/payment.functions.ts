/**
 * src/lib/api/payment.functions.ts
 * PayU Money integration — server functions for hash creation + payment verification
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getRequestHeader } from "@tanstack/react-start/server";

// ─────────────────────────────────────────────────────────────────────────────
// Supabase helper (same pattern as generate.functions.ts)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// 1. createPayUHash — generates txnid + SHA-512 hash for the checkout form
// ─────────────────────────────────────────────────────────────────────────────

// Server-side plan price table — client cannot override these
const PLAN_CATALOG: Record<string, { amount: string; productinfo: string }> = {
  payu_pro: { amount: "499.00", productinfo: "Medipost Pro Monthly" },
};

export const createPayUHash = createServerFn({ method: "POST" })
  .validator(z.object({
    planKey: z.string(),   // e.g. "payu_pro"
  }))
  .handler(async ({ data }) => {
    // Validate planKey against server-side catalog — client can never set the price
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

    // PayU hash: key|txnid|amount|productinfo|firstname|email|udf1–5||||||salt
    const hashString = `${key}|${txnid}|${plan.amount}|${plan.productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    return { key, txnid, amount: plan.amount, productinfo: plan.productinfo, firstname, email, phone, hash };
  });

// ─────────────────────────────────────────────────────────────────────────────
// 2. verifyPayUPayment — verifies response hash + activates Pro subscription
// ─────────────────────────────────────────────────────────────────────────────

const VerifySchema = z.object({
  planKey:      z.string(),               // "starter" | "pro" | "clinic"
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

    // PayU reverse hash: salt|status|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const reverseHashString = `${salt}|${data.status}|||||||||||${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${key}`;
    const expectedHash = crypto.createHash("sha512").update(reverseHashString).digest("hex");

    if (expectedHash !== data.hash) {
      throw new Error("Payment verification failed — hash mismatch. Do not activate.");
    }
    if (data.status !== "success") {
      throw new Error(`Payment ${data.status}. No subscription activated.`);
    }

    // Look up the plan_id by planKey name from the plans table
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
      .upsert({
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
      { onConflict: "user_id" });

    if (upsertError) throw new Error(`Subscription update failed: ${upsertError.message}`);

    return { success: true, expiresAt: expiresAt.toISOString() };
  });

// Note: subscription reading is handled client-side via useSubscription hook
// in src/lib/use-subscription.ts — no server fn needed here.