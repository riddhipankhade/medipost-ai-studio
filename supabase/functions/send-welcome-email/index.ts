// supabase/functions/send-welcome-email/index.ts
//
// Sends the onboarding welcome email to new signups.
//
// Runs on a schedule (every 5 minutes) rather than firing off the signup
// event, because a sweep catches EVERY signup path (email, Google, Apple),
// survives transient failures and retries itself on the next run.
//
// Safety properties:
//   • Only picks up profiles with welcome_email_sent_at IS NULL.
//     Every pre-existing account was stamped by migration 00012 STEP 2,
//     so they can never be emailed retroactively.
//   • Second guard: ignores accounts older than MAX_AGE_DAYS, so even if
//     the column were accidentally cleared, old users are not re-emailed.
//   • Batch-capped per run (BATCH_SIZE).
//   • Marks each user sent individually, immediately after a successful
//     send — one failure can never cause another user to be emailed twice.
//   • Dry-run mode: POST/GET with ?dry=1 lists who WOULD be emailed and
//     sends nothing.
//
// Required Supabase secrets (Edge Function secrets, NOT Vercel env vars):
//   SUPABASE_URL                — provided automatically
//   SUPABASE_SERVICE_ROLE_KEY   — provided automatically
//   RESEND_API_KEY              — set this yourself
//   RESEND_FROM_EMAIL           — optional, defaults below

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY")!;
const FROM         = (Deno.env.get("RESEND_FROM_EMAIL") ?? "Medipost AI <noreply@medipostai.com>").trim();

const APP_URL      = "https://www.medipostai.com";
const DEMO_VIDEO   = `${APP_URL}/demo/medipost-demo-en.mp4`;
const DEMO_THUMB   = `${APP_URL}/video-thumb-english.jpg`;
const SUPPORT_MAIL = "medipost.ai.26@gmail.com";

const BATCH_SIZE   = 25;   // max emails per run
const MAX_AGE_DAYS = 7;    // never email an account older than this

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function firstName(fullName: string | null, email: string): string {
  const n = (fullName ?? "").trim();
  if (n) return n.split(/\s+/)[0];
  return email.split("@")[0];
}

function buildEmail(name: string): { subject: string; html: string; text: string } {
  const subject = "Welcome to Medipost AI — here's how to create your first post";

  const text =
`Hi ${name},

Here's the quickest way to get your clinic's content flowing.

Watch the 50-second demo: ${DEMO_VIDEO}

Three steps to your first post:
1. Set up your Brand Kit — your clinic name, specialty, tone and colours, entered once.
2. Pick a format — single post, carousel, story, reel script, campaign or festive greeting.
3. Generate, then tap "Generate visual" to add images.

Create your first post: ${APP_URL}/generate

Any questions, just reply to this email or write to ${SUPPORT_MAIL}.

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
      <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#0d2b36;">Welcome to Medipost AI, ${name}</h1>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4a5d6b;">
        Medipost turns a short brief into finished, on-brand content for your clinic — posts,
        carousels, stories, reel scripts and more, in about a minute. Here's the quickest way
        to get started.
      </p>
    </td></tr>

    <tr><td style="padding:4px 28px 0;">
      <a href="${DEMO_VIDEO}" style="text-decoration:none;display:block;">
        <img src="${DEMO_THUMB}" alt="Watch the 50-second Medipost AI demo" width="504"
             style="display:block;width:100%;max-width:504px;border:0;border-radius:10px;">
      </a>
      <p style="margin:10px 0 22px;font-size:13px;color:#7b8a99;text-align:center;">
        50-second demo — see a brief become a finished post
      </p>
    </td></tr>

    <tr><td style="padding:0 28px;">
      <h2 style="margin:0 0 14px;font-size:16px;color:#0d2b36;">Three steps to your first post</h2>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="30" valign="top" style="font-size:15px;font-weight:700;color:#007594;padding:0 0 14px;">1.</td>
          <td style="font-size:15px;line-height:1.55;color:#4a5d6b;padding:0 0 14px;">
            <strong style="color:#0d2b36;">Set up your Brand Kit</strong><br>
            Your clinic name, specialty, tone and colours — entered once, applied to everything.
          </td>
        </tr>
        <tr>
          <td width="30" valign="top" style="font-size:15px;font-weight:700;color:#007594;padding:0 0 14px;">2.</td>
          <td style="font-size:15px;line-height:1.55;color:#4a5d6b;padding:0 0 14px;">
            <strong style="color:#0d2b36;">Pick a format</strong><br>
            Single post, carousel, story, reel script, awareness campaign or festive greeting.
          </td>
        </tr>
        <tr>
          <td width="30" valign="top" style="font-size:15px;font-weight:700;color:#007594;padding:0 0 18px;">3.</td>
          <td style="font-size:15px;line-height:1.55;color:#4a5d6b;padding:0 0 18px;">
            <strong style="color:#0d2b36;">Generate, then add visuals</strong><br>
            Tap <em>Generate visual</em> on a post, or <em>Generate all</em> to illustrate every carousel slide.
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td align="center" style="padding:6px 28px 28px;">
      <a href="${APP_URL}/generate"
         style="display:inline-block;background:#007594;color:#ffffff;text-decoration:none;
                font-size:16px;font-weight:600;padding:14px 32px;border-radius:10px;">
        Create your first post
      </a>
    </td></tr>

    <tr><td style="padding:0 28px 28px;">
      <div style="border-top:1px solid #e7eef2;padding-top:18px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#4a5d6b;">
          Stuck on anything? Just reply to this email, or write to
          <a href="mailto:${SUPPORT_MAIL}" style="color:#007594;">${SUPPORT_MAIL}</a> — a real person reads it.
        </p>
      </div>
    </td></tr>

    <tr><td style="background:#f4f8fa;padding:16px 28px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9aa9b5;">
        Medipost AI · Built for healthcare professionals<br>
        You're receiving this because you created a Medipost AI account.
      </p>
    </td></tr>

  </table>
</td></tr>
</table>
</body></html>`;

  return { subject, html, text };
}

async function sendViaResend(to: string, name: string): Promise<void> {
  const { subject, html, text } = buildEmail(name);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html, text, reply_to: SUPPORT_MAIL }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
}

Deno.serve(async (req) => {
  const params = new URL(req.url).searchParams;
  const dryRun = params.get("dry") === "1";

  // ?all=1 — ONE-OFF backfill switch. Bypasses the MAX_AGE_DAYS guard so a
  // deliberate send to the whole existing user base is possible. Routine
  // scheduled runs must NEVER pass this: without the age guard, any future
  // accidental clearing of welcome_email_sent_at would re-email everyone.
  const sendAll = params.get("all") === "1";

  try {
    const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86400_000).toISOString();

    let query = supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .is("welcome_email_sent_at", null);

    if (!sendAll) query = query.gte("created_at", cutoff);

    const { data: pending, error } = await query
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) throw new Error(`Query failed: ${error.message}`);

    if (!pending?.length) {
      return Response.json({ ok: true, dryRun, sendAll, found: 0, sent: 0, failed: 0 });
    }

    if (dryRun) {
      return Response.json({
        ok: true,
        dryRun: true,
        sendAll,
        found: pending.length,
        wouldEmail: pending.map((p) => p.email),
      });
    }

    let sent = 0;
    const failed: { email: string; error: string }[] = [];

    for (const p of pending) {
      if (!p.email) continue;
      try {
        await sendViaResend(p.email, firstName(p.full_name, p.email));

        // Stamp immediately after a confirmed send, per user. If this
        // update fails the user may get one duplicate on the next run —
        // preferable to marking before sending, which would silently
        // skip someone who never received anything.
        const { error: markErr } = await supabase
          .from("profiles")
          .update({ welcome_email_sent_at: new Date().toISOString() })
          .eq("id", p.id);

        if (markErr) {
          console.error(`[welcome] sent to ${p.email} but failed to mark: ${markErr.message}`);
        }
        sent++;
      } catch (e: any) {
        console.error(`[welcome] send failed for ${p.email}: ${e?.message ?? e}`);
        failed.push({ email: p.email, error: String(e?.message ?? e) });
      }
    }

    console.log(`[welcome] found=${pending.length} sent=${sent} failed=${failed.length}`);
    return Response.json({ ok: true, dryRun: false, sendAll, found: pending.length, sent, failed });
  } catch (e: any) {
    console.error("[welcome] fatal:", e?.message ?? e);
    return Response.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
});
