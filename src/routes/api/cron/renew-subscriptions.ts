/**
 * src/routes/api/cron/renew-subscriptions.ts
 *
 * Vercel calls this endpoint daily at 06:00 IST (00:30 UTC).
 * It finds every subscription whose next_billing_date is due today or overdue,
 * then fires a PayU SI auto-debit for each one.
 * PayU confirms the result asynchronously via /api/payu-webhook.
 *
 * Vercel automatically sends the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 * Add CRON_SECRET to your Vercel environment variables.
 */

import { defineEventHandler, getHeader, createError } from "h3";
import { createClient } from "@supabase/supabase-js";
import { debitUserSI } from "@/lib/api/payment.functions";

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

  if (!subs?.length) {
    return { processed: 0, message: "No renewals due." };
  }

  // Fire debits in parallel (PayU confirms async via webhook)
  const results = await Promise.allSettled(
    subs.map((sub) => debitUserSI(sub.user_id))
  );

  const summary = results.map((r, i) => ({
    userId:  subs[i].user_id,
    success: r.status === "fulfilled" ? r.value.success : false,
    error:   r.status === "rejected"
               ? String(r.reason?.message)
               : r.value.error,
  }));

  console.log("[cron/renew] processed:", summary);

  return { processed: subs.length, summary };
});