// Supabase Edge Function: send-renewal-reminders
// Schedule: runs daily via Supabase cron
// Purpose: sends reminder emails 7 days and 1 day before subscription expiry

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "noreply@medipostai.com";
const APP_URL = "https://www.medipostai.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Medipost AI <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Failed to send email to ${to}:`, err);
  } else {
    console.log(`Email sent to ${to}: ${subject}`);
  }
}

function reminder7DayHtml(email: string, expiresAt: string, plan: string) {
  const date = new Date(expiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <img src="${APP_URL}/logo-full.png" alt="Medipost AI" style="height: 40px; margin-bottom: 24px;" />
      <h2 style="color: #1a1a1a;">Your subscription renews in 7 days</h2>
      <p style="color: #444;">Hi there,</p>
      <p style="color: #444;">
        Your <strong>${plan}</strong> plan will renew on <strong>${date}</strong>.
        If you have auto-renewal enabled, no action is needed — your subscription will continue seamlessly.
      </p>
      <p style="color: #444;">
        If you wish to cancel before renewal, you can do so from your account settings.
      </p>
      <a href="${APP_URL}/app/subscription"
         style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #0d9488; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Manage Subscription
      </a>
      <p style="color: #888; margin-top: 32px; font-size: 13px;">
        If you have any questions, reply to this email or contact us at support@medipostai.com.
      </p>
    </div>
  `;
}

function reminder1DayHtml(email: string, expiresAt: string, plan: string) {
  const date = new Date(expiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <img src="${APP_URL}/logo-full.png" alt="Medipost AI" style="height: 40px; margin-bottom: 24px;" />
      <h2 style="color: #1a1a1a;">Your subscription renews tomorrow</h2>
      <p style="color: #444;">Hi there,</p>
      <p style="color: #444;">
        Your <strong>${plan}</strong> plan expires tomorrow on <strong>${date}</strong>.
        If auto-renewal is enabled, your subscription will renew automatically.
      </p>
      <p style="color: #444;">
        If you wish to cancel, this is your last chance to do so before renewal.
      </p>
      <a href="${APP_URL}/app/subscription"
         style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #0d9488; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Manage Subscription
      </a>
      <p style="color: #888; margin-top: 32px; font-size: 13px;">
        Questions? Contact us at support@medipostai.com.
      </p>
    </div>
  `;
}

Deno.serve(async (_req) => {
  try {
    const now = new Date();

    // 7-day window: expires between 6.5 and 7.5 days from now
    const in7DaysStart = new Date(now.getTime() + 6.5 * 24 * 60 * 60 * 1000).toISOString();
    const in7DaysEnd   = new Date(now.getTime() + 7.5 * 24 * 60 * 60 * 1000).toISOString();

    // 1-day window: expires between 0.5 and 1.5 days from now
    const in1DayStart = new Date(now.getTime() + 0.5 * 24 * 60 * 60 * 1000).toISOString();
    const in1DayEnd   = new Date(now.getTime() + 1.5 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch 7-day reminders
    const { data: subs7, error: err7 } = await supabase
      .from("subscriptions")
      .select("email, plan, plan_expires_at")
      .eq("status", "active")
      .gte("plan_expires_at", in7DaysStart)
      .lte("plan_expires_at", in7DaysEnd);

    if (err7) throw new Error(`7-day query failed: ${err7.message}`);

    for (const sub of subs7 ?? []) {
      const planLabel = sub.plan === "growth" ? "Growth" : sub.plan === "pro_clinic" ? "Pro Clinic" : sub.plan;
      await sendEmail(
        sub.email,
        "Your Medipost AI subscription renews in 7 days",
        reminder7DayHtml(sub.email, sub.plan_expires_at, planLabel)
      );
    }

    // Fetch 1-day reminders
    const { data: subs1, error: err1 } = await supabase
      .from("subscriptions")
      .select("email, plan, plan_expires_at")
      .eq("status", "active")
      .gte("plan_expires_at", in1DayStart)
      .lte("plan_expires_at", in1DayEnd);

    if (err1) throw new Error(`1-day query failed: ${err1.message}`);

    for (const sub of subs1 ?? []) {
      const planLabel = sub.plan === "growth" ? "Growth" : sub.plan === "pro_clinic" ? "Pro Clinic" : sub.plan;
      await sendEmail(
        sub.email,
        "Your Medipost AI subscription renews tomorrow",
        reminder1DayHtml(sub.email, sub.plan_expires_at, planLabel)
      );
    }

    const total = (subs7?.length ?? 0) + (subs1?.length ?? 0);
    console.log(`Reminders sent: ${total} (7-day: ${subs7?.length ?? 0}, 1-day: ${subs1?.length ?? 0})`);

    return new Response(JSON.stringify({ success: true, total }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Error:", e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
