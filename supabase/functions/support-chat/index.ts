// supabase/functions/support-chat/index.ts
//
// The in-app support chatbot's backend. RULE-BASED — no AI model is called,
// so this costs nothing in Gemini tokens.
//
// How it answers:
//   • The customer taps a prebuilt question → that entry's answer, exactly.
//   • The customer types freely → matched against the keyword lists in
//     knowledge-base.json. A confident match gives that entry's answer.
//   • No confident match → handed to the support team. It never improvises.
//
// What that means in practice: coverage is exactly what is written in the
// knowledge base. To make the bot handle a new question, add an entry with
// its keywords. Phrasings nobody anticipated will escalate rather than be
// answered — which is the intended behaviour, not a failure.
//
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
// (all provided automatically). No GEMINI_API_KEY — deliberately.
//
// Deploy WITH JWT verification (no --no-verify-jwt):
//   supabase functions deploy support-chat

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import kb from "./knowledge-base.json" with { type: "json" };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM  = (Deno.env.get("RESEND_FROM_EMAIL") ?? "Medipost AI <noreply@medipostai.com>").trim();

const MAX_MESSAGE_CHARS  = 4000;  // matches the CHECK on support_messages
const RATE_WINDOW_MIN    = 5;
const RATE_MAX_IN_WINDOW = 30;    // abuse guard only; there is no per-call cost

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Matching
// ─────────────────────────────────────────────────────────────────────────

type Entry = {
  id: string; intent: string; category: string; escalate?: boolean;
  q: string; a: string; keywords?: string[]; note?: string;
};

const ENTRIES = (kb as any).entries as Entry[];
const FALLBACK = (kb as any).fallback as { noMatch: string; escalated: string };

/**
 * Normalise before comparing. Lower-cases, strips punctuation and collapses
 * whitespace, so "Image generate nahi ho raha!!" and "image generate nahi ho
 * raha" are the same string. Devanagari and other Indic scripts are left
 * intact — only ASCII punctuation is removed.
 */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Words too common to carry meaning — they would match everything.
 *
 * "tell" and "about" are in here for a concrete reason: without them,
 * "tell me about the weather" scored 0.50 against the medicine entry purely
 * on those two words and got answered instead of escalated. Generic verbs
 * leak across every entry and have to be excluded.
 *
 * Hindi/Hinglish function words are included for the same reason — "kya",
 * "hai", "nahi", "kaise" appear in almost every Hinglish question.
 */
const STOP = new Set([
  "the", "a", "an", "is", "are", "am", "do", "does", "did", "i", "me", "my",
  "we", "our", "you", "your", "it", "its", "to", "of", "in", "on", "for",
  "and", "or", "but", "can", "cant", "cannot", "how", "what", "why", "when",
  "where", "which", "please", "help", "hi", "hello", "there", "this", "that",
  "tell", "about", "want", "need", "give", "get", "got", "know", "like",
  "make", "made", "use", "using", "any", "some", "from", "with", "have",
  "has", "had", "been", "will", "would", "should", "could", "just", "also",
  "very", "much", "more", "than", "then", "now", "app",
  "mera", "meri", "mujhe", "kya", "hai", "ho", "ka", "ki", "ke", "ko", "se",
  "main", "nahi", "raha", "rahi", "kar", "karo", "kaise", "hoga",
]);

/**
 * Anything medical goes to the out-of-scope answer regardless of score.
 *
 * Without this, "what dosage of paracetamol" scored 0.33 — below the
 * threshold — and would have been escalated to a human rather than answered
 * with the out-of-scope message. For a healthcare product, a clear "we don't
 * do medical advice, see a clinician" is the right reply every time, and it
 * must not depend on whether the drug name happens to be in a keyword list.
 */
const SAFETY_TRIGGERS = [
  "medicine", "medicines", "dosage", "dose", "tablet", "capsule", "drug",
  "prescription", "treatment", "diagnosis", "symptom", "symptoms",
  "antibiotic", "syrup", "paracetamol", "dawa", "dawai", "ilaj",
];
const SAFETY_ENTRY_ID = "kb-037";

function contentWords(s: string): string[] {
  return normalise(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w));
}

/**
 * Scores one entry against the customer's message.
 *
 * A keyword phrase appearing verbatim is the strongest signal — "image
 * generate nahi ho raha" contains the whole phrase "image generate nahi ho
 * raha", so that entry wins outright. Otherwise individual meaningful words
 * are counted, with longer words weighted higher because they are more
 * specific ("watermark" says more than "post").
 *
 * The score is normalised by how much of the customer's message was
 * explained, so a two-word match on a twenty-word message does not win.
 */
function score(message: string, entry: Entry): number {
  const norm = normalise(message);
  const words = contentWords(message);
  if (!words.length) return 0;

  let best = 0;
  const phrases = [entry.q, ...(entry.keywords ?? [])];

  // A verbatim phrase hit scores ABOVE 1.0, so it always outranks pure word
  // overlap. This matters: "image generate nahi ho raha" overlaps perfectly
  // with the image-limit entry on the words "image" and "generate", but it
  // matches the image-not-generating entry word for word. Without this,
  // the two tied and the wrong one won on array order.
  for (const p of phrases) {
    const np = normalise(p);
    if (!np) continue;
    const len = np.split(" ").length;
    if (len >= 2 && norm.includes(np)) {
      best = Math.max(best, 1 + 0.02 * len);
    }
  }

  // Word overlap, capped below 1.0 so it can never beat a verbatim phrase.
  const entryWords = new Set<string>();
  for (const p of phrases) for (const w of contentWords(p)) entryWords.add(w);

  let hitWeight = 0, totalWeight = 0;
  for (const w of words) {
    const weight = w.length >= 7 ? 2 : 1;
    totalWeight += weight;
    if (entryWords.has(w)) hitWeight += weight;
  }
  if (totalWeight > 0) best = Math.max(best, Math.min(0.99, hitWeight / totalWeight));

  return best;
}

const MATCH_THRESHOLD = 0.45;   // below this, hand to a human
const AMBIGUOUS_GAP   = 0.08;   // two entries this close = not confident

/**
 * Phrases that mean "your last answer didn't solve it".
 *
 * This matters because the matcher has no memory — it scores each message on
 * its own words. "It is still missing", sent straight after the password-reset
 * answer, was matching the content-disappeared entry on the word "missing" and
 * replying about Content History. Nonsense, and exactly the moment a customer
 * needs a person.
 *
 * So: once an answer has already been given in this thread, any of these turns
 * the conversation over to the team rather than matching again. Deliberately
 * only explicit signals — a plain new question like "how do I cancel" must
 * still be answered normally, so sentence length and pronouns are not used.
 */
const FOLLOWUP_SIGNALS = [
  // Only phrases that can ONLY mean "again / already / that didn't help".
  // Bare "not working" and "nahi ho raha" are deliberately NOT here: those
  // are how a customer reports a problem for the FIRST time ("image generate
  // nahi ho raha"), and treating them as follow-ups would send a perfectly
  // answerable first question straight to a human.
  "still", "phir bhi", "abhi bhi",
  "already tried", "tried that", "tried it",
  "same problem", "same issue", "same error",
  "didn't help", "didnt help", "not helping", "no help", "not helpful",
  "not solved", "that's not", "thats not", "wrong answer", "not what i",
  "fayda nahi", "koi fayda",
];

function looksLikeFollowUp(message: string): boolean {
  const n = normalise(message);
  return FOLLOWUP_SIGNALS.some((s) => n.includes(normalise(s)));
}

type Match = { entry: Entry | null; confidence: number };

function match(message: string): Match {
  // Safety first, before any scoring — see SAFETY_TRIGGERS above.
  const norm = normalise(message);
  for (const t of SAFETY_TRIGGERS) {
    if (new RegExp(`(?<![\\p{L}])${t}(?![\\p{L}])`, "u").test(norm)) {
      const safety = ENTRIES.find((e) => e.id === SAFETY_ENTRY_ID);
      if (safety) return { entry: safety, confidence: 1 };
    }
  }

  const ranked = ENTRIES
    .map((e) => ({ e, s: score(message, e) }))
    .sort((a, b) => b.s - a.s);

  const top = ranked[0];
  const second = ranked[1];

  if (!top || top.s < MATCH_THRESHOLD) return { entry: null, confidence: top?.s ?? 0 };

  // Two entries scoring almost the same means the message is ambiguous.
  // Guessing between them is worse than asking a human to look.
  if (second && top.s - second.s < AMBIGUOUS_GAP && top.s < 0.75) {
    return { entry: null, confidence: top.s };
  }

  return { entry: top.e, confidence: top.s };
}

// ─────────────────────────────────────────────────────────────────────────
// Telling the team
// ─────────────────────────────────────────────────────────────────────────

/**
 * Emails the support inbox when a conversation is handed over.
 *
 * Without this the escalation is only a database row, and the bot's promise
 * that "they'll reply to the email on your account" is not true until someone
 * happens to query the table. The whole transcript goes in the email so the
 * team can answer without logging in anywhere.
 *
 * Deliberately best-effort: if Resend is down or the key is missing, the
 * escalation row is still written and the customer still gets their reply.
 * A notification failure must never cost us the record of the request.
 */
async function notifySupport(opts: {
  conversationId: string;
  customerEmail: string | null;
  intent: string;
  reason: string;
  transcript: { role: string; content: string }[];
}): Promise<void> {
  if (!RESEND_KEY) {
    console.error("[support-chat] RESEND_API_KEY not set — escalation saved but nobody emailed");
    return;
  }

  const to = (kb as any).facts.support.email as string;
  const who = opts.customerEmail ?? "unknown account";

  const lines = opts.transcript
    .map((m) => `${m.role === "user" ? "Customer" : "Bot"}: ${m.content}`)
    .join("\n\n");

  const text =
`A Medipost support chat needs a person.

Customer : ${who}
Intent   : ${opts.intent}
Reason   : ${opts.reason}

────────────── CONVERSATION ──────────────

${lines}

──────────────────────────────────────────

Reply directly to ${who}.
Conversation id: ${opts.conversationId}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: RESEND_FROM,
        to,
        subject: `Support chat — ${opts.intent} — ${who}`,
        text,
        ...(opts.customerEmail ? { reply_to: opts.customerEmail } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`[support-chat] Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
  } catch (e: any) {
    console.error("[support-chat] notify failed:", e?.message ?? e);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    // ── Who is asking ────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Not signed in" }, 401);

    const asUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await asUser.auth.getUser();
    if (authErr || !user) return json({ error: "Not signed in" }, 401);

    // ── Input ────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);

    // The widget asks for the question menu when it opens. Served from this
    // same knowledge base so the buttons and the answers can never drift
    // apart — there is no second copy of the questions in the front end.
    if (body?.action === "menu") {
      const byId = new Map(ENTRIES.map((e) => [e.id, e]));
      const menu = ((kb as any).menu as { category: string; ids: string[] }[])
        .map((g) => ({
          category: g.category,
          questions: g.ids
            .map((id) => byId.get(id))
            .filter(Boolean)
            .map((e) => ({ id: e!.id, q: e!.q })),
        }))
        .filter((g) => g.questions.length > 0);
      return json({ menu });
    }
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const conversationIdIn = typeof body?.conversationId === "string" ? body.conversationId : null;
    // Set when the customer tapped a prebuilt question rather than typing —
    // no matching needed, and the answer is exact.
    const pickedId = typeof body?.entryId === "string" ? body.entryId : null;

    if (!message) return json({ error: "Message is empty" }, 400);
    if (message.length > MAX_MESSAGE_CHARS) {
      return json({ error: `Please keep it under ${MAX_MESSAGE_CHARS} characters.` }, 400);
    }

    // ── Rate limit ───────────────────────────────────────────────
    const sinceWindow = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
    const { count: burst } = await admin
      .from("support_messages")
      .select("id, support_conversations!inner(user_id)", { count: "exact", head: true })
      .eq("role", "user")
      .eq("support_conversations.user_id", user.id)
      .gte("created_at", sinceWindow);

    if ((burst ?? 0) >= RATE_MAX_IN_WINDOW) {
      return json({ error: "That's a lot of messages at once — give it a minute and try again." }, 429);
    }

    // ── Conversation ─────────────────────────────────────────────
    let conversationId = conversationIdIn;

    if (conversationId) {
      // Never trust a conversation id from the client — confirm it is theirs.
      const { data: owned } = await admin
        .from("support_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!owned) conversationId = null;
    }

    if (!conversationId) {
      const { data: created, error: convErr } = await admin
        .from("support_conversations")
        .insert({ user_id: user.id, email: user.email ?? null, title: message.slice(0, 80) })
        .select("id")
        .single();
      if (convErr || !created) throw new Error(`Could not start conversation: ${convErr?.message}`);
      conversationId = created.id;
    }

    // ── Record the customer's turn ───────────────────────────────
    await admin.from("support_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
    });

    // ── Answer ───────────────────────────────────────────────────
    let entry: Entry | null = null;
    let confidence = 1;
    let unresolvedFollowUp = false;

    if (pickedId) {
      // Tapped a prebuilt question — exact, no matching needed.
      entry = ENTRIES.find((e) => e.id === pickedId) ?? null;
    } else {
      // Has this thread already been answered once? If so, a message saying
      // the answer didn't work goes to a human — matching it again produces
      // an unrelated answer and makes the bot look broken.
      const { count: priorAnswers } = await admin
        .from("support_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .eq("role", "assistant");

      if ((priorAnswers ?? 0) > 0 && looksLikeFollowUp(message)) {
        unresolvedFollowUp = true;
      } else {
        const m = match(message);
        entry = m.entry;
        confidence = m.confidence;
      }
    }

    const escalate = unresolvedFollowUp || !entry || entry.escalate === true;
    const reply = unresolvedFollowUp
      ? `Sorry that didn't sort it. I'm handing this to our support team with the whole conversation so they can see what you've already tried — they'll reply to the email on your account.`
      : entry
        ? entry.a + (entry.escalate ? `\n\n${FALLBACK.escalated}` : "")
        : FALLBACK.noMatch;

    await admin.from("support_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: reply.slice(0, MAX_MESSAGE_CHARS),
      intent: unresolvedFollowUp ? "unresolved_followup" : (entry?.intent ?? "unmatched"),
      kb_id: entry?.id ?? null,
      confidence: Math.max(0, Math.min(1, Number(confidence.toFixed(2)))),
      detected_lang: null,  // not detected without a model; kept for the schema
    });

    if (escalate) {
      // One open escalation per conversation — a second question in the same
      // thread should not create a duplicate ticket for the team.
      const { data: alreadyOpen } = await admin
        .from("support_escalations")
        .select("id")
        .eq("conversation_id", conversationId)
        .neq("status", "resolved")
        .maybeSingle();

      if (!alreadyOpen) {
        const escIntent = unresolvedFollowUp
          ? "unresolved_followup"
          : (entry?.intent ?? "unmatched");
        const escReason = unresolvedFollowUp
          ? "Customer says the answer did not resolve it — read the full thread"
          : entry
            ? `Intent requires a human: ${entry.intent}`
            : `No knowledge base match (best score ${confidence.toFixed(2)})`;

        await admin.from("support_escalations").insert({
          conversation_id: conversationId,
          user_id: user.id,
          email: user.email ?? null,
          intent: escIntent,
          customer_message: message,
          reason: escReason,
        });

        // Email the team the whole thread. Read after the insert so the
        // transcript includes this turn and the reply just written.
        const { data: full } = await admin
          .from("support_messages")
          .select("role, content")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(50);

        await notifySupport({
          conversationId,
          customerEmail: user.email ?? null,
          intent: escIntent,
          reason: escReason,
          transcript: full ?? [{ role: "user", content: message }],
        });
      }
    }

    console.log(
      `[support-chat] user=${user.id} kb=${entry?.id ?? "none"} ` +
      `conf=${confidence.toFixed(2)} escalate=${escalate}`,
    );

    return json({ conversationId, reply, escalated: escalate, kbId: entry?.id ?? null });
  } catch (e: any) {
    // The customer never sees the detail — see the production rule about not
    // exposing provider or database errors.
    console.error("[support-chat] fatal:", e?.message ?? e);
    return json({
      error: "Something went wrong at our end. Please try again, or email " +
             `${(kb as any).facts.support.email} if it keeps happening.`,
    }, 500);
  }
});
