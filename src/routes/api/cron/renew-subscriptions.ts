
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

  // ── Phase 3: downgrade lapsed auto-renew subs where payment keeps failing ─
  // auto_renew=true but plan_expires_at passed 3+ days ago means PayU kept
  // rejecting the debit and the webhook never confirmed success.
  const graceCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: lapsed, error: lapsedError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("auto_renew", true)
    .neq("plan", "starter")
    .not("plan_expires_at", "is", null)
    .lte("plan_expires_at", graceCutoff);

  if (lapsedError) {
    console.error("[cron/renew] lapsed query error:", lapsedError.message);
  }

  let lapsedSummary: unknown[] = [];
  if (lapsed?.length) {
    const results = await Promise.allSettled(
      lapsed.map((sub) => downgradeToFreePlan(sub.user_id))
    );

    lapsedSummary = results.map((r, i) => ({
      userId:  lapsed[i].user_id,
      success: r.status === "fulfilled" ? r.value.success : false,
      error:   r.status === "rejected"
                 ? String(r.reason?.message)
                 : r.value.error,
    }));

    console.log("[cron/renew] lapsed auto-renew downgrades:", lapsedSummary);
  }


  // ── Phase 4: renewal reminder emails (7 days out and 1 day out) ────────────
  let reminderSummary: unknown[] = [];
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend    = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@medipost.ai";

    const sendReminders = async (daysAhead: number) => {
      const lo = new Date(Date.now() + (daysAhead - 0.5) * 86_400_000).toISOString();
      const hi = new Date(Date.now() + (daysAhead + 0.5) * 86_400_000).toISOString();

      const { data: remSubs } = await supabase
        .from("subscriptions")
        .select("user_id, plan, next_billing_date")
        .neq("plan", "starter")
        .eq("auto_renew", true)
        .not("payu_subid", "is", null)
        .gte("next_billing_date", lo)
        .lte("next_billing_date", hi);

      if (!remSubs?.length) return [];

      return Promise.allSettled(
        remSubs.map(async (sub) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(sub.user_id);
          if (!user?.email) return;
          const planLabel = sub.plan === "growth" ? "Growth"
                          : sub.plan === "pro"    ? "Pro"
                          : String(sub.plan);
          const renewDate = new Date(sub.next_billing_date).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
          });
          const when = daysAhead === 7 ? "in 7 days" : "tomorrow";
          await resend.emails.send({
            from:    fromEmail,
            to:      user.email,
            subject: `Your Medipost AI ${planLabel} plan renews ${when}`,
            html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
  <div style="background:#007594;border-radius:8px 8px 0 0;padding:20px 24px;">
    <h1 style="margin:0;color:#fff;font-size:20px;">Medipost AI</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px;">
    <p style="margin:0 0 16px;font-size:15px;">Hi there,</p>
    <p style="margin:0 0 16px;font-size:15px;">
      Your <strong>${planLabel} plan</strong> subscription will automatically renew
      <strong>${when}</strong> on <strong>${renewDate}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:15px;">
      No action needed — payment will be charged via your saved payment method.
      To cancel auto-renewal, visit your
      <a href="https://medipost.ai/subscription" style="color:#007594;">subscription settings</a>.
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
    <p style="font-size:12px;color:#9ca3af;margin:0;">
      Medipost AI &middot; You're receiving this because you have an active subscription.
    </p>
  </div>
</div>`,
          });
        })
      );
    };

    const [r7, r1] = await Promise.all([sendReminders(7), sendReminders(1)]);
    reminderSummary = [
      { daysAhead: 7, count: r7?.length ?? 0 },
      { daysAhead: 1, count: r1?.length ?? 0 },
    ];
    console.log("[cron/renew] reminder emails sent:", reminderSummary);
  }

  return {
    renewed:    subs?.length ?? 0,
    downgraded: expired?.length ?? 0,
    lapsed:     lapsed?.length ?? 0,
    renewalSummary,
    downgradeSummary,
    lapsedSummary,
    reminderSummary,
  };
});