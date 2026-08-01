/**
 * src/routes/api/cron/renew-subscriptions.ts
 *
 * Vercel calls this endpoint daily at 06:00 IST (00:30 UTC). Two phases:
 *
 *  1. Renewals — every subscription whose next_billing_date is due today or
 *     overdue gets a PayU SI auto-debit fired. PayU confirms the result
 *     asynchronously via /api/payu-webhook.
 *  2. Downgrades — every subscription that's stopped auto-renewing (cancelled,
 *     or never had SI set up) and whose plan_expires_at has passed gets moved
 *     to the free plan.
 *
 * Vercel automatically sends the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 * Add CRON_SECRET to your Vercel environment variables.
 */

import { defineEventHandler, getHeader, createError } from "h3";
import { createClient } from "@supabase/supabase-js";
import { debitUserSI, downgradeToFreePlan } from "@/lib/api/payment.functions";

export default defineEventHandler(async (event) => {
  // Guard: only Vercel's cron runner (or your own calls with the secret) can trigger this
  const auth = getHeader(event, "authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const now = new Date().toISOString();

  // ── Phase 1: renewals ────────────────────────────────────────────────────
  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("auto_renew", true)
    .not("payu_subid", "is", null)
    .lte("next_billing_date", now);

  if (error) {
    console.error("[cron/renew] DB error:", error.message);
    throw createError({ statusCode: 500, message: error.message });
  }

  let renewalSummary: unknown[] = [];
  if (subs?.length) {
    // Fire debits in parallel (PayU confirms async via webhook)
    const results = await Promise.allSettled(
      subs.map((sub) => debitUserSI(sub.user_id))
    );

    renewalSummary = results.map((r, i) => ({
      userId:  subs[i].user_id,
      success: r.status === "fulfilled" ? r.value.success : false,
      error:   r.status === "rejected"
                 ? String(r.reason?.message)
                 : r.value.error,
    }));

    console.log("[cron/renew] renewals processed:", renewalSummary);
  }

  // ── Phase 2: downgrade lapsed, non-renewing subscriptions to free ───────
  const { data: expired, error: expiredError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("auto_renew", false)
    .not("plan", "is", null)
    .neq("plan", "starter")
    .lte("plan_expires_at", now);

  if (expiredError) {
    console.error("[cron/renew] downgrade query error:", expiredError.message);
  }

  let downgradeSummary: unknown[] = [];
  if (expired?.length) {
    const results = await Promise.allSettled(
      expired.map((sub) => downgradeToFreePlan(sub.user_id))
    );

    downgradeSummary = results.map((r, i) => ({
      userId:  expired[i].user_id,
      success: r.status === "fulfilled" ? r.value.success : false,
      error:   r.status === "rejected"
                 ? String(r.reason?.message)
                 : r.value.error,
    }));

    console.log("[cron/renew] downgrades processed:", downgradeSummary);
  }

  return {
    renewed:    subs?.length ?? 0,
    downgraded: expired?.length ?? 0,
    renewalSummary,
    downgradeSummary,
  };
});