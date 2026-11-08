// src/components/support-chat.tsx
//
// Floating support chat. Sits bottom-right on every signed-in page.
//
// Rule-based — no AI model is involved. The customer either taps one of the
// prebuilt questions or types freely; the support-chat Edge Function matches
// against its knowledge base and hands anything it can't answer to the team.
//
// The question list is fetched from that same Edge Function rather than
// bundled here. One source of truth: adding a question to knowledge-base.json
// makes it appear in this menu with no front-end change, and a button can
// never exist for a question the backend cannot answer.
//
// Mount it once, inside the signed-in shell:
//   import { SupportChat } from "@/components/support-chat";
//   <SupportChat />

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, LifeBuoy, ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  escalated?: boolean;
};

type MenuGroup = {
  category: string;
  questions: { id: string; q: string }[];
};

const CONV_KEY = "medipost.support-chat.conversation";

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hi — pick a question below, or type your own.",
};

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [menu, setMenu] = useState<MenuGroup[] | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONV_KEY);
      if (saved) setConversationId(saved);
    } catch {
      // Private browsing or storage disabled — chat still works, it just
      // starts a fresh thread each time.
    }
  }, []);

  // Fetch the menu once, the first time the panel is opened.
  useEffect(() => {
    if (!open || menu) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("support-chat", {
          body: { action: "menu" },
        });
        if (!cancelled && !error && Array.isArray(data?.menu)) setMenu(data.menu);
      } catch {
        // No menu is survivable — the free-text box still works.
      }
    })();
    return () => { cancelled = true; };
  }, [open, menu]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, sending, openCategory]);

  async function send(text: string, entryId?: string) {
    const message = text.trim();
    if (!message || sending) return;

    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setOpenCategory(null);
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("support-chat", {
        body: { message, conversationId, entryId },
      });

      if (error) throw error;

      if (data?.error) {
        setMessages((m) => [...m, { role: "assistant", content: data.error }]);
        return;
      }

      if (data?.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        try { window.localStorage.setItem(CONV_KEY, data.conversationId); } catch { /* ignore */ }
      }

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, escalated: data.escalated === true },
      ]);
    } catch (e) {
      // Never show the raw error — see the production rule on exposing
      // provider failures to customers.
      console.error("[support-chat] send failed:", e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I couldn't reach our servers just then. Try again in a moment, " +
            "or email medipost.ai.26@gmail.com and the team will pick it up.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  /**
   * Start a fresh thread.
   *
   * Only clears this browser's pointer to the conversation — the transcript
   * stays in the database, because an escalated thread is a support record
   * and the team may still be working on it. A customer clearing their chat
   * must not destroy what support is reading.
   */
  function clearChat() {
    setMessages([GREETING]);
    setConversationId(null);
    setOpenCategory(null);
    setInput("");
    try { window.localStorage.removeItem(CONV_KEY); } catch { /* ignore */ }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open support chat"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full
                   bg-[color:var(--teal)] text-white shadow-lg transition-transform hover:scale-105
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  const activeGroup = menu?.find((g) => g.category === openCategory) ?? null;

  return (
    <div
      className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col bg-background shadow-2xl
                 sm:bottom-5 sm:right-5 sm:h-[600px] sm:max-h-[85vh] sm:w-[380px] sm:rounded-2xl sm:border sm:border-border"
      role="dialog"
      aria-label="Support chat"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 sm:rounded-t-2xl">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--teal)]/15 text-[color:var(--teal)]">
          <LifeBuoy className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Medipost Support</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Mon–Fri, 10am–6pm IST
          </p>
        </div>
        {messages.length > 1 && (
          <button
            type="button"
            onClick={clearChat}
            aria-label="Start a new chat"
            title="Start a new chat"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close support chat"
          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={[
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-sm bg-[color:var(--teal)] text-white"
                  : "rounded-bl-sm bg-accent text-foreground",
              ].join(" ")}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-accent px-3.5 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Looking that up…
            </div>
          </div>
        )}

        {/* Question menu. Categories first, then that category's questions —
            45 buttons at once would be unusable on a phone. */}
        {!sending && menu && (
          <div className="pt-1">
            {!activeGroup ? (
              <div className="space-y-1.5">
                <p className="px-0.5 pb-0.5 text-[11px] font-medium text-muted-foreground">
                  Common questions
                </p>
                {menu.map((g) => (
                  <button
                    key={g.category}
                    type="button"
                    onClick={() => setOpenCategory(g.category)}
                    className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-xs
                               font-medium transition-colors hover:border-[color:var(--teal)]/50 hover:bg-accent"
                  >
                    {g.category}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setOpenCategory(null)}
                  className="flex items-center gap-1 px-0.5 pb-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-3 w-3" />
                  {activeGroup.category}
                </button>
                {activeGroup.questions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => send(q.q, q.id)}
                    className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-xs
                               text-muted-foreground transition-colors hover:border-[color:var(--teal)]/50 hover:text-foreground"
                  >
                    {q.q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border p-3 sm:rounded-b-2xl">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder="Or type your question…"
            className="max-h-28 min-h-[40px] flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2
                       text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none
                       focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => send(input)}
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="h-10 w-10 shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Never share passwords, OTPs or card details here.
        </p>
      </div>
    </div>
  );
}
