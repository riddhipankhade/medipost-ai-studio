/**
 * src/lib/api/contact.functions.ts
 *
 * Server function for the landing-page Contact Us form.
 * Sends an email to the clinic inbox via Resend.
 *
 * Required env vars:
 *   RESEND_API_KEY        — your Resend API key
 *   RESEND_FROM_EMAIL     — verified sender, e.g. Medipost AI <noreply@medipostai.com>
 *   CONTACT_TO_EMAIL      — inbox that receives submissions, e.g. office@sayitdoc.com
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name:    z.string().min(1, "Name is required").max(100),
  email:   z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

// Valid Resend sender: "email@domain.com" or "Name <email@domain.com>"
const SENDER_RE = /^([^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/;

const DEFAULT_FROM = "Medipost AI <noreply@medipostai.com>";
const DEFAULT_TO   = "office@sayitdoc.com";

/** Read an env var, strip stray quotes/whitespace, and fall back if blank. */
function cleanEnv(value: string | undefined, fallback: string): string {
  const v = (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
  return v || fallback;
}

/** Escape user input before putting it into the email HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const sendContactEmail = createServerFn({ method: "POST" })
  .validator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY!);

    let from = cleanEnv(process.env.RESEND_FROM_EMAIL, DEFAULT_FROM);
    if (!SENDER_RE.test(from)) {
      console.error(
        `[contact] RESEND_FROM_EMAIL is malformed ("${from}") — falling back to ${DEFAULT_FROM}. Fix it in Vercel env vars.`
      );
      from = DEFAULT_FROM;
    }
    const to = cleanEnv(process.env.CONTACT_TO_EMAIL, DEFAULT_TO);

    const name    = esc(data.name);
    const email   = esc(data.email);
    const message = esc(data.message);

    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: data.email,
      subject: `New contact message from ${data.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#007594;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:13px;width:80px;">Name</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:13px;">Email</td>
              <td style="padding:8px 0;font-size:14px;">
                <a href="mailto:${email}" style="color:#007594;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">Message</td>
              <td style="padding:8px 0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
          <p style="font-size:12px;color:#9ca3af;margin:0;">
            Sent from the Medipost AI contact form · Reply-To is set to the sender's email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[contact] Resend error:", error.message);
      throw new Error("Sorry, we couldn't send your message right now. Please email office@sayitdoc.com directly.");
    }
    return { success: true };
  });