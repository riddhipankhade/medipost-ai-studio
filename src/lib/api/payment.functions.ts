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
// Starter is free — no payment entry needed.
const PLAN_CATALOG: Record<string, { amount: string; productinfo: string }> = {
  growth:     { amount: "499.00",  productinfo: "Medipost Growth Plan"     },
  pro_clinic: { amount: "999.00",  productinfo: "Medipost Pro Clinic Plan" },
};

// ── Growth plan trial — ₹1 for 7 days, then auto-debits the real ₹499 price.
// One-time only per user, tracked via subscriptions.trial_used_at.
const TRIAL_PLAN_KEY  = "growth";
const TRIAL_PRICE     = "1.00";
const TRIAL_DAYS      = 7;

// ─────────────────────────────────────────────────────────────────────────────
// 1. createPayUHash — generates txnid + SHA-512 hash for checkout.
// ─────────────────────────────────────────────────────────────────────────────
export const createPayUHash = createServerFn({ method: "POST" })
  .validator(z.object({
    planKey:     z.string(),
    voucherCode: z.string().optional(),
    startTrial:  z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    const plan = PLAN_CATALOG[data.planKey];
    if (!plan) throw new Error("Invalid plan selected.");

    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized. Please sign in.");

    // Trial is only ever honored for Growth, and only once per user — re-verified
    // server-side so a tampered client request can never grant a second trial.
    let isTrial = false;
    if (data.startTrial && data.planKey === TRIAL_PLAN_KEY) {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("trial_used_at")
        .eq("user_id", user.id)
        .single();
      isTrial = !existingSub?.trial_used_at;
    }

    const key       = process.env.PAYU_MERCHANT_KEY!;
    const salt      = process.env.PAYU_SALT!;
    const txnid     = `mp_${user.id.replace(/-/g, "").slice(0, 10)}_${Date.now()}`;
    const firstname = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0]
                      ?? user.email?.split("@")[0]
                      ?? "User";
    const email     = user.email!;
    const phone     = (user.user_metadata?.phone as string | undefined) ?? "9999999999";

    // Apply voucher discount server-side — trials are already ₹1, vouchers don't stack.
    let finalAmount = plan.amount;

    if (isTrial) {
      finalAmount = TRIAL_PRICE;
    } else if (data.voucherCode) {
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

    const productinfo = isTrial ? `${plan.productinfo} — 7-Day Trial` : plan.productinfo;

    const hashString = `${key}|${txnid}|${finalAmount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // billingAmount is what the bank authorizes for future auto-debits — always the
    // real plan price, even on a ₹1 trial checkout, so the ₹499 renewal is covered.
    const si_details = JSON.stringify({
      billingAmount:   plan.amount,
      billingInterval: 1,
      paymentCount:    0,
      billingCycle:    "MONTHLY",
      billingCurrency: "INR",
      remarks:         plan.productinfo,
    });

    return {
      key, txnid, amount: finalAmount, productinfo,
      firstname, email, phone, hash,
      si:         "1",
      si_details,
      isTrial,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// 2. verifyPayUPayment — verifies response hash + activates subscription.
// ─────────────────────────────────────────────────────────────────────────────
const VerifySchema = z.object({
  planKey:      z.string(),
  voucherCode:  z.string().optional(),
  startTrial:   z.boolean().optional(),
  txnid:        z.string(),
  status:       z.string(),
  amount:       z.string(),
  productinfo:  z.string(),
  firstname:    z.string(),
  email:        z.string(),
  mihpayid:     z.string().optional().default(""),
  hash:         z.string(),
  subId:        z.string().optional(),
});

export const verifyPayUPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => VerifySchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized. Please sign in.");

    const salt = process.env.PAYU_SALT!;
    const key  = process.env.PAYU_MERCHANT_KEY!;

    const reverseHashString = `${salt}|${data.status}|||||||||||${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${key}`;
    const expectedHash = crypto.createHash("sha512").update(reverseHashString).digest("hex");

    if (expectedHash !== data.hash)
      throw new Error("Payment verification failed — hash mismatch. Do not activate.");
    if (data.status !== "success")
      throw new Error(`Payment ${data.status}. No subscription activated.`);

    // Idempotency guard: this endpoint's only proof-of-payment is a hash the
    // client also holds (necessarily — it's echoed back from PayU/Bolt in the
    // browser). That hash stays valid forever, so without this check anyone
    // could replay their own captured verify payload directly (devtools/curl,
    // no forgery needed) to re-run the upsert below and extend plan_expires_at
    // by another full period each time, for free, with no new PayU charge.
    // If this exact transaction has already been recorded, short-circuit.
    const { data: alreadyProcessed } = await supabase
      .from("subscriptions")
      .select("plan_expires_at, auto_renew")
      .eq("user_id", user.id)
      .eq("payu_txn_id", data.txnid)
      .maybeSingle();

    if (alreadyProcessed) {
      return {
        success:         true,
        expiresAt:       alreadyProcessed.plan_expires_at,
        autoRenew:       alreadyProcessed.auto_renew,
        alreadyProcessed: true,
      };
    }

    const { data: planRow } = await supabase
      .from("plans")
      .select("id")
      .eq("name", data.planKey)
      .single();

    if (!planRow) throw new Error(`Plan "${data.planKey}" not found. Contact support.`);

    // Re-verify trial eligibility server-side — never trust the client flag alone.
    const isTrial = !!data.startTrial && data.planKey === TRIAL_PLAN_KEY;

    if (isTrial) {
      // Atomic claim: UPDATE ... WHERE trial_used_at IS NULL closes the race where
      // two concurrent verify calls (e.g. a double-submit) could both pass a plain
      // read-then-write eligibility check before either write commits. Postgres
      // row-locks during the UPDATE, so only one concurrent caller can win this.
      const { data: claimed, error: claimError } = await supabase
        .from("subscriptions")
        .update({ trial_used_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("trial_used_at", null)
        .select("user_id");

      if (claimError) throw new Error(`Trial claim failed: ${claimError.message}`);

      if (!claimed?.length) {
        // 0 rows affected means either no subscriptions row exists yet (fine — the
        // upsert below creates one) or another request already claimed the trial.
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("trial_used_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (existingSub?.trial_used_at)
          throw new Error(
            "Trial already used. If you were charged ₹1 just now, contact support — it will be refunded."
          );
      }
    }

    const periodDays = isTrial ? TRIAL_DAYS : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + periodDays);

    // Full-price renewals fire the debit one day early as a processing buffer.
    // The trial is sold as "₹1 for 7 days, then ₹499" — billing it on day 6 would
    // contradict that, so it debits exactly on day 7 instead of a day early.
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + (isTrial ? periodDays : periodDays - 1));

    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id:              user.id,
          plan_id:              planRow.id,
          plan:                 data.planKey,   // ← uses actual plan key, not hardcoded "pro"
          status:               isTrial ? "trialing" : "active",
          plan_expires_at:      expiresAt.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end:   expiresAt.toISOString(),
          payu_txn_id:          data.txnid,
          payu_payment_id:      data.mihpayid,
          payu_subid:           data.subId ?? null,
          auto_renew:           !!data.subId,
          next_billing_date:    data.subId ? nextBillingDate.toISOString() : null,
          trial_used_at:        isTrial ? new Date().toISOString() : undefined,
          // A fresh, successful purchase always represents a clean, non-cancelled
          // subscription — clear any canceled_at left over from a prior cancel.
          // Without this, a user who cancels once and later re-subscribes would
          // have canceled_at stuck non-null forever: the Subscription page's
          // canCancel check (isCancelled = !!canceled_at, no expiry check) would
          // permanently hide the Cancel button, and the Dashboard would keep
          // showing "Cancelling" on an actively auto-renewing subscription.
          canceled_at:          null,
          updated_at:           new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) throw new Error(`Subscription update failed: ${upsertError.message}`);

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
// ─────────────────────────────────────────────────────────────────────────────
export async function debitUserSI(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();

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

  // Atomic pre-claim: push next_billing_date forward by 1 day BEFORE calling
  // PayU. next_billing_date is otherwise only advanced by the webhook on
  // confirmed success — so without this, the cron re-selects this same row
  // every single day the webhook hasn't confirmed yet (common: any webhook
  // delay, deploy hiccup, or the PayU callback simply arriving late), firing
  // a second real si_create_auto_debit call for the same billing cycle. It
  // also closes the same gap if the cron endpoint is ever invoked twice
  // concurrently (retry, overlapping trigger). On success the webhook
  // overwrites this with the real +29-day date; on failure/no-webhook, this
  // caps retries to once per day instead of unlimited same-day re-attempts.
  const claimBefore = new Date().toISOString();
  const retryAt      = new Date();
  retryAt.setDate(retryAt.getDate() + 1);

  const { data: claimed } = await supabase
    .from("subscriptions")
    .update({ next_billing_date: retryAt.toISOString() })
    .eq("user_id", userId)
    .eq("auto_renew", true)
    .lte("next_billing_date", claimBefore)
    .select("user_id");

  if (!claimed?.length) {
    return { success: false, error: "Debit already claimed by a concurrent run." };
  }

  const key     = process.env.PAYU_MERCHANT_KEY!;
  const salt    = process.env.PAYU_SALT!;
  const command = "si_create_auto_debit";
  const txnid   = `si_${userId.replace(/-/g, "").slice(0, 10)}_${Date.now()}`;
  const appUrl  = process.env.VITE_APP_URL ?? process.env.APP_URL ?? "";

  const var1 = JSON.stringify({
    merchantKey:    key,
    subscriptionId: sub.payu_subid,
    requestId:      txnid,
    amount:         planInfo.amount,
    remarks:        `Monthly renewal — ${planInfo.productinfo}`,
    notifyUrl:      `${appUrl}/api/payu-webhook`,
  });

  const hashString = `${key}|${command}|${var1}|${salt}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  try {
    const res = await fetch("https://info.payu.in/merchant/postservice.php?form=2", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({ key, command, var1, hash }).toString(),
    });

    const result = await res.json() as Record<string, unknown>;

    if (String(result.status) === "0") {
      return { success: false, error: String(result.msg ?? "Debit initiation failed") };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Network error calling PayU SI API" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. activateSubscriptionFromWebhook — called by /api/payu-webhook on SI debit.
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

  const reverseHash = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const expected    = crypto.createHash("sha512").update(reverseHash).digest("hex");

  if (expected !== hash) throw new Error("Webhook hash mismatch — ignoring.");
  if (status !== "success") return;

  const supabase = getSupabaseAdmin();

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find((u) => u.email === email);
  if (!user) throw new Error(`No user found for email: ${email}`);

  // Guard against the race where a user cancels after the cron already fired
  // this debit but before PayU's async confirmation lands here — without this,
  // a cancelled subscription would get silently re-extended by 30 days.
  const { data: currentSub } = await supabase
    .from("subscriptions")
    .select("auto_renew")
    .eq("user_id", user.id)
    .single();

  if (!currentSub?.auto_renew) {
    console.error(
      `[payu-webhook] Debit succeeded for user ${user.id} (txn ${txnid}) after they cancelled — ` +
      `not re-extending access. This charge may need a manual refund.`
    );
    return;
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// 5. revokePayUMandate — cancels the SI mandate at PayU/bank level so no future
//    debit can be initiated against it, even in principle.
// ─────────────────────────────────────────────────────────────────────────────
async function revokePayUMandate(payuSubId: string): Promise<{ success: boolean; error?: string }> {
  const key     = process.env.PAYU_MERCHANT_KEY!;
  const salt    = process.env.PAYU_SALT!;
  const command = "mandate_revoke";
  const requestId = `cxl_${payuSubId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}_${Date.now()}`;

  const var1 = JSON.stringify({ authpayuid: payuSubId, requestId });

  const hashString = `${key}|${command}|${var1}|${salt}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  try {
    const res = await fetch("https://info.payu.in/merchant/postservice.php?form=2", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({ key, command, var1, hash }).toString(),
    });

    const result = await res.json() as Record<string, unknown>;

    if (String(result.status) !== "1") {
      return { success: false, error: String(result.message ?? "Mandate revoke failed") };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Network error calling PayU mandate_revoke" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. cancelSubscription — self-service cancellation. Stops future billing
//    immediately; current-period access is left untouched (see plan_expires_at).
//
//    Deliberately does NOT touch `status` — status stays "active"/"trialing"
//    through the grace period, since the user still has full paid access.
//    "Will not renew" is represented entirely by auto_renew=false + canceled_at;
//    only the downgrade cron (once plan_expires_at passes) changes status.
//    Uses getSupabase() (RLS-bound, owner-scoped), matching every other
//    createServerFn handler in this file that's called directly from an
//    authenticated client request — see the getSupabaseAdmin() comment above
//    for why cron/webhook-only functions use the admin client instead.
// ─────────────────────────────────────────────────────────────────────────────
export const cancelSubscription = createServerFn({ method: "POST" })
  .handler(async () => {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized. Please sign in.");

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("auto_renew, canceled_at, plan_expires_at")
      .eq("user_id", user.id)
      .single();

    if (!sub) throw new Error("No subscription found.");

    // Already cancelled (from an earlier request) — report the same graceful
    // outcome rather than erroring on a harmless re-submit.
    if (sub.canceled_at) {
      return { success: true, accessUntil: sub.plan_expires_at, alreadyCancelled: true };
    }

    if (!sub.auto_renew) throw new Error("Auto-renewal isn't active on this subscription — nothing to cancel.");

    // Atomic claim: UPDATE ... WHERE canceled_at IS NULL. Mirrors the
    // trial_used_at claim above — closes the race where two concurrent
    // requests (double-click, double tab, refresh-and-retry) could both pass
    // the plain read-then-write check above before either write commits.
    // Only the request that actually flips the row gets a non-empty result,
    // so revokePayUMandate below can only ever run once per cancellation.
    const { data: claimed, error: claimError } = await supabase
      .from("subscriptions")
      .update({
        auto_renew:        false,
        canceled_at:        new Date().toISOString(),
        next_billing_date:  null,
        updated_at:          new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .is("canceled_at", null)
      .select("payu_subid, plan_expires_at");

    if (claimError) throw new Error(`Cancellation failed: ${claimError.message}`);

    if (!claimed?.length) {
      // Lost the race to a concurrent request — that request already handles
      // the mandate revoke. Same graceful outcome, no duplicate PayU call.
      return { success: true, accessUntil: sub.plan_expires_at, alreadyCancelled: true };
    }

    const won = claimed[0];

    // Best-effort: also revoke the mandate at PayU/bank level. Failure here is
    // logged, not thrown — auto_renew=false above already fully stops billing
    // through our own cron, so the user-visible cancellation still succeeds.
    if (won.payu_subid) {
      const revoke = await revokePayUMandate(won.payu_subid);
      if (!revoke.success) {
        console.error(
          `[cancelSubscription] PayU mandate_revoke failed for user ${user.id}: ${revoke.error}`
        );
      }
    }

    return { success: true, accessUntil: won.plan_expires_at };
  });

// ─────────────────────────────────────────────────────────────────────────────
// 7. downgradeToFreePlan — moves a lapsed, non-renewing subscription to the free
//    plan. Called by the daily cron for rows past plan_expires_at with
//    auto_renew = false (cancelled, or never had SI set up).
// ─────────────────────────────────────────────────────────────────────────────
export async function downgradeToFreePlan(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();

  // The checked-in signup trigger (20240001000004_create_subscriptions.sql)
  // looks up plans.name = 'free', but the *live* trigger was patched out-of-band
  // and now hardcodes plan_id directly (verified via `supabase db query --linked`
  // against pg_proc — no 'free' row exists in the live plans table at all; the
  // live catalog is trial/starter/pro/clinic/growth/pro_clinic, and new signups
  // get the 'trial' row). Downgrade needs to land a lapsed user on the exact
  // same plan a brand-new signup gets, so it matches the live trigger's actual
  // target rather than the stale migration text.
  const { data: freePlan } = await supabase
    .from("plans")
    .select("id")
    .eq("name", "trial")
    .maybeSingle();

  if (!freePlan) return { success: false, error: "Default free-tier plan row not found — skipping downgrade." };

  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan:              "starter",
      plan_id:           freePlan.id,
      status:            "active",
      plan_expires_at:   null,
      payu_subid:        null,
      auto_renew:        false,
      next_billing_date: null,
      updated_at:        new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}