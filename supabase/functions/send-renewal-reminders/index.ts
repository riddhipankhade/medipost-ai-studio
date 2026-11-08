// supabase/functions/send-renewal-reminders/index.ts
//
// Emails a customer ONE DAY BEFORE money is taken from their account.
//
// Runs daily. Covers two cases, with different wording:
//   • trial converting  — "your ₹1 trial ends tomorrow, ₹499 will be charged"
//   • normal renewal    — "your subscription renews tomorrow, ₹499"
//
// Design notes (this replaces an earlier version that had real problems):
//   • Includes `trialing`, not just `active`. The old version filtered on
//     status = 'active' only, so every ₹1-trial customer — precisely the
//     people about to be charged ₹499 for the first time — got no warning.
//   • States the AMOUNT and the DATE. "Your subscription renews tomorrow"
//     without the number is not a usable warning.
//   • Only emails people who will actually be charged: auto_renew on, not
//     cancelled, and a real PayU mandate stored. No point alarming someone
//     whose card will never be debited.
//   • Duplicate-safe: records which billing date was warned about, so a
//     customer can never be emailed twice for the same charge, and the
//     reminder re-arms by itself next cycle.
//   • Dry-run mode: ?dry=1 lists who would be emailed and sends nothing.
//
// Required Supabase secrets:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  — provided automatically
//   RESEND_API_KEY                            — already set
//   RESEND_FROM_EMAIL                         — optional, default below

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY")!;
const FROM         = (Deno.env.get("RESEND_FROM_EMAIL") ?? "Medipost AI <noreply@medipostai.com>").trim();

const APP_URL      = "https://www.medipostai.com";
const SUPPORT_MAIL = "medipost.ai.26@gmail.com";
const WINDOW_HOURS = 36;   // daily cron + dedupe => exactly one reminder
const BATCH_SIZE   = 50;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function inr(amount: number): string {
  return `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function prettyDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
  });
}

function firstName(fullName: string | null, email: string): string {
  const n = (fullName ?? "").trim();
  return n ? n.split(/\s+/)[0] : email.split("@")[0];
}

function buildEmail(opts: {
  name: string; planLabel: string; amount: string; date: string; isTrial: boolean;
}): { subject: string; html: string; text: string } {
  const { name, planLabel, amount, date, isTrial } = opts;

  const subject = isTrial
    ? `Your Medipost AI trial ends tomorrow — ${amount} will be charged`
    : `Your Medipost AI subscription renews tomorrow — ${amount}`;

  const lead = isTrial
    ? `Your 7-day ${planLabel} trial ends on <strong>${date}</strong>. After that, <strong>${amount}/month</strong> will be charged automatically to the payment method you used.`
    : `Your <strong>${planLabel}</strong> plan renews on <strong>${date}</strong>, and <strong>${amount}</strong> will be charged automatically.`;

  const leadText = isTrial
    ? `Your 7-day ${planLabel} trial ends on ${date}. After that, ${amount}/month will be charged automatically to the payment method you used.`
    : `Your ${planLabel} plan renews on ${date}, and ${amount} will be charged automatically.`;

  const text =
`Hi ${name},

${leadText}

Happy to continue? There's nothing to do — it renews by itself.

Would rather not? Cancel before ${date} and you won't be charged:
${APP_URL}/subscription

Questions? Just reply to this email, or write to ${SUPPORT_MAIL}.

— The Medipost AI team`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f8fa;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8fa;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

    <tr><td style="padding:28px 28px 8px;">
      <img src="${APP_URL}/logo-full.png" alt="Medipost AI" width="150" style="display:block;border:0;">
    </td></tr>

    <tr><td style="padding:12px 28px 0;">
      <h1 style="margin:0 0 12px;font-size:21px;line-height:1.3;color:#0d2b36;">
        ${isTrial ? "Your trial ends tomorrow" : "Your subscription renews tomorrow"}
      </h1>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4a5d6b;">Hi ${name},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4a5d6b;">${lead}</p>
    </td></tr>

    <tr><td style="padding:0 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#f4f8fa;border-radius:10px;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;color:#4a5d6b;">Plan</td>
          <td style="padding:16px 18px;font-size:14px;color:#0d2b36;font-weight:600;text-align:right;">${planLabel}</td>
        </tr>
        <tr>
          <td style="padding:0 18px 16px;font-size:14px;color:#4a5d6b;">Amount</td>
          <td style="padding:0 18px 16px;font-size:14px;color:#0d2b36;font-weight:600;text-align:right;">${amount}</td>
        </tr>
        <tr>
          <td style="padding:0 18px 16px;font-size:14px;color:#4a5d6b;">Date</td>
          <td style="padding:0 18px 16px;font-size:14px;color:#0d2b36;font-weight:600;text-align:right;">${date}</td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:20px 28px 0;">
      <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#4a5d6b;">
        <strong style="color:#0d2b36;">Happy to continue?</strong> Nothing to do — it renews by itself.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4a5d6b;">
        <strong style="color:#0d2b36;">Would rather not?</strong> Cancel before ${date} and you won't be charged.
      </p>
    </td></tr>

    <tr><td align="center" style="padding:0 28px 26px;">
      <a href="${APP_URL}/subscription"
         style="display:inline-block;background:#007594;color:#ffffff;text-decoration:none;
                font-size:16px;font-weight:600;padding:13px 30px;border-radius:10px;">
        Manage subscription
      </a>
    </td></tr>

    <tr><td style="padding:0 28px 28px;">
      <div style="border-top:1px solid #e7eef2;padding-top:18px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#4a5d6b;">
          Questions? Just reply to this email, or write to
          <a href="mailto:${SUPPORT_MAIL}" style="color:#007594;">${SUPPORT_MAIL}</a> — a real person reads it.
        </p>
      </div>
    </td></tr>

    <tr><td style="background:#f4f8fa;padding:16px 28px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9aa9b5;">
        Medipost AI · Built for healthcare professionals<br>
        You're receiving this because you have an active Medipost AI subscription.
      </p>
    </td></tr>

  </table>
</td></tr>
</table>
</body></html>`;

  return { subject, html, text };
}

async function sendViaResend(to: string, e: { subject: string; html: string; text: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject: e.subject, html: e.html, text: e.text, reply_to: SUPPORT_MAIL }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
}

Deno.serve(async (req) => {
  const dryRun = new URL(req.url).searchParams.get("dry") === "1";

  try {
    const now    = new Date();
    const cutoff = new Date(now.getTime() + WINDOW_HOURS * 3600_000).toISOString();

    // Only people who will genuinely be charged:
    //   auto_renew on · not cancelled · a real mandate stored · live status
    const { data: due, error } = await supabase
      .from("subscriptions")
      .select("user_id, email, next_billing_date, renewal_reminder_for, status, plans(display_name, price_monthly)")
      .eq("auto_renew", true)
      .is("canceled_at", null)
      .not("payu_subid", "is", null)
      .in("status", ["active", "trialing"])
      .gt("next_billing_date", now.toISOString())
      .lte("next_billing_date", cutoff)
      .limit(BATCH_SIZE);

    if (error) throw new Error(`Query failed: ${error.message}`);

    // Skip anyone already warned about THIS billing date.
    const pending = (due ?? []).filter(
      (s: any) => s.renewal_reminder_for !== s.next_billing_date,
    );

    if (!pending.length) {
      return Response.json({ ok: true, dryRun, found: 0, sent: 0, failed: [] });
    }

    if (dryRun) {
      return Response.json({
        ok: true,
        dryRun: true,
        found: pending.length,
        wouldEmail: pending.map((s: any) => ({
          email:  s.email,
          status: s.status,
          amount: s.plans?.price_monthly,
          on:     s.next_billing_date,
        })),
      });
    }

    let sent = 0;
    const failed: { email: string; error: string }[] = [];

    for (const s of pending as any[]) {
      if (!s.email || !s.plans) continue;
      try {
        const email = buildEmail({
          name:      firstName(null, s.email),
          planLabel: s.plans.display_name ?? "your plan",
          amount:    inr(s.plans.price_monthly ?? 0),
          date:      prettyDate(s.next_billing_date),
          isTrial:   s.status === "trialing",
        });

        await sendViaResend(s.email, email);

        // Stamp the billing date we just warned about — only after a
        // confirmed send, so a failure retries tomorrow rather than
        // silently skipping someone.
        const { error: markErr } = await supabase
          .from("subscriptions")
          .update({ renewal_reminder_for: s.next_billing_date })
          .eq("user_id", s.user_id);

        if (markErr) {
          console.error(`[renewal-reminder] sent to ${s.email} but failed to mark: ${markErr.message}`);
        }
        sent++;
      } catch (e: any) {
        console.error(`[renewal-reminder] send failed for ${s.email}: ${e?.message ?? e}`);
        failed.push({ email: s.email, error: String(e?.message ?? e) });
      }
    }

    console.log(`[renewal-reminder] found=${pending.length} sent=${sent} failed=${failed.length}`);
    return Response.json({ ok: true, dryRun: false, found: pending.length, sent, failed });
  } catch (e: any) {
    console.error("[renewal-reminder] fatal:", e?.message ?? e);
    return Response.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
});
