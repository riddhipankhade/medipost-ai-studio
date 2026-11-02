/**
 * src/routes/api/payu-webhook.ts
 *
 * PayU posts here after EVERY payment event — the initial ₹1 trial payment,
 * an initial plan purchase, and each recurring SI auto-debit.
 *
 * This is the server-side source of truth for activation. It exists because
 * browser-side activation (verifyPayUPayment) silently loses payments when a
 * customer pays in their UPI app and never returns to the page.
 *
 * Configure in the PayU dashboard under:
 *   Settings → Webhooks → Create Webhook
 *   URL: https://www.medipostai.com/api/payu-webhook
 *
 * PayU also receives this URL per-request as `notifyUrl` on SI auto-debits
 * (see debitUserSI), so renewals report back even if the dashboard webhook
 * is ever removed.
 */

import { defineEventHandler, readFormData, getQuery, readBody } from "h3";
import { activateSubscriptionFromWebhook } from "@/lib/api/payment.functions";

/**
 * PayU posts form-encoded by default, but some webhook configurations send
 * JSON. Accept both rather than silently failing on one.
 */
async function readPayload(event: any): Promise<Record<string, string>> {
  const contentType = String(event.node?.req?.headers?.["content-type"] ?? "");

  if (contentType.includes("application/json")) {
    const body = await readBody(event).catch(() => null);
    if (body && typeof body === "object") {
      return Object.fromEntries(
        Object.entries(body as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]),
      );
    }
  }

  const form = await readFormData(event).catch(() => null);
  if (form) {
    const out: Record<string, string> = {};
    for (const [k, v] of form.entries()) out[k] = v?.toString() ?? "";
    return out;
  }

  // Last resort: some providers send the payload as query params.
  return Object.fromEntries(
    Object.entries(getQuery(event) ?? {}).map(([k, v]) => [k, String(v ?? "")]),
  );
}

export default defineEventHandler(async (event) => {
  try {
    const p = await readPayload(event);
    const get = (k: string) => p[k] ?? "";

    const txnid = get("txnid");
    if (!txnid) {
      console.error("[payu-webhook] Payload had no txnid. Keys received:", Object.keys(p).join(","));
      return "OK";
    }

    const result = await activateSubscriptionFromWebhook({
      txnid,
      status:      get("status"),
      amount:      get("amount"),
      email:       get("email"),
      firstname:   get("firstname"),
      productinfo: get("productinfo"),
      mihpayid:    get("mihpayid"),
      hash:        get("hash"),
    });

    console.log(`[payu-webhook] txn=${txnid} result=${result.handled}`);

    // PayU expects a plain 200. Returning non-200 makes it retry, which is
    // harmless (the handler is idempotent) but noisy.
    return "OK";
  } catch (e: any) {
    // Log and still return 200: a hash mismatch or unexpected payload should
    // not trigger endless PayU retries. Every failure is logged for review.
    console.error("[payu-webhook] error:", e?.message ?? e);
    return "OK";
  }
});
