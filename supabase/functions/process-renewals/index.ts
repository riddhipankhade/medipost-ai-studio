// Supabase Edge Function: process-renewals
// Schedule: runs daily via pg_cron
// Purpose: finds subscriptions due for renewal and triggers PayU SI auto-debit

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import crypto from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYU_MERCHANT_KEY = Deno.env.get("PAYU_MERCHANT_KEY")!;
const PAYU_SALT = Deno.env.get("PAYU_SALT")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://www.medipostai.com";

const PLAN_CATALOG: Record<string, { amount: string; productinfo: string }> = {
  growth:     { amount: "499.00", productinfo: "Medipost Growth Plan" },
  pro_clinic: { amount: "999.00", productinfo: "Medipost Pro Clinic Plan" },
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debitUser(userId: string, payuSubId: string, plan: string): Promise<{ success: boolean; error?: string }> {
  const planInfo = PLAN_CATALOG[plan];
  if (!planInfo) return { success: false, error: `Unknown plan: ${plan}` };

  // Optimistic lock — move next_billing_date forward to prevent double-debit
  const claimBefore = new Date().toISOString();
  const retryAt = new Date();
  retryAt.setDate(retryAt.getDate() + 1);

  const { data: claimed } = await supabase
    .from("subscriptions")
    .update({ next_billing_date: retryAt.toISOString() })
    .eq("user_id", userId)
    .eq("auto_renew", true)
    .lte("next_billing_date", claimBefore)
    .select("user_id");

  if (!claimed?.length) {
    return { success: false, error: "Already claimed by concurrent run." };
  }

  const txnid = `si_${userId.replace(/-/g, "").slice(0, 10)}_${Date.now()}`;
  const command = "si_create_auto_debit";

  const var1 = JSON.stringify({
    merchantKey:    PAYU_MERCHANT_KEY,
    subscriptionId: payuSubId,
    requestId:      txnid,
    amount:         planInfo.amount,
    remarks:        `Monthly renewal — ${planInfo.productinfo}`,
    notifyUrl:      `${APP_URL}/api/payu-webhook`,
  });

  const hashString = `${PAYU_MERCHANT_KEY}|${command}|${var1}|${PAYU_SALT}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  try {
    const res = await fetch("https://info.payu.in/merchant/postservice.php?form=2", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ key: PAYU_MERCHANT_KEY, command, var1, hash }).toString(),
    });

    const result = await res.json() as Record<string, unknown>;

    if (String(result.status) === "0") {
      console.error(`[process-renewals] Debit failed for user ${userId}: ${result.msg}`);
      return { success: false, error: String(result.msg ?? "Debit failed") };
    }

    console.log(`[process-renewals] Debit initiated for user ${userId}, txn: ${txnid}`);
    return { success: true };
  } catch (e: any) {
    console.error(`[process-renewals] Network error for user ${userId}:`, e.message);
    return { success: false, error: e.message };
  }
}

Deno.serve(async (_req) => {
  try {
    const now = new Date().toISOString();

    // Find all subscriptions due for renewal (next_billing_date <= now)
    const { data: due, error } = await supabase
      .from("subscriptions")
      .select("user_id, plan, payu_subid, next_billing_date")
      .eq("auto_renew", true)
      .eq("status", "active")
      .not("payu_subid", "is", null)
      .lte("next_billing_date", now);

    if (error) throw new Error(`Query failed: ${error.message}`);

    if (!due?.length) {
      console.log("[process-renewals] No renewals due.");
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[process-renewals] Found ${due.length} subscription(s) due for renewal.`);

    let successCount = 0;
    let failCount = 0;

    for (const sub of due) {
      const result = await debitUser(sub.user_id, sub.payu_subid, sub.plan);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`[process-renewals] Done. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({ success: true, processed: due.length, successCount, failCount }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[process-renewals] Error:", e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
