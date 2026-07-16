import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";

// ── Supabase helpers ──────────────────────────────────────────────────────────

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

// Admin client — uses service role key, bypasses RLS.
// Only used server-side in cron/webhook handlers — never exposed to client.
function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ── Server-side plan catalog — client can never override these prices ─────────
const PLAN_CATALOG: Record<string, { amount: string; productinfo: string }> = {
  starter: { amount: "499.00",  productinfo: "Medipost Starter Plan" },
  pro:     { amount: "1999.00", productinfo: "Medipost Pro Plan" },
  clinic:  { amount: "6999.00", productinfo: "Medipost Clinic Plan" },
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. createPayUHash — generates txnid + SHA-512 hash for checkout.
//    Now also returns si / si_details so bolt.launch() can register a Standing
//    Instruction (autopay mandate) on the very first payment.
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

    // Apply voucher discount server-side
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

    // Hash formula unchanged — SI params do not affect it for Bolt
    const hashString = `${key}|${txnid}|${finalAmount}|${plan.productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // si_details tells PayU to register a recurring mandate during this payment.
    // Pass si + si_details directly into bolt.launch() alongside the other params.
    const si_details = JSON.stringify({
      billingAmount:   finalAmount,
      billingInterval: 1,
      paymentCount:    0,          // 0 = unlimited renewals
      billingCycle:    "MONTHLY",
      billingCurrency: "INR",
      remarks:         plan.productinfo,
    });

    return {
      key, txnid, amount: finalAmount, productinfo: plan.productinfo,
      firstname, email, phone, hash,
      si:         "1",   // ← enables Standing Instruction registration
      si_details,        // ← billing schedule
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// 2. verifyPayUPayment — verifies response hash + activates subscription.
//    Now stores the SI sub_id returned by PayU so the cron can auto-debit.
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
  subId:        z.string().optional(), // ← NEW: PayU SI subscription ID from bolt response
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

    const { data: planRow } = await supabase
      .from("plans")
      .select("id")
      .eq("name", data.planKey)
      .single();

    if (!planRow) throw new Error(`Plan "${data.planKey}" not found. Contact support.`);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Fire the next debit 1 day before expiry to avoid any access gap
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 29);

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
          // Autopay fields (columns added via ALTER TABLE)
          payu_subid:           data.subId ?? null,
          auto_renew:           !!data.subId,
          next_billing_date:    data.subId ? nextBillingDate.toISOString() : null,
          updated_at:           new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) throw new Error(`Subscription update failed: ${upsertError.message}`);

    // Increment voucher used_count on successful payment
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

    return {
      success:   true,
      expiresAt: expiresAt.toISOString(),
      autoRenew: !!data.subId,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// 3. debitUserSI — triggers PayU SI auto-debit for one user.
//    Called by the daily cron job — NOT a server function, never called from client.
//
//    ⚠️  Confirm the command name "si_create_auto_debit" with PayU support
//    for your merchant account before going live — it can vary by account type.
// ─────────────────────────────────────────────────────────────────────────────
export async function debitUserSI(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();

  // Fetch subscription and join plans table to get the plan name (matches PLAN_CATALOG key)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("payu_subid, plan_info:plans(name)")
    .eq("user_id", userId)
    .eq("auto_renew", true)
    .single();

  if (!sub?.payu_subid) return { success: false, error: "No active SI subscription." };

  const planKey  = (sub.plan_info as any)?.name as string | undefined;
  const planInfo = planKey ? PLAN_CATALOG[planKey] : undefined;
  if (!planInfo)  return { success: false, error: `Unknown plan: ${planKey}` };

  const key    = process.env.PAYU_MERCHANT_KEY!;
  const salt   = process.env.PAYU_SALT!;
  const command = "si_create_auto_debit";
  const txnid  = `si_${userId.replace(/-/g, "").slice(0, 10)}_${Date.now()}`;
  const appUrl = process.env.VITE_APP_URL ?? process.env.APP_URL ?? "";

  const var1 = JSON.stringify({
    merchantKey:    key,
    subscriptionId: sub.payu_subid,
    requestId:      txnid,
    amount:         planInfo.amount,
    remarks:        `Monthly renewal — ${planInfo.productinfo}`,
    notifyUrl:      `${appUrl}/api/payu-webhook`,
  });

  // Hash formula for SI debit: sha512(key|command|var1|salt)
  const hashString = `${key}|${command}|${var1}|${salt}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  try {
    const res = await fetch("https://info.payu.in/merchant/postservice.php?form=2", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({ key, command, var1, hash }).toString(),
    });

    const result = await res.json() as Record<string, unknown>;

    // PayU returns status "0" on failure
    if (String(result.status) === "0") {
      return { success: false, error: String(result.msg ?? "Debit initiation failed") };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Network error calling PayU SI API" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. activateSubscriptionFromWebhook — called by /api/payu-webhook when PayU
//    confirms a successful SI debit. Extends the subscription another 30 days.
// ─────────────────────────────────────────────────────────────────────────────
export async function activateSubscriptionFromWebhook(params: {
  txnid:       string;
  status:      string;
  amount:      string;
  email:       string;
  firstname:   string;
  productinfo: string;
  mihpayid:    string;
  hash:        string;
}): Promise<void> {
  const { txnid, status, amount, email, firstname, productinfo, mihpayid, hash } = params;

  const salt = process.env.PAYU_SALT!;
  const key  = process.env.PAYU_MERCHANT_KEY!;

  // Verify webhook hash using the same reverse formula
  const reverseHash = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const expected    = crypto.createHash("sha512").update(reverseHash).digest("hex");

  if (expected !== hash) throw new Error("Webhook hash mismatch — ignoring.");
  if (status !== "success") return; // failed/cancelled debit — do nothing, keep current subscription active

  const supabase = getSupabaseAdmin();

  // Resolve user by email via admin API
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find((u) => u.email === email);
  if (!user) throw new Error(`No user found for email: ${email}`);

  const expiresAt       = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 29);

  await supabase
    .from("subscriptions")
    .update({
      status:               "active",
      plan_expires_at:      expiresAt.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end:   expiresAt.toISOString(),
      payu_txn_id:          txnid,
      payu_payment_id:      mihpayid,
      next_billing_date:    nextBillingDate.toISOString(),
      updated_at:           new Date().toISOString(),
    })
    .eq("user_id", user.id);
}