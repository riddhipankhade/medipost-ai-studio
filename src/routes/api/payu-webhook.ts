/**
 * src/routes/api/payu-webhook.ts
 *
 * PayU posts a form-encoded payload here after every SI auto-debit attempt.
 * On success we extend the user's subscription by 30 days.
 *
 * Set this URL in your PayU merchant dashboard under:
 *   Settings → Payment Notifications → SI Notify URL
 * Value: https://<your-domain>/api/payu-webhook
 */

import { defineEventHandler, readFormData } from "h3";
import { activateSubscriptionFromWebhook } from "@/lib/api/payment.functions";

export default defineEventHandler(async (event) => {
  try {
    const form = await readFormData(event);
    const get  = (key: string) => form.get(key)?.toString() ?? "";

    await activateSubscriptionFromWebhook({
      txnid:       get("txnid"),
      status:      get("status"),
      amount:      get("amount"),
      email:       get("email"),
      firstname:   get("firstname"),
      productinfo: get("productinfo"),
      mihpayid:    get("mihpayid"),
      hash:        get("hash"),
    });

    // PayU expects a plain 200 — if we return non-200 it will keep retrying
    return "OK";
  } catch (e: any) {
    console.error("[payu-webhook] error:", e?.message);
    // Still return 200 to stop PayU retrying — we log the error for investigation
    return "ERROR";
  }
});