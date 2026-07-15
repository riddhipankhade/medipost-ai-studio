/**
 * src/components/ContactSection.tsx
 *
 * Landing-page "Contact Us" section — drop it just before the footer.
 *
 * Usage:
 *   import { ContactSection } from "@/components/ContactSection";
 *   <ContactSection />
 *
 * Customise the CLINIC_INFO block below with your real details.
 */

"use client";

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendContactEmail } from "@/lib/api/contact.functions";
import { Mail, Phone, MapPin, MessageCircle, Send, Loader2, CheckCircle2 } from "lucide-react";

// ── Edit these with your real contact details ──────────────────────────────
const CLINIC_INFO = {
  email:   "office@sayitdoc.com",
  phone:   "+91 98765 43210",          // replace with your number
  whatsapp: "919876543210",            // country code + number, no + or spaces
  address: "123, Healthcare Plaza\nAndheri West, Mumbai\nMaharashtra 400058", // replace
};
// ──────────────────────────────────────────────────────────────────────────

export function ContactSection() {
  const submit = useServerFn(sendContactEmail);

  const [form, setForm]   = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submit({ data: form });
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest text-[color:var(--teal)] uppercase mb-2">
            Get in touch
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Contact Us
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Have a question, feedback, or need help? We'd love to hear from you.
            Fill in the form and we'll get back to you shortly.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 items-start">

          {/* ── Left — contact info ── */}
          <div className="space-y-6">

            <InfoCard
              icon={<Mail className="h-5 w-5" />}
              label="Email"
              value={CLINIC_INFO.email}
              href={`mailto:${CLINIC_INFO.email}`}
            />

            <InfoCard
              icon={<Phone className="h-5 w-5" />}
              label="Phone"
              value={CLINIC_INFO.phone}
              href={`tel:${CLINIC_INFO.phone.replace(/\s/g, "")}`}
            />

            <InfoCard
              icon={<MapPin className="h-5 w-5" />}
              label="Address"
              value={CLINIC_INFO.address}
            />

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${CLINIC_INFO.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full rounded-xl border border-[#25D366]/40 bg-[#25D366]/5 px-5 py-4 hover:bg-[#25D366]/10 transition-colors group"
            >
              <span className="h-10 w-10 shrink-0 rounded-full bg-[#25D366] text-white grid place-items-center">
                <WhatsAppIcon />
              </span>
              <div>
                <p className="text-sm font-semibold">Chat on WhatsApp</p>
                <p className="text-xs text-muted-foreground">Usually replies within an hour</p>
              </div>
              <MessageCircle className="h-4 w-4 ml-auto text-[#25D366] opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* ── Right — contact form ── */}
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-10 gap-4">
                <CheckCircle2 className="h-12 w-12 text-[color:var(--teal)]" />
                <div>
                  <p className="text-lg font-semibold">Message sent!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll get back to you at <span className="font-medium">{form.email || "your email"}</span> shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-sm text-[color:var(--teal)] hover:underline mt-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="contact-name">
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Dr. Priya Sharma"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--teal)]/40 focus:border-[color:var(--teal)] transition-all placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="contact-email">
                    Email address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@clinic.com"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--teal)]/40 focus:border-[color:var(--teal)] transition-all placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="contact-message">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="Tell us how we can help…"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--teal)]/40 focus:border-[color:var(--teal)] transition-all placeholder:text-muted-foreground resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[color:var(--teal)] text-white font-semibold py-2.5 px-4 hover:opacity-90 disabled:opacity-60 transition-all"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="h-4 w-4" /> Send message</>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function InfoCard({
  icon, label, value, href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <span className="h-10 w-10 shrink-0 rounded-lg bg-[color:var(--teal)]/10 text-[color:var(--teal)] grid place-items-center mt-0.5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium whitespace-pre-line break-words">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }
  return content;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}