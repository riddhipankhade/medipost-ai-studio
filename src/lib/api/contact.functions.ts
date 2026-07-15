/**
 * src/lib/api/contact.functions.ts
 *
 * Server function for the landing-page Contact Us form.
 * Sends an email to the clinic inbox via Resend.
 *
 * Required env vars:
 *   RESEND_API_KEY        — your Resend API key
 *   RESEND_FROM_EMAIL     — verified sender, e.g. "noreply@yourdomain.com"
 *   CONTACT_TO_EMAIL      — inbox that receives submissions, e.g. "office@sayitdoc.com"
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name:    z.string().min(1, "Name is required").max(100),
  email:   z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export const sendContactEmail = createServerFn({ method: "POST" })
  .validator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const from = process.env.RESEND_FROM_EMAIL ?? "noreply@medipost.ai";
    const to   = process.env.CONTACT_TO_EMAIL  ?? "office@sayitdoc.com";

    const { error } = await resend.emails.send({
      from,
      to,
      reply_to: data.email,
      subject: `New contact message from ${data.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#0d9488;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:13px;width:80px;">Name</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:13px;">Email</td>
              <td style="padding:8px 0;font-size:14px;">
                <a href="mailto:${data.email}" style="color:#0d9488;">${data.email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">Message</td>
              <td style="padding:8px 0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.message}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
          <p style="font-size:12px;color:#9ca3af;margin:0;">
            Sent from the Medipost AI contact form · Reply-To is set to the sender's email.
          </p>
        </div>
      `,
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });